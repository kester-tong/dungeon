import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gameConfig } from '@/src/config/gameConfig';
import { Inventory } from '@/src/items';
import { Content } from '@google/genai';
import { AsyncAction, GameEvent } from '@/src/engine/types';

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

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setState: (
      state,
      action: PayloadAction<{
        state: GameState;
        event: GameEvent;
        actions: AsyncAction[];
      }>
    ) => {
      return action.payload.state;
    },
  },
});

export const { setState } = gameSlice.actions;

export default gameSlice.reducer;