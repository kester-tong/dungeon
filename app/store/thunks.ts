import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './store';
import {
  sendChatToNpc,
  exitChat,
  dismissSplashText,
  deleteCharFromInput,
  addCharToInput,
  movePlayer,
  confirmAction,
} from './gameSlice';

// Async thunk for handling key presses with async logic
export const handleKeyPress = createAsyncThunk(
  'game/handleKeyPress',
  async (params: { key: string }, { getState, dispatch }) => {
    const { key } = params;
    const state = getState() as RootState;
    const gameState = state.game;

    if (gameState.splashText) {
      // Handle splash text (only escape dismisses it)
      if (key === 'Escape') {
        dispatch(dismissSplashText());
      }
    } else if (gameState.chatWindow) {
      switch (gameState.chatWindow.turnState.type) {
        case 'confirming_action':
          switch (key) {
            case 'n':
              dispatch(confirmAction(false));
              break;
            case 'y':
              dispatch(confirmAction(true));
              break;
          }
          break;
        case 'user_turn':
          switch (key) {
            case 'Enter':
              dispatch(sendChatToNpc());
              break;
            case 'Escape':
              dispatch(exitChat());
              break;
            case 'Backspace':
              dispatch(deleteCharFromInput());
              break;
            default:
              // For regular characters in chat mode
              if (key.length === 1) {
                dispatch(addCharToInput(key));
              }
              break;
          }
          break;
        case 'waiting_for_ai':
        case 'animating_before_end_chat':
          // middleware will cancel pending requests/animations when the user exits the chat
          if (key === 'Escape') {
            dispatch(exitChat());
          }
          break;
      }
    } else {
      switch (key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dispatch(movePlayer('west'));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dispatch(movePlayer('east'));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          dispatch(movePlayer('north'));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dispatch(movePlayer('south'));
          break;
      }
    }
  }
);
