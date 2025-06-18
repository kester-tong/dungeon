import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { gameConfig } from '@/src/config/gameConfig';
import { ChatResponse } from '../api/chat/types';
import { Inventory } from '@/src/items';
import { Content, FunctionCall, FunctionResponse } from '@google/genai';

/**
 * Strongly-typed action definitions
 */
export interface OpenDoorAction {
  type: 'open_door';
}

export interface SellItemAction {
  type: 'sell_item';
  objectId: string;
  price: number;
}

export type Action = OpenDoorAction | SellItemAction;

/**
 * Parsed chat history entry types
 */
export interface TextEntry {
  type: 'text';
  role: 'user' | 'model';
  content: string;
}

export interface ActionEntry {
  type: 'action';
  action: Action;
  accepted: boolean;
}

export type ChatHistoryEntry = TextEntry | ActionEntry;

/**
 * Helper to parse function call to pending action
 */
function parseFunctionCall(functionCall: FunctionCall): Action | null {
  switch (functionCall.name) {
    case 'sell_item':
      return {
        type: 'sell_item',
        objectId: functionCall.args?.['object_id'] as string,
        price: functionCall.args?.['price'] as number,
      };
    case 'open_door':
      return {
        type: 'open_door',
      };
    default:
      return null;
  }
}

/**
 * Either performs the action or returns null indicating that confirmation is needed.
 *
 * This function is needed because some actions will fail anyway depending on the game state
 * (e.g. buying an object you can't afford) so  we should fail early without confirmation.
 *
 * @param action
 * @param state
 */
function actionNeedsConfirmation(action: Action, state: GameState): boolean {
  switch (action.type) {
    case 'sell_item':
      // TODO: skip confirmation if player character can't afford it
      return true;
    case 'open_door':
      return false;
  }
}

/**
 * Helper to create completed action from pending action and acceptance
 */
function performAction(
  action: Action,
  state: Draft<GameState>
): FunctionResponse {
  switch (action.type) {
    case 'open_door':
      // If player is on the town side of the door, move them to the forest
      if (state.player.mapId === 'town') {
        state.player = {
          mapId: 'forest',
          x: 11,
          y: 13,
        };
      } else {
        state.player = {
          mapId: 'town',
          x: 11,
          y: 1,
        };
      }
      return {
        name: 'open_door',
        response: {},
      };
    case 'sell_item':
      const { objectId, price } = action;
      // Add the purchased item to inventory
      const existingItemIndex = state.inventory.items.findIndex(
        (slot) => slot.objectId === objectId
      );
      if (existingItemIndex >= 0) {
        state.inventory.items[existingItemIndex].quantity += 1;
      } else {
        state.inventory.items.push({
          objectId: objectId,
          quantity: 1,
        });
      }

      // Deduct gold from inventory
      const goldIndex = state.inventory.items.findIndex(
        (slot) => slot.objectId === 'gold_coin'
      );
      if (goldIndex >= 0) {
        state.inventory.items[goldIndex].quantity -= price;
        // Remove gold entry if quantity reaches 0
        if (state.inventory.items[goldIndex].quantity <= 0) {
          state.inventory.items.splice(goldIndex, 1);
        }
      }
      return {
        name: 'sell_item',
        response: { result: 'accept' },
      };
  }
}

/**
 * Parsing utilities for converting Gemini Content to ChatHistoryEntry
 */
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
    // Skip functionCall and functionResponse parts - they don't go directly into chat history
    // Completed actions are added via addCompletedActionToHistory function
  }

  return entries;
}

function parseContentArray(contents: Content[]): ChatHistoryEntry[] {
  return contents.flatMap(parseContent);
}

/**
 * Position represents x, y coordinates and map location
 */
export interface Position {
  x: number;
  y: number;
  mapId: string;
}

export interface UserTurnState {
  type: 'user_turn';
  // The message the user is typing.
  currentMessage: string;
}

// State when waiting for AI response
export interface WaitingForNpcState {
  type: 'waiting_for_ai';
}

// State when waiting for user to confirm an action
export interface ConfirmingActionState {
  type: 'confirming_action';
  pendingAction: Action;
}

// State when about to end chat (after deley to let user
// read the final message.
export interface AnimatingBeforeEndChatState {
  type: 'animating_before_end_chat';
}

