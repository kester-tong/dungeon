import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { RootState } from './store';
import { handleChatResponse, exitChat } from './gameSlice';
import { ChatRequest, ChatResponse } from '../api/chat/types';

// Global state for tracking pending operations
let chatAbortController: AbortController | null = null;
let animationTimeoutId: NodeJS.Timeout | null = null;

export const listenerMiddleware = createListenerMiddleware();

// Listen for transitions to waiting_for_ai state
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    const current = (currentState as RootState).game;
    const previous = (previousState as RootState).game;

    // Check if we transitioned to waiting_for_ai state
    return (
      current.chatWindow?.turnState.type === 'waiting_for_ai' &&
      previous.chatWindow?.turnState.type !== 'waiting_for_ai'
    );
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const gameState = state.game;
    const accessKey = state.auth.accessKey;

    if (
      !accessKey ||
      gameState.chatWindow === null ||
      !gameState.chatWindow.messages.length
    ) {
      return;
    }

    // Create new abort controller for this request
    chatAbortController = new AbortController();

    try {
      const requestBody: ChatRequest = {
        accessKey: accessKey,
        npcId: gameState.chatWindow.npcId,
        contents: gameState.chatWindow.messages,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: chatAbortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const chatResponse: ChatResponse = await response.json();
      listenerApi.dispatch(handleChatResponse(chatResponse));
    } catch (error) {
      // Don't handle AbortError - it means the request was intentionally cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Add fallback message on other errors
      listenerApi.dispatch(
        handleChatResponse({
          success: false,
          error:
            typeof error === 'string'
              ? error
              : "Sorry, I couldn't understand that",
        })
      );
    } finally {
      // Clean up the abort controller after completion
      chatAbortController = null;
    }
  },
});

// Listen for transitions to animating_before_end_chat state
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    const current = (currentState as RootState).game;
    const previous = (previousState as RootState).game;

    // Check if we transitioned to animating_before_end_chat state
    return (
      current.chatWindow?.turnState.type === 'animating_before_end_chat' &&
      previous.chatWindow?.turnState.type !== 'animating_before_end_chat'
    );
  },
  effect: async (action, listenerApi) => {
    // Set up timeout with cleanup
    animationTimeoutId = setTimeout(() => {
      listenerApi.dispatch(exitChat());
      animationTimeoutId = null; // Clean up after natural completion
    }, 2000);
  },
});

// Listen for exit chat to cancel pending operations
listenerMiddleware.startListening({
  actionCreator: exitChat,
  effect: () => {
    // Cancel pending chat request
    if (chatAbortController) {
      chatAbortController.abort();
      chatAbortController = null;
    }

    // Cancel pending animation timeout
    if (animationTimeoutId) {
      clearTimeout(animationTimeoutId);
      animationTimeoutId = null;
    }
  },
});
