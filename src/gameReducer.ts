import { GameState, GameAction } from './gameState.js';

/**
 * Get chat messages based on the tile index
 */
function getChatMessages(tileIndex: number): string[] {
    switch (tileIndex) {
        case 71: // Tavern door (t)
            return [
                "Welcome to the Rusty Anchor Tavern!",
                "Would you like some ale or a hot meal?",
                "We have rooms available upstairs if you need rest."
            ];
        case 73: // Shop door (s)
            return [
                "Welcome to the General Store!",
                "We have supplies, weapons, and armor.",
                "What can I help you find today?"
            ];
        case 75: // Temple door (p)
            return [
                "Blessings upon you, traveler.",
                "This is the Temple of Light.",
                "Would you like healing or guidance?"
            ];
        case 2465: // Blacksmith door (b)
            return [
                "Welcome to the forge!",
                "I can repair your equipment or craft new items.",
                "The fire burns hot today - perfect for smithing!"
            ];
        default:
            return [
                "Hello there!",
                "Nice weather we're having."
            ];
    }
}

/**
 * Reducer function that takes the current state and an action, and returns a new state
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'KEY_DOWN': {
            const { key } = action;
            
            // Handle ESC key to exit chat
            if (key === 'Escape' && state.chat.isInChat) {
                return {
                    ...state,
                    chat: {
                        ...state.chat,
                        isInChat: false,
                        messages: [],
                        currentInput: ""
                    }
                };
            }
            
            // If we're in chat, ignore movement keys
            if (state.chat.isInChat) {
                return state;
            }
            
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
            
            // Check bounds
            if (newX < 0 || newX >= state.map.width || newY < 0 || newY >= state.map.height) {
                return state;
            }
            
            const targetTile = state.map.data[newY][newX];
            
            // Check if target tile is chattable - enter chat
            if (targetTile.type === "chattable") {
                const chatMessages = getChatMessages(targetTile.tileIndex);
                return {
                    ...state,
                    chat: {
                        isInChat: true,
                        messages: chatMessages,
                        currentInput: "",
                        previousPlayerX: state.player.x,
                        previousPlayerY: state.player.y
                    }
                };
            }
            
            // Check if target tile is walkable (terrain)
            if (targetTile.type === "terrain") {
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
            
            // If the move is invalid (obstacle), return the unchanged state
            return state;
        }
        
        default:
            return state;
    }
}