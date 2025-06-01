import { GameState } from './gameState.js';
import { RenderTree, TileArray } from './renderer.js';

const CHARACTER_TILE_INDEX = 576; // 18 * 32

/**
 * Pure function that transforms GameState into a RenderTree
 * (analogous to React's functional components or render methods)
 */
export function render(state: GameState): RenderTree {
    // If in chat, return ChatWindow
    if (state.chat.isInChat) {
        return {
            type: 'ChatWindow',
            messages: [
                ...state.chat.messages,
                "",
                "Press ESC to exit"
            ],
            inputText: state.chat.currentInput
        };
    }
    
    // Extract tile indices from map data
    const tiles: number[][][] = state.map.data.map(row => 
        row.map(tile => [tile.tileIndex])
    );
    
    // Add character at player position
    tiles[state.player.y][state.player.x].push(CHARACTER_TILE_INDEX);

    // Return the TileArray render tree
    return {
        type: 'TileArray',
        tiles,
    };
}