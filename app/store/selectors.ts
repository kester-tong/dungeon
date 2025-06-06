import { RootState } from './store';
import { ChatWindow } from './gameSlice';

/**
 * Selector to determine whose turn it is in a chat
 * - If messages is empty, it's the user's turn by default
 * - Otherwise, it's whoever's turn is next based on the last message
 */
export const selectIsUserTurn = (state: RootState): boolean => {
  const chatWindow = state.game.chatWindow;
  if (!chatWindow) {
    return false;
  }

  // If messages is empty, it's the user's turn by default
  if (chatWindow.messages.length === 0) {
    return true;
  }

  // Otherwise, it's whoever's turn is next based on the last message
  const lastMessage = chatWindow.messages[chatWindow.messages.length - 1];
  return lastMessage.role === 'assistant';
};

/**
 * Selector to determine if we're waiting for AI response
 * This replaces the old chatLoading state
 */
export const selectIsWaitingForAI = (state: RootState): boolean => {
  const chatWindow = state.game.chatWindow;
  if (!chatWindow) {
    return false;
  }

  return !selectIsUserTurn(state);
};

/**
 * Selector to get the current chat window if in chat
 */
export const selectChatWindow = (state: RootState): ChatWindow | null => {
  return state.game.chatWindow;
};
