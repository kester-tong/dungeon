import { Tileset } from './tileset.js';

export interface TileLayer {
    tileIndex: number;
    visible: boolean;
}

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileset: Tileset;
    private tileSize: number;
    
    // Store the current view state for diffing
    private currentView: TileLayer[][][];
    
    constructor(canvas: HTMLCanvasElement, tileset: Tileset, tileSize: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('2D rendering context not available.');
        }
        
        this.tileset = tileset;
        this.tileSize = tileSize;
        this.currentView = [];
    }
    
    /**
     * Render the given view to the canvas, only updating what has changed
     * @param newView A 3D array of tile indices [y][x][layerIndex] where each position can have multiple layers
     */
    public render(newView: TileLayer[][][]): void {
        // Initialize currentView if it's empty
        if (this.currentView.length === 0) {
            this.currentView = this.deepCloneView(newView);
            this.renderFullView(newView);
            return;
        }
        
        // Ensure dimensions match or default to full render
        if (newView.length !== this.currentView.length || 
            newView[0].length !== this.currentView[0].length) {
            this.currentView = this.deepCloneView(newView);
            this.renderFullView(newView);
            return;
        }
        
        // Perform diffing and update only changed tiles
        this.renderDiff(newView);
        
        // Update the current view
        this.currentView = this.deepCloneView(newView);
    }
    
    /**
     * Render the full view from scratch
     */
    private renderFullView(view: TileLayer[][][]): void {
        // Clear the canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render each tile
        for (let y = 0; y < view.length; y++) {
            for (let x = 0; x < view[y].length; x++) {
                this.renderTileLayers(x, y, view[y][x]);
            }
        }
    }
    
    /**
     * Render only the tiles that have changed
     */
    private renderDiff(newView: TileLayer[][][]): void {
        for (let y = 0; y < newView.length; y++) {
            for (let x = 0; x < newView[y].length; x++) {
                if (!this.areTileLayersEqual(newView[y][x], this.currentView[y][x])) {
                    // Clear this tile position with black
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(
                        x * this.tileSize, 
                        y * this.tileSize, 
                        this.tileSize, 
                        this.tileSize
                    );
                    
                    // Render the new tile layers
                    this.renderTileLayers(x, y, newView[y][x]);
                }
            }
        }
    }
    
    /**
     * Render all layers for a specific tile position
     */
    private renderTileLayers(x: number, y: number, layers: TileLayer[]): void {
        const pixelX = x * this.tileSize;
        const pixelY = y * this.tileSize;
        
        // Render each visible layer in order (bottom to top)
        for (const layer of layers) {
            if (layer.visible) {
                this.tileset.drawTile(
                    this.ctx,
                    layer.tileIndex,
                    pixelX,
                    pixelY
                );
            }
        }
    }
    
    /**
     * Compare two tile layer arrays to see if they are equal
     */
    private areTileLayersEqual(layers1: TileLayer[], layers2: TileLayer[]): boolean {
        if (layers1.length !== layers2.length) {
            return false;
        }
        
        for (let i = 0; i < layers1.length; i++) {
            if (layers1[i].tileIndex !== layers2[i].tileIndex ||
                layers1[i].visible !== layers2[i].visible) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Create a deep clone of the view to avoid reference issues
     */
    private deepCloneView(view: TileLayer[][][]): TileLayer[][][] {
        return JSON.parse(JSON.stringify(view));
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