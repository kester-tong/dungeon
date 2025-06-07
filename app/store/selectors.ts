import { RootState } from './store';
import { ChatWindow } from './gameSlice';

/**
 * Selector to get the current chat window if in chat
 */
export const selectChatWindow = (state: RootState): ChatWindow | null => {
  return state.game.chatWindow;
};