export type TurnState =
  | UserTurnState
  | WaitingForNpcState
  | ConfirmingActionState
  | AnimatingBeforeEndChatState;

/**
 * ChatWindow represents the chat/dialog interface
 * Turn semantics:
 * - If messages is empty, it's the user's turn by default
 * - Otherwise, it's whoever's turn is next based on the last message
 * - If it's AI's turn, we're waiting for AI response
 * - If it's the user's turn and it's a regular conversation turn then
 *   currentMessage is non-null
 * - If it's the user's turn and confirmation of an action (e.g. buy/sell)
 *   is needed then currentMessage is null.
 */
export type ChatWindow = {
  intro_text: string;
  contents: Content[];
  chatHistory: ChatHistoryEntry[];
  npcId: string;
  turnState: TurnState;
};

export interface GameState {
  player: Position;
  chatWindow: ChatWindow | null;
  inventory: Inventory;
  splashText: string | null;
}

const initialState: GameState = {
  player: gameConfig.startingPosition,
  chatWindow: null,
  inventory: gameConfig.initialInventory,
  splashText: gameConfig.initialSplashText,
};

// Helper function for movement logic
function handleMovement(
  state: GameState,
  direction: 'north' | 'south' | 'east' | 'west'
) {
  if (state.chatWindow !== null) return; // Can't move while in chat

  const currentMap = gameConfig.maps[state.player.mapId];
  if (!currentMap) return;

  // Calculate new position based on direction
  let newX = state.player.x;
  let newY = state.player.y;

  switch (direction) {
    case 'west':
      newX = state.player.x - 1;
      break;
    case 'east':
      newX = state.player.x + 1;
      break;
    case 'north':
      newY = state.player.y - 1;
      break;
    case 'south':
      newY = state.player.y + 1;
      break;
  }

  // Check bounds and handle map transitions
  if (
    newX < 0 ||
    newX >= currentMap.width ||
    newY < 0 ||
    newY >= currentMap.height
  ) {
    // Check if there's a neighboring map in the direction we're trying to go
    const neighborMapId =
      currentMap.neighbors[direction as keyof typeof currentMap.neighbors];
    if (neighborMapId) {
      const neighborMap = gameConfig.maps[neighborMapId];
      // Calculate entry position on the new map
      let entryX: number;
      let entryY: number;

      if (direction === 'north') {
        entryX = state.player.x;
        entryY = neighborMap.height - 1;
      } else if (direction === 'south') {
        entryX = state.player.x;
        entryY = 0;
      } else if (direction === 'west') {
        entryX = neighborMap.width - 1;
        entryY = state.player.y;
      } else {
        // east
        entryX = 0;
        entryY = state.player.y;
      }

      // Transition to the new map
      state.player = {
        x: entryX,
        y: entryY,
        mapId: neighborMapId,
      };
      return;
    }

    // No neighbor found - player has reached the end of the map
    state.splashText = gameConfig.endOfMapText;
    return;
  }

  const targetTile = currentMap.data[newY][newX];

  // Check if target tile is an NPC - enter chat
  if (targetTile.type === 'npc') {
    const npc = gameConfig.npcs[targetTile.npcId];
    const contents: Content[] = [];

    // Use preseeded message history if available, otherwise fall back to first_message
    if (npc?.preseeded_message_history) {
      contents.push(...npc.preseeded_message_history);
    } else if (npc?.first_message) {
      contents.push({
        role: 'model',
        parts: [{ text: npc.first_message }],
      });
    }

    state.chatWindow = {
      intro_text: npc.intro_text,
      contents,
      chatHistory: parseContentArray(contents),
      turnState: {
        type: 'user_turn',
        currentMessage: '',
      },
      npcId: targetTile.npcId,
    };
    return;
  }

  // Check if target tile is walkable (terrain)
  if (targetTile.type === 'terrain') {
    state.player.x = newX;
    state.player.y = newY;
    // mapId stays the same when moving within the same map
  }
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Functional actions
    exitChat: (state) => {
      state.chatWindow = null;
    },

    dismissSplashText: (state) => {
      state.splashText = null;
    },

    deleteCharFromInput: (state) => {
      if (state.chatWindow && state.chatWindow.turnState.type === 'user_turn') {
        state.chatWindow.turnState.currentMessage =
          state.chatWindow.turnState.currentMessage.slice(0, -1);
      }
    },

    addCharToInput: (state, action: PayloadAction<string>) => {
      if (state.chatWindow && state.chatWindow.turnState.type === 'user_turn') {
        state.chatWindow.turnState.currentMessage += action.payload;
      }
    },

    movePlayer: (
      state,
      action: PayloadAction<'north' | 'south' | 'east' | 'west'>
    ) => {
      if (!state.chatWindow) {
        handleMovement(state, action.payload);
      }
    },

    // Chat functionality
    sendChatToNpc: (state) => {
      if (state.chatWindow && state.chatWindow.turnState.type === 'user_turn') {
        const userContent: Content = {
          role: 'user',
          parts: [{ text: state.chatWindow.turnState.currentMessage }],
        };
        state.chatWindow.contents.push(userContent);
        state.chatWindow.chatHistory.push(...parseContent(userContent));
        state.chatWindow.turnState = { type: 'waiting_for_ai' };
      }
    },

    confirmAction: (state, action: PayloadAction<boolean>) => {
      if (
        state.chatWindow &&
        state.chatWindow.turnState.type === 'confirming_action'
      ) {
        const pendingAction = state.chatWindow.turnState.pendingAction;
        const accepted = action.payload;

        let functionResponse: FunctionResponse;
        if (accepted) {
          functionResponse = performAction(pendingAction, state);
        } else {
          functionResponse = {
            name: pendingAction.type,
            response: { output: 'reject' },
          };
        }

        // Create the function response content for the raw contents
        const responseContent: Content = {
          role: 'user',
          parts: [
            {
              functionResponse,
            },
          ],
        };
        state.chatWindow.contents.push(responseContent);
        state.chatWindow.chatHistory.push({
          type: 'action',
          action: pendingAction,
          accepted,
        });
        state.chatWindow.turnState = { type: 'waiting_for_ai' };
      }
    },

    handleChatResponse: (state, action: PayloadAction<ChatResponse>) => {
      if (
        state.chatWindow &&
        state.chatWindow.turnState.type === 'waiting_for_ai'
      ) {
        if (!action.payload.success) {
          // TODO: handle errors better.
          state.chatWindow = null;
          return;
        }

        const content = action.payload.response.content;
        state.chatWindow.contents.push(content);
        state.chatWindow.chatHistory.push(...parseContent(content));

        // TODO: handle function calls that don't appear in the last part of the message
        // either with error or otherwise.
        const parts = content.parts || [];
        const lastPart = parts.length > 0 ? parts[parts.length - 1] : null;
        const functionCall = lastPart?.functionCall;
        if (functionCall) {
          const action = parseFunctionCall(functionCall);
          if (action === null) {
            // TODO: add something to chatHistory indicate a failed attempt at an action
            state.chatWindow = null;
            return;
          }
          if (actionNeedsConfirmation(action, state)) {
            state.chatWindow.turnState = {
              type: 'confirming_action',
              pendingAction: action,
            };
          } else {
            const functionResponse = performAction(action, state);
            state.chatWindow.chatHistory.push({
              type: 'action',
              action,
              accepted: true,
            });
            state.chatWindow.contents.push({
              role: 'user',
              parts: [{ functionResponse }],
            });
            // TODO: right now we only reach this point for the open door action which we
            // want to end the chat.  However really we should have a function that
            // determines whether an action ends the chat.  In the case that it doesn't
            // we should trigger a new API call.  To do this we should update the
            // listener code which currently looks for state changes to waiting_for_ai
            // However in this case we're already in the waiting_for_ai state so we
            // should also listen for changes to chatWindow.contents.
            state.chatWindow.turnState = {
              type: 'animating_before_end_chat',
            };
          }
        } else {
          // Set to user's turn with new empty message.
          state.chatWindow.turnState = {
            type: 'user_turn',
            currentMessage: '',
          };
        }
      }
    },
  },
});

export const {
  exitChat,
  dismissSplashText,
  deleteCharFromInput,
  addCharToInput,
  movePlayer,
  sendChatToNpc,
  handleChatResponse,
  confirmAction,
} = gameSlice.actions;

export default gameSlice.reducer;
