import { Tileset } from './tileset.js';

/**
 * TextBox represents a text area to be rendered on the canvas.
 * All dimensions are in tile coordinates (not pixels).
 */
export interface TextBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    text: string;
}

/**
 * RenderTree represents the tile-based view to be rendered.
 * It includes both tile layers and text boxes.
 */
export interface RenderTree {
    /**
     * 3D array of tile indices where:
     * - First dimension [y]: rows (top to bottom)
     * - Second dimension [x]: columns (left to right)
     * - Third dimension [layer]: stacked tile indices at position (x,y), ordered from bottom to top
     */
    tiles: number[][][];
    
    /**
     * Array of text boxes to render on top of the tiles
     */
    textBoxes: TextBox[];
}

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
        // Initialize currentTree if it's null
        if (!this.currentTree) {
            this.currentTree = this.deepCloneTree(newTree);
            this.renderFullTree(newTree);
            return;
        }
        
        // Ensure dimensions match or default to full render
        if (newTree.tiles.length !== this.currentTree.tiles.length || 
            newTree.tiles[0].length !== this.currentTree.tiles[0].length) {
            this.currentTree = this.deepCloneTree(newTree);
            this.renderFullTree(newTree);
            return;
        }
        
        // Perform diffing and update only changed tiles
        this.renderDiff(newTree);
        
        // Always render text boxes (they might be animated or changing)
        this.renderTextBoxes(newTree.textBoxes);
        
        // Update the current tree
        this.currentTree = this.deepCloneTree(newTree);
    }
    
    /**
     * Render the full tree from scratch
     */
    private renderFullTree(tree: RenderTree): void {
        // Clear the canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render each tile
        for (let y = 0; y < tree.tiles.length; y++) {
            for (let x = 0; x < tree.tiles[y].length; x++) {
                this.renderTileLayers(x, y, tree.tiles[y][x]);
            }
        }
        
        // Render text boxes
        this.renderTextBoxes(tree.textBoxes);
    }
    
    /**
     * Render only the tiles that have changed
     */
    private renderDiff(newTree: RenderTree): void {
        if (!this.currentTree) return;
        
        for (let y = 0; y < newTree.tiles.length; y++) {
            for (let x = 0; x < newTree.tiles[y].length; x++) {
                if (!this.areTileLayersEqual(newTree.tiles[y][x], this.currentTree.tiles[y][x])) {
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
     * Render text boxes on the canvas
     */
    private renderTextBoxes(textBoxes: TextBox[]): void {
        this.ctx.font = `${Math.floor(this.tileSize * 0.7)}px monospace`;
        this.ctx.textBaseline = 'middle';
        
        for (const box of textBoxes) {
            // Calculate pixel dimensions
            const startX = box.startX * this.tileSize;
            const startY = box.startY * this.tileSize;
            const width = (box.endX - box.startX + 1) * this.tileSize;
            const height = (box.endY - box.startY + 1) * this.tileSize;
            
            // Clear the text box area with black background
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(startX, startY, width, height);
            
            // Draw the text in white
            this.ctx.fillStyle = '#fff';
            
            // If text contains multiple lines, split and draw each line
            const lines = box.text.split('\n');
            const lineHeight = Math.floor(this.tileSize * 0.9);
            
            for (let i = 0; i < lines.length; i++) {
                this.ctx.fillText(
                    lines[i],
                    startX + Math.floor(this.tileSize * 0.5),
                    startY + Math.floor(this.tileSize * 0.8) + (i * lineHeight)
                );
            }
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