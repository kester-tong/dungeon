import { Tileset } from './tileset.js';

/**
 * RenderTree represents the tile-based view to be rendered.
 * It's a 3D array where:
 * - First dimension [y]: rows (top to bottom)
 * - Second dimension [x]: columns (left to right)
 * - Third dimension [layer]: stacked tile indices at position (x,y), ordered from bottom to top
 */
export type RenderTree = number[][][];

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
    private currentTree: RenderTree;
    
    constructor(canvas: HTMLCanvasElement, tileset: Tileset, tileSize: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('2D rendering context not available.');
        }
        
        this.tileset = tileset;
        this.tileSize = tileSize;
        this.currentTree = [];
    }
    
    /**
     * Render the given RenderTree to the canvas, only updating what has changed
     * @param newTree A RenderTree representing the current state to be rendered
     */
    public render(newTree: RenderTree): void {
        // Initialize currentTree if it's empty
        if (this.currentTree.length === 0) {
            this.currentTree = this.deepCloneTree(newTree);
            this.renderFullTree(newTree);
            return;
        }
        
        // Ensure dimensions match or default to full render
        if (newTree.length !== this.currentTree.length || 
            newTree[0].length !== this.currentTree[0].length) {
            this.currentTree = this.deepCloneTree(newTree);
            this.renderFullTree(newTree);
            return;
        }
        
        // Perform diffing and update only changed tiles
        this.renderDiff(newTree);
        
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
        for (let y = 0; y < tree.length; y++) {
            for (let x = 0; x < tree[y].length; x++) {
                this.renderTileLayers(x, y, tree[y][x]);
            }
        }
    }
    
    /**
     * Render only the tiles that have changed
     */
    private renderDiff(newTree: RenderTree): void {
        for (let y = 0; y < newTree.length; y++) {
            for (let x = 0; x < newTree[y].length; x++) {
                if (!this.areTileLayersEqual(newTree[y][x], this.currentTree[y][x])) {
                    // Clear this tile position with black
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(
                        x * this.tileSize, 
                        y * this.tileSize, 
                        this.tileSize, 
                        this.tileSize
                    );
                    
                    // Render the new tile layers
                    this.renderTileLayers(x, y, newTree[y][x]);
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