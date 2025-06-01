import { Map } from "./maps/Map";
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
    readonly map: Map;
    
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