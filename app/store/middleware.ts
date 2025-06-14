import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { RootState } from './store';
import { handleChatResponse, exitChat } from './gameSlice';
import { ChatRequest, ChatResponse } from '../api/chat/types';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const chatResponse: ChatResponse = await response.json();
      listenerApi.dispatch(handleChatResponse(chatResponse));
    } catch (error) {
      // Add fallback message on error
      listenerApi.dispatch(
        handleChatResponse({
          success: false,
          error:
            typeof error === 'string'
              ? error
              : "Sorry, I couldn't understand that",
        })
      );
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
    // Sleep for 2 seconds (hardcoded for now, could be made configurable)
    await sleep(2000);
    listenerApi.dispatch(exitChat());
  },
});
