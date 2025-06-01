import { Tileset } from './tileset.js';
import { CanvasRenderer, RenderTree, TextBox } from './renderer.js';
import { GameState } from './gameState.js';

/**
 * Pure function that transforms GameState into a RenderTree
 * (analogous to React's functional components or render methods)
 */
export function render(state: GameState): RenderTree {
    // Create the tiles array from the game state
    const tiles: number[][][] = Array(state.getMapHeight()).fill(null).map((_, y) => 
        Array(state.getMapWidth()).fill(null).map((_, x) => {
            // Start with the base tile
            const tileLayers = [state.getTileAt(x, y)];
            
            // Add player if at this position
            if (x === state.getPlayerX() && y === state.getPlayerY()) {
                tileLayers.push(GameState.CHARACTER_TILE_INDEX);
            }
            
            return tileLayers;
        })
    );
    
    // Return the complete render tree
    return {
        tiles,
        textBoxes: state.getTextBoxes()
    };
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileset: Tileset;
    private renderer: CanvasRenderer;
    
    // The game state holds all game data
    private gameState: GameState;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id ${canvasId} not found.`);
        }
        this.ctx = this.canvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('2D rendering context not available.');
        }

        // Create tileset
        this.tileset = new Tileset('/assets/images/tileset.png');
        
        // Initialize game state with map dimensions
        this.gameState = new GameState(40, 22);
        
        // Initialize the map with town layout
        this.gameState.createTownLayout();

        // Set canvas dimensions based on map size
        this.canvas.width = this.gameState.getMapWidth() * GameState.TILE_SIZE;
        this.canvas.height = this.gameState.getMapHeight() * GameState.TILE_SIZE;

        // Create renderer for efficient tile rendering
        this.renderer = new CanvasRenderer(this.canvas, this.tileset, GameState.TILE_SIZE);

        this.init();
    }

    private init(): void {
        // Initialize event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        console.log("Game initialized. Canvas dimensions:", this.canvas.width, "x", this.canvas.height);
        console.log("Map dimensions:", this.gameState.getMapWidth(), "x", this.gameState.getMapHeight(), "tiles");
        
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

    /**
     * Handle key down events
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // Update game state based on input
        this.updateFromInput(event.key, true);
    }

    /**
     * Handle key up events
     */
    private handleKeyUp(event: KeyboardEvent): void {
        // Update game state based on input
        this.updateFromInput(event.key, false);
    }

    /**
     * Update game state based on user input
     */
    private updateFromInput(key: string, isKeyDown: boolean): void {
        if (isKeyDown) {
            // Only process the key if it hasn't been processed yet
            if (!this.gameState.isKeyProcessed(key)) {
                let dx = 0;
                let dy = 0;
                
                // Determine direction based on key pressed
                switch (key) {
                    case 'ArrowLeft':
                    case 'a':
                        dx = -1;
                        break;
                    case 'ArrowRight':
                    case 'd':
                        dx = 1;
                        break;
                    case 'ArrowUp':
                    case 'w':
                        dy = -1;
                        break;
                    case 'ArrowDown':
                    case 's':
                        dy = 1;
                        break;
                }
                
                // Try to move the player
                if (dx !== 0 || dy !== 0) {
                    const moved = this.gameState.movePlayer(dx, dy);
                    if (moved) {
                        // Mark the key as processed to prevent repeated movements
                        this.gameState.setKeyProcessed(key, true);
                    }
                }
            }
        } else {
            // Key is released, clear processed state
            this.gameState.setKeyProcessed(key, false);
        }
    }

    /**
     * Draw the current game state to the canvas
     */
    private draw(): void {
        if (!this.tileset.isLoaded()) {
            return;
        }
        
        // Create render tree from game state using the pure render function
        const renderTree = render(this.gameState);
        
        // Use the renderer to efficiently render only what has changed
        this.renderer.render(renderTree);
    }

    /**
     * Main game loop
     */
    private gameLoop(): void {
        // Render the current game state
        this.draw();

        // Request the next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Start the game
     */
    public start(): void {
        console.log("Game started!");
        
        // Show a welcome message in a text box
        this.showWelcomeMessage();
    }
    
    /**
     * Display a welcome message in a text box
     */
    private showWelcomeMessage(): void {
        // Clear any existing text boxes
        this.gameState.clearTextBoxes();
        
        // Add a welcome message at the bottom of the screen
        const textBox: TextBox = {
            startX: 2,
            startY: this.gameState.getMapHeight() - 5,
            endX: this.gameState.getMapWidth() - 3,
            endY: this.gameState.getMapHeight() - 2,
            text: "Welcome to the Dungeon Game!\nUse arrow keys or WASD to move around.\nExplore the town and enter buildings."
        };
        
        this.gameState.addTextBox(textBox);
    }
}