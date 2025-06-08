import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gameConfig } from '@/src/config/gameConfig';
import { MessageParam } from '@/src/npcs/Anthropic';
import { Message } from '@/src/npcs/Anthropic';
import { ChatRequest, ChatResponse } from '../api/chat/types';
import { Inventory } from '@/src/items';

/**
 * Position represents x, y coordinates and map location
 */
export interface Position {
  x: number;
  y: number;
  mapId: string;
}

export type { Message as ChatMessage };

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
export interface ChatWindow {
  intro_text: string;
  messages: MessageParam[];
  // These fields are used to request middleware to dispatch async actions.
  // They are necessary to keep game logic in the reducer.
  pendingChatRequest?: ChatRequest;
  // Setting this allows the reducer to request middleware to sleep for a
  // given interval before exiting the chat.  This usually is due to some
  // action e.g. a guard opening a gate.
  pendingAnimateEndChatRequest?: number;
  animatingBeforeEndChat: boolean;
  // The current message the user is typing.
  currentMessage: string | null;
  npcId: string;
}

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
    const messages: MessageParam[] = [];

    if (npc?.first_message) {
      messages.push({
        role: 'assistant',
        content: [{ type: 'text', text: npc.first_message }],
      });
    }

    state.chatWindow = {
      intro_text: npc.intro_text,
      messages,
      currentMessage: '',
      npcId: targetTile.npcId,
      animatingBeforeEndChat: false,
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
      if (state.chatWindow && state.chatWindow.currentMessage !== null) {
        state.chatWindow.currentMessage = state.chatWindow.currentMessage.slice(
          0,
          -1
        );
      }
    },

    addCharToInput: (state, action: PayloadAction<string>) => {
      if (state.chatWindow && state.chatWindow.currentMessage !== null) {
        state.chatWindow.currentMessage += action.payload;
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
      if (state.chatWindow && state.chatWindow.currentMessage !== null) {
        state.chatWindow.messages.push({
          role: 'user',
          content: [{ type: 'text', text: state.chatWindow.currentMessage }],
        });
        state.chatWindow.currentMessage = null;
        state.chatWindow.pendingChatRequest = {
          accessKey: '', // TODO: make this optional
          npcId: state.chatWindow.npcId,
          messages: state.chatWindow.messages,
        };
      }
    },

    // Called to indicate that the call has started
    chatToNpcStarted: (state) => {
      if (state.chatWindow !== null) {
        state.chatWindow.pendingChatRequest = undefined;
      }
    },

    // Called to indicate that the call has started
    animateEndChatStarted: (state) => {
      if (state.chatWindow !== null) {
        state.chatWindow.pendingAnimateEndChatRequest = undefined;
      }
    },

    // sendToolResultToNpc: (state, action: PayloadAction<ToolResultBlock>) => {
    //   if (state.chatWindow && state.chatWindow.currentTurn.type === 'user') {
    //     state.chatWindow.messages.push({
    //       role: 'user',
    //       content: [action.payload],
    //     });
    //     state.chatWindow.currentTurn = {
    //       type: 'assistant',
    //       content: [],
    //     };
    //   }
    // },

    handleChatResponse: (state, action: PayloadAction<ChatResponse>) => {
      if (state.chatWindow && state.chatWindow.currentMessage === null) {
        // TODO: handle errors
        if (!action.payload.success) {
          return;
        }

        // Check for tool use in the content blocks and handle immediately
        const blocks = action.payload.response.message.content;
        for (const block of blocks) {
          if (block.type === 'tool_use') {
            // Handle the tool use immediately
            switch (block.name) {
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
                break;
            }
            break; // Only handle the first tool use
          }
        }

        state.chatWindow.messages.push({
          role: 'assistant',
          content: blocks,
        });
        const lastBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;
        if (lastBlock && lastBlock.type === 'tool_use') {
          // Currently there is only one tool whic opens the gate.  In that case
          // we exit the chat after pausing to let the user read the message
          state.chatWindow.pendingAnimateEndChatRequest = 2000;
          state.chatWindow.animatingBeforeEndChat = true;
        } else {
          // Set to user's turn with new empty message.
          state.chatWindow.currentMessage = '';
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
  chatToNpcStarted,
  handleChatResponse,
  animateEndChatStarted,
} = gameSlice.actions;

export default gameSlice.reducer;
