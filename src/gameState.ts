import { Map, Tile } from "./maps/Map";

/**
 * Position represents x, y coordinates
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * NavigatingLocation represents the player moving around the game world
 */
export interface NavigatingLocation {
    type: 'navigating';
    player: Position;
}

/**
 * InChatLocation represents the player in a chat/dialog interface
 */
export interface InChatLocation {
    type: 'in_chat';
    messages: string[];
    currentInput: string;
    // Store previous game position to return to
    previousLocation: Position;
}

/**
 * Location is a labeled union representing where/how the player is currently located
 */
export type Location = NavigatingLocation | InChatLocation;

/**
 * GameState represents the complete state of the game
 */
export interface GameState {
    readonly map: Map;
    location: Location;
}

/**
 * Actions that can be dispatched to update the game state
 */
export type GameAction = 
    | { type: 'KEY_DOWN', key: string };

