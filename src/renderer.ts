import { Tileset } from './tileset.js';

/**
 * TileArray represents a tile-based view to be rendered.
 */
export interface TileArray {
    type: 'TileArray';
    /**
     * 3D array of tile indices where:
     * - First dimension [y]: rows (top to bottom)
     * - Second dimension [x]: columns (left to right)
     * - Third dimension [layer]: stacked tile indices at position (x,y), ordered from bottom to top
     */
    tiles: number[][][];
}

/**
 * ChatWindow represents a chat/dialog interface to be rendered.
 */
export interface ChatWindow {
    type: 'ChatWindow';
    messages: string[];
    inputText?: string;
}

/**
 * RenderTree is a labeled union that can be either a TileArray or ChatWindow.
 */
export type RenderTree = TileArray | ChatWindow;

/**
 * CanvasRenderer is responsible for efficiently rendering a RenderTree to a canvas.
 * It performs diffing between consecutive RenderTrees to minimize drawing operations.
 */
export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileset: Tileset;
    private tileSize: number;
    
    // Store the current view state for diffing
    private currentTree: RenderTree | null = null;
    
    constructor(canvas: HTMLCanvasElement, tileset: Tileset, tileSize: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('2D rendering context not available.');
        }
        
        this.tileset = tileset;
        this.tileSize = tileSize;
    }
    
    /**
     * Render the given RenderTree to the canvas, only updating what has changed
     * @param newTree A RenderTree representing the current state to be rendered
     */
    public render(newTree: RenderTree): void {
        if (newTree.type === 'ChatWindow') {
            this.renderChatWindow(newTree);
            return;
        }
        
        // Handle TileArray rendering
        this.renderTileArray(newTree);
    }
    
    /**
     * Render a TileArray to the canvas with diffing
     */
    private renderTileArray(newTree: TileArray): void {
        // Initialize currentTree if it's null or if switching from ChatWindow
        if (!this.currentTree || this.currentTree.type !== 'TileArray') {
            this.currentTree = this.deepCloneTree(newTree);
            this.renderFullTileArray(newTree);
            return;
        }
        
        const currentTileArray = this.currentTree as TileArray;
        
        // Ensure dimensions match or default to full render
        if (newTree.tiles.length !== currentTileArray.tiles.length || 
            newTree.tiles[0].length !== currentTileArray.tiles[0].length) {
            this.currentTree = this.deepCloneTree(newTree);
            this.renderFullTileArray(newTree);
            return;
        }
        
        // Perform diffing and update only changed tiles
        this.renderTileArrayDiff(newTree, currentTileArray);
        
        // Update the current tree
        this.currentTree = this.deepCloneTree(newTree);
    }
    
    /**
     * Render a ChatWindow to the canvas
     */
    private renderChatWindow(chatWindow: ChatWindow): void {
        // Clear the canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set text style
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        
        // Render messages
        let y = 30;
        for (const message of chatWindow.messages) {
            this.ctx.fillText(message, 20, y);
            y += 20;
        }
        
        // Render input text if present
        if (chatWindow.inputText !== undefined) {
            this.ctx.fillStyle = '#ccc';
            this.ctx.fillText('> ' + chatWindow.inputText, 20, this.canvas.height - 30);
        }
        
        // Update current tree
        this.currentTree = this.deepCloneTree(chatWindow);
    }
    
    /**
     * Render the full TileArray from scratch
     */
    private renderFullTileArray(tree: TileArray): void {
        // Clear the canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render each tile
        for (let y = 0; y < tree.tiles.length; y++) {
            for (let x = 0; x < tree.tiles[y].length; x++) {
                this.renderTileLayers(x, y, tree.tiles[y][x]);
            }
        }
    }
    
    /**
     * Render only the tiles that have changed in a TileArray
     */
    private renderTileArrayDiff(newTree: TileArray, currentTree: TileArray): void {
        for (let y = 0; y < newTree.tiles.length; y++) {
            for (let x = 0; x < newTree.tiles[y].length; x++) {
                if (!this.areTileLayersEqual(newTree.tiles[y][x], currentTree.tiles[y][x])) {
                    // Clear this tile position with black
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(
                        x * this.tileSize, 
                        y * this.tileSize, 
                        this.tileSize, 
                        this.tileSize
                    );
                    
                    // Render the new tile layers
                    this.renderTileLayers(x, y, newTree.tiles[y][x]);
                }
            }
        }
    }
    
    /**
     * Render all layers for a specific tile position
     */
    private renderTileLayers(x: number, y: number, tileIndices: number[]): void {
        const pixelX = x * this.tileSize;
        const pixelY = y * this.tileSize;
        
        // Render each layer in order (bottom to top)
        for (const tileIndex of tileIndices) {
            this.tileset.drawTile(
                this.ctx,
                tileIndex,
                pixelX,
                pixelY
            );
        }
    }
    
    /**
     * Compare two tile layer arrays to see if they are equal
     */
    private areTileLayersEqual(indices1: number[], indices2: number[]): boolean {
        if (indices1.length !== indices2.length) {
            return false;
        }
        
        for (let i = 0; i < indices1.length; i++) {
            if (indices1[i] !== indices2[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Create a deep clone of the tree to avoid reference issues
     */
    private deepCloneTree(tree: RenderTree): RenderTree {
        return JSON.parse(JSON.stringify(tree));
    }
    
    /**
     * Get the canvas context
     */
    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
    
    /**
     * Clear the entire canvas
     */
    public clear(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}