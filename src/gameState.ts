import { Map, Tile } from "./maps/Map";

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

