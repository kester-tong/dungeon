import { Map, Tile } from "./maps/Map";
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

