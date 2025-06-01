import { GameState } from './gameState.js';
import { RenderTree, TileArray } from './renderer.js';

const CHARACTER_TILE_INDEX = 576; // 18 * 32

/**
 * Pure function that transforms GameState into a RenderTree
 * (analogous to React's functional components or render methods)
 */
export function render(state: GameState): RenderTree {
    // If in chat, return ChatWindow
    if (state.location.type === 'in_chat') {
        return {
            type: 'ChatWindow',
            messages: [
                ...state.location.messages,
                "",
                "Press ESC to exit"
            ],
            inputText: state.location.currentInput
        };
    }
    
    // Extract tile indices from map data
    const tiles: number[][][] = state.map.data.map(row => 
        row.map(tile => [tile.tileIndex])
    );
    
    // Add character at player position (we know we're navigating at this point)
    const player = state.location.player;
    tiles[player.y][player.x].push(CHARACTER_TILE_INDEX);

    // Return the TileArray render tree
    return {
        type: 'TileArray',
        tiles,
    };
}