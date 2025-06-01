import { Tileset } from './tileset.js';
import { TownMap } from './map.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private tileset: Tileset;
    private map: TownMap;

    // Game constants
    private static readonly TILE_SIZE = 32;
    
    // Player position in tile coordinates
    private playerTileX: number = 12;
    private playerTileY: number = 7;
    private playerSpeed: number = 5; // tiles per second
    private moveTimer: number = 0;
    private moveDelay: number = 0.2; // seconds between movements

    private keysPressed: { [key: string]: boolean } = {};

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

        this.init();
    }

    private init(): void {
        // Initialize event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        console.log("Game initialized. Canvas dimensions:", this.canvas.width, "x", this.canvas.height);
        console.log("Map dimensions:", this.map.getWidth(), "x", this.map.getHeight(), "tiles");
        
        // Start the game loop
        this.gameLoop(0);
    }

    private handleKeyDown(event: KeyboardEvent): void {
        this.keysPressed[event.key] = true;
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this.keysPressed[event.key] = false;
    }

    private update(deltaTime: number): void {
        // Update movement timer
        this.moveTimer += deltaTime;
        
        // Only allow movement after delay
        if (this.moveTimer >= this.moveDelay) {
            let moved = false;
            
            // Store old position to check if movement is valid
            const oldTileX = this.playerTileX;
            const oldTileY = this.playerTileY;
            
            if (this.keysPressed['ArrowLeft'] || this.keysPressed['a']) {
                this.playerTileX -= 1;
                moved = true;
            } else if (this.keysPressed['ArrowRight'] || this.keysPressed['d']) {
                this.playerTileX += 1;
                moved = true;
            } else if (this.keysPressed['ArrowUp'] || this.keysPressed['w']) {
                this.playerTileY -= 1;
                moved = true;
            } else if (this.keysPressed['ArrowDown'] || this.keysPressed['s']) {
                this.playerTileY += 1;
                moved = true;
            }
            
            // Check if the new position is walkable
            if (moved) {
                if (!this.map.isWalkable(this.playerTileX, this.playerTileY)) {
                    // If not walkable, revert to old position
                    this.playerTileX = oldTileX;
                    this.playerTileY = oldTileY;
                    moved = false;
                }
            }
            
            // Reset movement timer if moved
            if (moved) {
                this.moveTimer = 0;
            }
        }
        
        // Keep player within map bounds
        this.playerTileX = Math.max(0, Math.min(this.map.getWidth() - 1, this.playerTileX));
        this.playerTileY = Math.max(0, Math.min(this.map.getHeight() - 1, this.playerTileY));
    }

    private draw(): void {
        // Clear the canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // First pass: Draw all tiles except the player's position
        for (let y = 0; y < this.map.getHeight(); y++) {
            for (let x = 0; x < this.map.getWidth(); x++) {
                const tile = this.map.getTileAt(x, y);
                const pixelX = x * Game.TILE_SIZE;
                const pixelY = y * Game.TILE_SIZE;
                
                this.tileset.drawTile(this.ctx, tile, pixelX, pixelY);
            }
        }

        // Second pass: Draw the player character with masking
        const characterTileIndex = 18 * 32; // The character tile at index 18*32
        this.tileset.drawTile(
            this.ctx, 
            characterTileIndex, 
            this.playerTileX * Game.TILE_SIZE, 
            this.playerTileY * Game.TILE_SIZE,
            true // Use masking for the character
        );
    }

    private gameLoop(timestamp: number): void {
        const deltaTime = (timestamp - this.lastTime) / 1000; // Convert milliseconds to seconds
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        // Request the next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    public start(): void {
        console.log("Game started!");
    }
}