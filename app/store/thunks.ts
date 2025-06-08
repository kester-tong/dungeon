import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './store';
import {
  sendChatToNpc,
  exitChat,
  dismissSplashText,
  deleteCharFromInput,
  addCharToInput,
  movePlayer,
  handleChatResponse,
  chatToNpcStarted,
  animateEndChatStarted,
} from './gameSlice';
import { ChatRequest, ChatResponse } from '../api/chat/types';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const maybeAnimateEndChat = createAsyncThunk(
  'game/maybeAnimateEndChat',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const gameState = state.game;
    if (
      gameState.chatWindow === null ||
      gameState.chatWindow.pendingAnimateEndChatRequest === undefined
    ) {
      return;
    }
    dispatch(animateEndChatStarted());
    await sleep(gameState.chatWindow.pendingAnimateEndChatRequest);
    dispatch(exitChat());
  }
);

// Async thunk for sending chat messages to NPC
const maybeSendChatMessage = createAsyncThunk(
  'game/maybeSendChatMessage',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const gameState = state.game;
    const accessKey = state.auth.accessKey;

    if (
      !accessKey ||
      gameState.chatWindow === null ||
      !gameState.chatWindow.pendingChatRequest
    ) {
      return;
    }

    dispatch(chatToNpcStarted());

    try {
      const requestBody: ChatRequest = {
        ...gameState.chatWindow.pendingChatRequest,
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

      const chatResponse: ChatResponse = await response.json();

      dispatch(handleChatResponse(chatResponse));
      dispatch(maybeSendChatMessage());
      dispatch(maybeAnimateEndChat());
    } catch (error) {
      // Add fallback message on error
      dispatch(
        handleChatResponse({
          success: false,
          error:
            typeof error === 'string'
              ? error
              : "Sorry, I couldn't undersand that",
        })
      );
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

    if (gameState.splashText) {
      // Handle splash text (only escape dismisses it)
      if (key === 'Escape') {
        dispatch(dismissSplashText());
      }
    } else if (gameState.chatWindow) {
      // Case 1: It's the user's turn
      if (gameState.chatWindow.currentMessage !== null) {
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
      } else {
        const messages = gameState.chatWindow.messages;
        const lastMessage =
          messages.length > 0 ? messages[messages.length - 1] : null;
        const lastBlock =
          lastMessage && lastMessage.content.length > 0
            ? lastMessage.content[lastMessage.content.length - 1]
            : null;
        if (lastBlock?.type === 'tool_use') {
          // TODO: handle user input while waiting for an action.
        } else {
          // TODO handle user input while waiting for AI to respond.
        }
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
    // This call will detect whether the game state now means a new
    // chat message should be sent.  This is a workaround for redux's
    // one directional flow.  It's necessary to avoid having to split
    // the game logic between thunks and the reducer.
    dispatch(maybeSendChatMessage());
    dispatch(maybeAnimateEndChat());
  }
);
