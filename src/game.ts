import { Tileset } from './tileset.js';
import { CanvasRenderer, RenderTree, TextBox } from './renderer.js';
import { 
    GameState, 
    GameAction, 
    GameStateUtils, 
    TILE, 
    createInitialGameState, 
    gameReducer 
} from './gameState.js';

/**
 * Pure function that transforms GameState into a RenderTree
 * (analogous to React's functional components or render methods)
 */
export function render(state: GameState): RenderTree {
    // Create the tiles array from the game state
    const tiles: number[][][] = Array(state.map.height).fill(null).map((_, y) => 
        Array(state.map.width).fill(null).map((_, x) => {
            // Start with the base tile
            const tileLayers = [GameStateUtils.getTileAt(state, x, y)];
            
            // Add player if at this position
            if (x === state.player.x && y === state.player.y) {
                tileLayers.push(TILE.CHARACTER);
            }
            
            return tileLayers;
        })
    );
    
    // Return the complete render tree
    return {
        tiles,
        textBoxes: state.textBoxes
    };
}

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
        this.gameState = createInitialGameState(40, 22);

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
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

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
        this.gameState = gameReducer(this.gameState, action);
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
            if (!this.processedKeys[key]) {
                // Check if it's a movement key
                const isMovementKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
                                       'a', 'd', 'w', 's'].includes(key);
                
                if (isMovementKey) {
                    // Save old position to detect if player actually moved
                    const oldX = this.gameState.player.x;
                    const oldY = this.gameState.player.y;
                    
                    // Dispatch the key down action - movement logic is now in the reducer
                    this.dispatch({ type: 'KEY_DOWN', key });
                    
                    // If the player actually moved, mark key as processed
                    if (this.gameState.player.x !== oldX || this.gameState.player.y !== oldY) {
                        this.processedKeys[key] = true;
                    }
                }
            }
        } else {
            // Key is released, clear processed state
            delete this.processedKeys[key];
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
        this.dispatch({ type: 'CLEAR_TEXT_BOXES' });
        
        // Add a welcome message at the bottom of the screen
        const textBox: TextBox = {
            startX: 2,
            startY: this.gameState.map.height - 5,
            endX: this.gameState.map.width - 3,
            endY: this.gameState.map.height - 2,
            text: "Welcome to the Dungeon Game!\nUse arrow keys or WASD to move around.\nExplore the town and enter buildings."
        };
        
        this.dispatch({ type: 'ADD_TEXT_BOX', textBox });
    }
}