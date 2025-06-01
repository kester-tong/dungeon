import { Tileset } from './tileset.js';
import { TownMap } from './map.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private staticMapCanvas: HTMLCanvasElement;
    private staticMapCtx: CanvasRenderingContext2D;
    private tileset: Tileset;
    private map: TownMap;
    private mapRendered: boolean = false;

    // Game constants
    private static readonly TILE_SIZE = 32;
    
    // Player position in tile coordinates
    private playerTileX: number = 12;
    private playerTileY: number = 7;
    
    // Track which keys have been processed to prevent repeated movements
    private processedKeys: { [key: string]: boolean } = {};

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id ${canvasId} not found.`);
        }
        this.ctx = this.canvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('2D rendering context not available.');
        }

        // Create tileset and map with PNG that has built-in transparency
        this.tileset = new Tileset('/assets/images/tileset.png');
        this.map = new TownMap();

        // Set canvas dimensions based on map size
        this.canvas.width = this.map.getWidth() * Game.TILE_SIZE;
        this.canvas.height = this.map.getHeight() * Game.TILE_SIZE;

        // Create static map canvas for rendering the map once
        this.staticMapCanvas = document.createElement('canvas');
        this.staticMapCanvas.width = this.canvas.width;
        this.staticMapCanvas.height = this.canvas.height;
        this.staticMapCtx = this.staticMapCanvas.getContext('2d')!;
        if (!this.staticMapCtx) {
            throw new Error('Static map 2D rendering context not available.');
        }

        this.init();
    }

    private init(): void {
        // Initialize event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        console.log("Game initialized. Canvas dimensions:", this.canvas.width, "x", this.canvas.height);
        console.log("Map dimensions:", this.map.getWidth(), "x", this.map.getHeight(), "tiles");
        
        // Start the game loop after the tileset is loaded
        if (this.tileset.isLoaded()) {
            this.renderStaticMap();
            this.gameLoop();
        } else {
            // If tileset is not loaded yet, wait for it to load
            this.tileset.getImage().addEventListener('load', () => {
                this.renderStaticMap();
                this.gameLoop();
            });
        }
    }
    
    private renderStaticMap(): void {
        // Only render the static map once
        if (this.mapRendered) return;
        
        // Clear the static map canvas
        this.staticMapCtx.fillStyle = '#000';
        this.staticMapCtx.fillRect(0, 0, this.staticMapCanvas.width, this.staticMapCanvas.height);
        
        // Draw all map tiles to the static map canvas
        for (let y = 0; y < this.map.getHeight(); y++) {
            for (let x = 0; x < this.map.getWidth(); x++) {
                const tile = this.map.getTileAt(x, y);
                const pixelX = x * Game.TILE_SIZE;
                const pixelY = y * Game.TILE_SIZE;
                
                this.tileset.drawTile(this.staticMapCtx, tile, pixelX, pixelY);
            }
        }
        
        this.mapRendered = true;
        console.log("Static map rendered");
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Only process the key if it hasn't been processed yet
        if (!this.processedKeys[event.key]) {
            const oldTileX = this.playerTileX;
            const oldTileY = this.playerTileY;
            let moved = false;
            
            // Handle movement based on key pressed
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                    this.playerTileX -= 1;
                    moved = true;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.playerTileX += 1;
                    moved = true;
                    break;
                case 'ArrowUp':
                case 'w':
                    this.playerTileY -= 1;
                    moved = true;
                    break;
                case 'ArrowDown':
                case 's':
                    this.playerTileY += 1;
                    moved = true;
                    break;
            }
            
            // Check if the new position is walkable
            if (moved) {
                // Keep player within map bounds
                this.playerTileX = Math.max(0, Math.min(this.map.getWidth() - 1, this.playerTileX));
                this.playerTileY = Math.max(0, Math.min(this.map.getHeight() - 1, this.playerTileY));
                
                // Check walkable state
                if (!this.map.isWalkable(this.playerTileX, this.playerTileY)) {
                    // If not walkable, revert to old position
                    this.playerTileX = oldTileX;
                    this.playerTileY = oldTileY;
                }
                
                // Mark the key as processed to prevent repeated movements
                this.processedKeys[event.key] = true;
            }
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        // Clear the processed state when key is released
        delete this.processedKeys[event.key];
    }


    private draw(): void {
        // Ensure the static map is rendered
        if (!this.mapRendered && this.tileset.isLoaded()) {
            this.renderStaticMap();
        }
        
        // Clear the main canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Step 1: Copy the pre-rendered static map to the main canvas in one operation
        if (this.mapRendered) {
            this.ctx.drawImage(this.staticMapCanvas, 0, 0);
        } else {
            // Fallback if static map is not yet rendered
            for (let y = 0; y < this.map.getHeight(); y++) {
                for (let x = 0; x < this.map.getWidth(); x++) {
                    const tile = this.map.getTileAt(x, y);
                    const pixelX = x * Game.TILE_SIZE;
                    const pixelY = y * Game.TILE_SIZE;
                    
                    this.tileset.drawTile(this.ctx, tile, pixelX, pixelY);
                }
            }
        }

        // Step 2: Draw just the player character on top of the map
        const characterTileIndex = 18 * 32; // The character tile at index 18*32
        this.tileset.drawTile(
            this.ctx, 
            characterTileIndex, 
            this.playerTileX * Game.TILE_SIZE, 
            this.playerTileY * Game.TILE_SIZE
        );
    }

    private gameLoop(): void {
        this.draw();

        // Request the next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    public start(): void {
        console.log("Game started!");
    }
}