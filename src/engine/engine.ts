import { Action, GameState, ChatHistoryEntry } from './types';
import { GameEvent, EngineResult, ChatResponseEvent } from './types';
import { gameConfig } from '@/src/config/gameConfig';
import { Content, FunctionCall, FunctionResponse } from '@google/genai';

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

function performAction(
  action: Action,
  state: GameState
): { state: GameState; functionResponse: FunctionResponse } {
  const newState = { ...state };
  let functionResponse: FunctionResponse;

  switch (action.type) {
    case 'open_door':
      newState.player =
        state.player.mapId === 'town'
          ? { mapId: 'forest', x: 11, y: 13 }
          : { mapId: 'town', x: 11, y: 1 };
      functionResponse = { name: 'open_door', response: {} };
      break;
    case 'sell_item':
      const { objectId, price } = action;
      const newInventory = JSON.parse(JSON.stringify(state.inventory));

      const itemIndex = newInventory.items.findIndex(
        (i: any) => i.objectId === objectId
      );
      if (itemIndex > -1) {
        newInventory.items[itemIndex].quantity += 1;
      } else {
        newInventory.items.push({ objectId, quantity: 1 });
      }

      const goldIndex = newInventory.items.findIndex(
        (i: any) => i.objectId === 'gold_coin'
      );
      if (goldIndex > -1) {
        newInventory.items[goldIndex].quantity -= price;
        if (newInventory.items[goldIndex].quantity <= 0) {
          newInventory.items.splice(goldIndex, 1);
        }
      }
      newState.inventory = newInventory;
      functionResponse = { name: 'sell_item', response: { result: 'accept' } };
      break;
  }
  return { state: newState, functionResponse };
}

function parseFunctionCall(functionCall: FunctionCall): Action | null {
  switch (functionCall.name) {
    case 'sell_item':
      return {
        type: 'sell_item',
        objectId: functionCall.args?.['object_id'] as string,
        price: functionCall.args?.['price'] as number,
      };
    case 'open_door':
      return { type: 'open_door' };
    default:
      return null;
  }
}

function actionNeedsConfirmation(action: Action, state: GameState): boolean {
  switch (action.type) {
    case 'sell_item':
      return true;
    case 'open_door':
      return false;
  }
}

function handleChatResponse(
  state: GameState,
  event: ChatResponseEvent
): EngineResult {
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

    if (actionNeedsConfirmation(action, newState)) {
      newState.chatWindow!.turnState = {
        type: 'confirming_action',
        pendingAction: action,
      };
      return { state: newState, actions: [] };
    } else {
      const { state: stateAfterAction, functionResponse } = performAction(
        action,
        newState
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

  return handleMovementKeydown(state, key);
}

function handleChatKeydown(state: GameState, key: string): EngineResult {
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

function handleUserTurnKeydown(state: GameState, key: string): EngineResult {
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
): EngineResult {
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
    const result = performAction(pendingAction, state);
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

function handleMovementKeydown(state: GameState, key: string): EngineResult {
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

function handleMovement(
  state: GameState,
  direction: 'north' | 'south' | 'east' | 'west'
): GameState {
  if (state.chatWindow !== null) return state;

  const currentMap = gameConfig.maps[state.player.mapId];
  if (!currentMap) return state;

  let { x: newX, y: newY } = state.player;
  if (direction === 'north') newY--;
  if (direction === 'south') newY++;
  if (direction === 'west') newX--;
  if (direction === 'east') newX++;

  if (
    newX < 0 ||
    newX >= currentMap.width ||
    newY < 0 ||
    newY >= currentMap.height
  ) {
    const neighborMapId = currentMap.neighbors[direction];
    if (neighborMapId) {
      const neighborMap = gameConfig.maps[neighborMapId];
      let entryX = state.player.x,
        entryY = state.player.y;
      if (direction === 'north') entryY = neighborMap.height - 1;
      if (direction === 'south') entryY = 0;
      if (direction === 'west') entryX = neighborMap.width - 1;
      if (direction === 'east') entryX = 0;
      return { ...state, player: { x: entryX, y: entryY, mapId: neighborMapId } };
    }
    return { ...state, splashText: gameConfig.endOfMapText };
  }

  const targetTile = currentMap.data[newY][newX];
  if (targetTile.type === 'terrain') {
    return { ...state, player: { ...state.player, x: newX, y: newY } };
  }

  if (targetTile.type === 'npc') {
    const npc = gameConfig.npcs[targetTile.npcId];
    const contents: Content[] = npc.preseeded_message_history
      ? [...npc.preseeded_message_history]
      : [{ role: 'model', parts: [{ text: npc.first_message }] }];

    return {
      ...state,
      chatWindow: {
        intro_text: npc.intro_text,
        contents,
        chatHistory: contents.flatMap(parseContent),
        turnState: { type: 'user_turn', currentMessage: '' },
        npcId: targetTile.npcId,
      },
    };
  }

  return state;
}