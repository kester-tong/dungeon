import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './store';
import {
  sendChatToNpc,
  receiveChatFromNpc,
  pauseForToolUse,
  handleNpcToolUse,
  exitChat,
  deleteCharFromInput,
  addCharToInput,
  movePlayer,
} from './gameSlice';
import { ChatRequest, ChatResponse } from '../api/chat/types';

// Utility function for sleeping
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Async thunk for sending chat messages to NPC
export const sendChatMessage = createAsyncThunk(
  'game/sendChatMessage',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const gameState = state.game;
    const accessKey = state.auth.accessKey;

    if (!accessKey) {
      throw new Error('No access key available');
    }

    if (!gameState.chatWindow) {
      throw new Error('Not in chat mode');
    }

    const message = gameState.chatWindow.currentInput.trim();
    if (!message) {
      return; // Nothing to send
    }

    // Add user message to chat and clear input
    dispatch(sendChatToNpc());

    // Build messages array including the new user message
    const allMessages = [
      ...gameState.chatWindow.messages,
      { role: 'user' as const, content: message },
    ];

    try {
      const requestBody: ChatRequest = {
        messages: allMessages,
        npcId: gameState.chatWindow.npcId,
        accessKey: accessKey,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ChatResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const npcResponse = data.response;

      // Add AI response to chat
      dispatch(receiveChatFromNpc(npcResponse.text || ''));

      // Handle tool use if present
      if (npcResponse.tool_use) {
        // Pause to let user read the message
        dispatch(pauseForToolUse());
        await sleep(2000); // 2 second pause
        dispatch(handleNpcToolUse(npcResponse.tool_use));
      }

      return data.response;
    } catch (error) {
      // Add fallback message on error
      dispatch(receiveChatFromNpc("Sorry, I couldn't understand that."));
      throw error;
    }
  }
);

// Async thunk for handling key presses with async logic
export const handleKeyPress = createAsyncThunk(
  'game/handleKeyPress',
  async (params: { key: string }, { getState, dispatch }) => {
    const { key } = params;
    const state = getState() as RootState;
    const gameState = state.game;

    // Dispatch appropriate action based on whether we're in chat or not
    const inChat = gameState.chatWindow !== null;

    if (inChat) {
      switch (key) {
        case 'Enter':
          await dispatch(sendChatMessage());
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
