import { GameState, TILE } from './gameState.js';
import { RenderTree } from './renderer.js';

/**
 * Pure function that transforms GameState into a RenderTree
 * (analogous to React's functional components or render methods)
 */
export function render(state: GameState): RenderTree {
    // Create the tiles array from the game state
    const tiles: number[][][] = Array(state.map.height).fill(null).map((_, y) => 
        Array(state.map.width).fill(null).map((_, x) => {
            // Start with the base tile
            const tile = (x >= 0 && x < state.map.width && y >= 0 && y < state.map.height) 
                ? state.map.data[y][x]
                : { tileIndex: TILE.GROUND, type: "terrain" as const };
            const tileLayers = [tile.tileIndex];
            
            // Add player if at this position
            if (x === state.player.x && y === state.player.y) {
                tileLayers.push(TILE.CHARACTER);
            }
            
            return tileLayers;
        })
    );
    
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