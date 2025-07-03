import { GameState } from '../state';
import {
  Action,
  actionNeedsConfirmation,
  parseFunctionCall,
  performAction,
} from '../actions';
import { ChatResponseEvent } from '../engine';
import { Content, FunctionResponse } from '@google/genai';
import { ChatHistoryEntry } from './types';

function parseContent(content: Content): ChatHistoryEntry[] {
  const entries: ChatHistoryEntry[] = [];
  const parts = content.parts || [];
  for (const part of parts) {
    if (part.text) {
      entries.push({
        type: 'text',
        role: content.role as 'user' | 'model',
        content: part.text,
      });
    }
  }
  return entries;
}

export function handleChatResponse(
  state: GameState,
  event: ChatResponseEvent
): { state: GameState; actions: any[] } {
  if (
    !state.chatWindow ||
    state.chatWindow.turnState.type !== 'waiting_for_ai'
  ) {
    return { state, actions: [] };
  }

  if (!event.response.success) {
    return { state: { ...state, chatWindow: null }, actions: [] };
  }

  const content = event.response.response.content;
  let newState: GameState = {
    ...state,
    chatWindow: {
      ...state.chatWindow,
      contents: [...state.chatWindow.contents, content],
      chatHistory: [...state.chatWindow.chatHistory, ...parseContent(content)],
    },
  };

  const functionCall =
    content.parts && content.parts[content.parts.length - 1]?.functionCall;
  if (functionCall) {
    const action = parseFunctionCall(functionCall);
    if (!action) {
      return { state: { ...state, chatWindow: null }, actions: [] };
    }

    if (actionNeedsConfirmation(action)) {
      newState.chatWindow!.turnState = {
        type: 'confirming_action',
        pendingAction: action,
      };
      return { state: newState, actions: [] };
    } else {
      const { state: stateAfterAction, functionResponse } = performAction(
        newState,
        action
      );
      newState = stateAfterAction;
      newState.chatWindow!.contents = [
        ...newState.chatWindow!.contents,
        { role: 'user', parts: [{ functionResponse }] },
      ];
      newState.chatWindow!.chatHistory = [
        ...newState.chatWindow!.chatHistory,
        { type: 'action', action, accepted: true },
      ];
      newState.chatWindow!.turnState = { type: 'animating_before_end_chat' };
      return {
        state: newState,
        actions: [{ type: 'start_timer', duration: 2000 }],
      };
    }
  } else {
    newState.chatWindow!.turnState = {
      type: 'user_turn',
      currentMessage: '',
    };
    return { state: newState, actions: [] };
  }
}

export function handleChatKeydown(
  state: GameState,
  key: string
): { state: GameState; actions: any[] } {
  const { chatWindow } = state;
  if (!chatWindow) return { state, actions: [] };

  switch (chatWindow.turnState.type) {
    case 'user_turn':
      return handleUserTurnKeydown(state, key);
    case 'confirming_action':
      return handleConfirmActionKeydown(state, key);
    case 'waiting_for_ai':
    case 'animating_before_end_chat':
      return key === 'Escape'
        ? { state: { ...state, chatWindow: null }, actions: [] }
        : { state, actions: [] };
  }
  return { state, actions: [] };
}

function handleUserTurnKeydown(
  state: GameState,
  key: string
): { state: GameState; actions: any[] } {
  const { chatWindow } = state;
  if (!chatWindow || chatWindow.turnState.type !== 'user_turn')
    return { state, actions: [] };

  switch (key) {
    case 'Enter': {
      const userContent: Content = {
        role: 'user',
        parts: [{ text: chatWindow.turnState.currentMessage }],
      };
      const newChatWindow = {
        ...chatWindow,
        contents: [...chatWindow.contents, userContent],
        chatHistory: [
          ...chatWindow.chatHistory,
          ...parseContent(userContent),
        ],
        turnState: { type: 'waiting_for_ai' as const },
      };
      return {
        state: { ...state, chatWindow: newChatWindow },
        actions: [{ type: 'send_chat_request' }],
      };
    }
    case 'Escape':
      return { state: { ...state, chatWindow: null }, actions: [] };
    case 'Backspace': {
      const newCurrentMessage = chatWindow.turnState.currentMessage.slice(
        0,
        -1
      );
      const newTurnState = {
        ...chatWindow.turnState,
        currentMessage: newCurrentMessage,
      };
      return {
        state: {
          ...state,
          chatWindow: { ...chatWindow, turnState: newTurnState },
        },
        actions: [],
      };
    }
    default:
      if (key.length === 1) {
        const newCurrentMessage = chatWindow.turnState.currentMessage + key;
        const newTurnState = {
          ...chatWindow.turnState,
          currentMessage: newCurrentMessage,
        };
        return {
          state: {
            ...state,
            chatWindow: { ...chatWindow, turnState: newTurnState },
          },
          actions: [],
        };
      }
  }
  return { state, actions: [] };
}

function handleConfirmActionKeydown(
  state: GameState,
  key: string
): { state: GameState; actions: any[] } {
  const { chatWindow } = state;
  if (!chatWindow || chatWindow.turnState.type !== 'confirming_action') {
    return { state, actions: [] };
  }

  const accepted = key === 'y';
  if (key !== 'y' && key !== 'n') {
    return { state, actions: [] };
  }

  const pendingAction = chatWindow.turnState.pendingAction;
  let newState = { ...state };
  let functionResponse: FunctionResponse;

  if (accepted) {
    const result = performAction(newState, pendingAction);
    newState = result.state;
    functionResponse = result.functionResponse;
  } else {
    functionResponse = {
      name: pendingAction.type,
      response: { output: 'reject' },
    };
  }

  const newChatWindow = {
    ...newState.chatWindow!,
    contents: [
      ...newState.chatWindow!.contents,
      { role: 'user' as const, parts: [{ functionResponse }] },
    ],
    chatHistory: [
      ...newState.chatWindow!.chatHistory,
      { type: 'action' as const, action: pendingAction, accepted },
    ],
    turnState: { type: 'waiting_for_ai' as const },
  };

  return {
    state: { ...newState, chatWindow: newChatWindow },
    actions: [{ type: 'send_chat_request' }],
  };
}

