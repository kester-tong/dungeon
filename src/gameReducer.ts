import { GameState, GameAction, GameStateUtils } from './gameState.js';

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