
// Tile constants
export const TILE = {
    GROUND: 2,
    WALL: 21,
    DOOR_START: 67,
    DOOR_END: 82,
    CHARACTER: 18 * 32,
    SIZE: 32
};

/**
 * GameState is a Plain Old Data object that represents the complete state of the game.
 * It contains no methods, only data.
 */
export interface GameState {
    // Map state (immutable)
    readonly map: {
        data: number[][];
        width: number;
        height: number;
    };
    
    // Player state
    player: {
        x: number;
        y: number;
    };
    
}

/**
 * Actions that can be dispatched to update the game state
 */
export type GameAction = 
    | { type: 'KEY_DOWN', key: string };

/**
 * Helper functions for working with game state
 */
export const GameStateUtils = {
    /**
     * Check if a position is walkable
     */
    isWalkable(state: GameState, x: number, y: number): boolean {
        if (x < 0 || x >= state.map.width || y < 0 || y >= state.map.height) {
            return false;
        }
        return state.map.data[y][x] !== TILE.WALL;
    },
    
    /**
     * Get the tile at a specific position
     */
    getTileAt(state: GameState, x: number, y: number): number {
        if (x < 0 || x >= state.map.width || y < 0 || y >= state.map.height) {
            return TILE.GROUND; // Default to ground for out of bounds
        }
        return state.map.data[y][x];
    }
};

/**
 * Create the initial map for the game
 */
function createTownMap(width: number, height: number): number[][] {
    // Create an empty map filled with ground tiles
    const mapData = Array(height).fill(null)
        .map(() => Array(width).fill(TILE.GROUND));
    
    // Helper function to create a building
    function createBuilding(x: number, y: number, width: number, height: number, doorTile: number): void {
        // Create walls for the building
        for (let yPos = y; yPos < y + height; yPos++) {
            for (let xPos = x; xPos < x + width; xPos++) {
                // Place walls on the perimeter
                if (xPos === x || xPos === x + width - 1 || yPos === y || yPos === y + height - 1) {
                    mapData[yPos][xPos] = TILE.WALL;
                }
            }
        }
        
        // Place door in the middle of the bottom wall
        const doorX = x + Math.floor(width / 2);
        const doorY = y + height - 1;
        mapData[doorY][doorX] = doorTile;
    }
    
    // Inn (top left)
    createBuilding(2, 2, 5, 4, TILE.DOOR_START); // 67 = Inn door
    
    // Shop (top right)
    createBuilding(17, 2, 5, 4, TILE.DOOR_START + 1); // 68 = Shop door
    
    // Blacksmith (middle left)
    createBuilding(3, 8, 6, 5, TILE.DOOR_START + 2); // 69 = Blacksmith door
    
    // Temple (middle right)
    createBuilding(16, 8, 6, 5, TILE.DOOR_START + 3); // 70 = Temple door
    
    // Houses (bottom)
    createBuilding(7, 10, 4, 3, TILE.DOOR_START + 4); // 71 = House door
    createBuilding(14, 10, 4, 3, TILE.DOOR_START + 5); // 72 = Another house door
    
    return mapData;
}

/**
 * Create the initial game state
 */
export function createInitialGameState(mapWidth: number, mapHeight: number): GameState {
    const mapData = createTownMap(mapWidth, mapHeight);
    
    return {
        map: {
            data: mapData,
            width: mapWidth,
            height: mapHeight
        },
        player: {
            x: Math.floor(mapWidth / 2),
            y: Math.floor(mapHeight / 2)
        }
    };
}

/**
 * Reducer function that takes the current state and an action, and returns a new state
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'KEY_DOWN': {
            const { key } = action;
            let dx = 0;
            let dy = 0;
            
            // Determine movement direction based on key
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
                default:
                    // If it's not a movement key, return state unchanged
                    return state;
            }
            
            // Calculate new position
            const newX = state.player.x + dx;
            const newY = state.player.y + dy;
            
            // Check if the new position is valid
            if (
                newX >= 0 && newX < state.map.width &&
                newY >= 0 && newY < state.map.height &&
                GameStateUtils.isWalkable(state, newX, newY)
            ) {
                // Return a new state with the updated player position
                return {
                    ...state,
                    player: {
                        ...state.player,
                        x: newX,
                        y: newY
                    }
                };
            }
            
            // If the move is invalid, return the unchanged state
            return state;
        }
        
        default:
            return state;
    }
}