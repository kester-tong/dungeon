import { Tileset } from './tileset.js';
import { TownMap } from './map.js';
import { CanvasRenderer, RenderTree } from './renderer.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileset: Tileset;
    private map: TownMap;
    private renderer: CanvasRenderer;

    // Game constants
    private static readonly TILE_SIZE = 32;
    private static readonly CHARACTER_TILE_INDEX = 18 * 32; // Character tile index
    
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

        // Create renderer for efficient tile rendering
        this.renderer = new CanvasRenderer(this.canvas, this.tileset, Game.TILE_SIZE);

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
            this.gameLoop();
        } else {
            // If tileset is not loaded yet, wait for it to load
            this.tileset.getImage().addEventListener('load', () => {
                this.gameLoop();
            });
        }
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
        if (!this.tileset.isLoaded()) {
            return;
        }
        
        // Get the map view with the player character
        const renderTree: RenderTree = this.map.getMapViewWithPlayer(
            Game.CHARACTER_TILE_INDEX,
            this.playerTileX,
            this.playerTileY
        );
        
        // Use the renderer to efficiently render only what has changed
        this.renderer.render(renderTree);
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