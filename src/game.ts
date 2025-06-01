import { Tileset } from './tileset.js';
import { CanvasRenderer } from './renderer.js';
import { 
    GameState, 
    GameAction, 
    TILE, 
    createInitialGameState
} from './gameState.js';
import { gameReducer } from './gameReducer.js';
import { render } from './render.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileset: Tileset;
    private renderer: CanvasRenderer;
    
    // The game state holds all game data (immutable)
    private gameState: GameState;
    
    // Track which keys have been processed to prevent repeated movements
    // This is UI state, not game state, so we keep it separate
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

        // Create tileset
        this.tileset = new Tileset('/assets/images/tileset.png');
        
        // Initialize game state with map dimensions
        this.gameState = createInitialGameState(25, 15);

        // Set canvas dimensions based on map size
        this.canvas.width = this.gameState.map.width * TILE.SIZE;
        this.canvas.height = this.gameState.map.height * TILE.SIZE;

        // Create renderer for efficient tile rendering
        this.renderer = new CanvasRenderer(this.canvas, this.tileset, TILE.SIZE);

        this.init();
    }

    private init(): void {
        // Initialize event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        console.log("Game initialized. Canvas dimensions:", this.canvas.width, "x", this.canvas.height);
        console.log("Map dimensions:", this.gameState.map.width, "x", this.gameState.map.height, "tiles");
        
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
     * Dispatch an action to update the game state
     */
    private dispatch(action: GameAction): void {
        // Update game state using the reducer
        console.log('action: ' + JSON.stringify(action))
        this.gameState = gameReducer(this.gameState, action);
        console.log('state: ' + JSON.stringify(this.gameState))
    }

    /**
     * Handle key down events
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // Update game state based on input
        this.dispatch({ type: 'KEY_DOWN', key: event.key });
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
    }
}