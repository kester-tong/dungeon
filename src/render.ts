import { GameState } from './gameState.js';
import { RenderTree } from './renderer.js';

const CHARACTER_TILE_INDEX = 576; // 18 * 32

/**
 * Pure function that transforms GameState into a RenderTree
 * (analogous to React's functional components or render methods)
 */
export function render(state: GameState): RenderTree {
    // Extract tile indices from map data
    const tiles: number[][][] = state.map.data.map(row => 
        row.map(tile => [tile.tileIndex])
    );
    
    // Add character at player position
    tiles[state.player.y][state.player.x].push(CHARACTER_TILE_INDEX);
    
    // Create welcome text box
    const welcomeTextBox = {
        startX: 2,
        startY: state.map.height - 5,
        endX: state.map.width - 3,
        endY: state.map.height - 2,
        text: "Welcome to the Dungeon Game!\nUse arrow keys or WASD to move around.\nExplore the town and enter buildings."
    };

    // Return the complete render tree
    return {
        tiles,
    };
}