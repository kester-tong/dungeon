import { GameState } from '@/src/state';
import { GameEvent } from './events';
import { EngineResult } from './types';
import { handleMovement } from '@/src/world';
import { handleChatKeydown, handleChatResponse } from '@/src/dialog';

// =================================================================================
// Public Functions
// =================================================================================

export function handleEvent(state: GameState, event: GameEvent): EngineResult {
  switch (event.type) {
    case 'keydown':
      return handleKeydown(state, event.key);
    case 'chatresponse':
      return handleChatResponse(state, event);
    case 'timerelapsed':
      return handleTimerElapsed(state);
  }
}

// =================================================================================
// Helper Functions
// =================================================================================

function handleTimerElapsed(state: GameState): EngineResult {
  if (
    state.chatWindow &&
    state.chatWindow.turnState.type === 'animating_before_end_chat'
  ) {
    return { state: { ...state, chatWindow: null }, actions: [] };
  }
  return { state, actions: [] };
}

function handleKeydown(state: GameState, key: string): EngineResult {
  if (state.splashText) {
    return key === 'Escape'
      ? { state: { ...state, splashText: null }, actions: [] }
      : { state, actions: [] };
  }

  if (state.chatWindow) {
    return handleChatKeydown(state, key);
  }

  const direction = {
    ArrowUp: 'north',
    ArrowDown: 'south',
    ArrowLeft: 'west',
    ArrowRight: 'east',
  }[key];

  if (direction) {
    const newState = handleMovement(state, direction as any);
    return { state: newState, actions: [] };
  }

  return { state, actions: [] };
}