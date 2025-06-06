import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gameConfig } from '@/src/config/gameConfig';
import { ChatMessage, ContentBlock } from '@/src/npcs/ContentBlocks';

/**
 * Position represents x, y coordinates and map location
 */
export interface Position {
  x: number;
  y: number;
  mapId: string;
}

export type { ChatMessage };

/**
 * ChatWindow represents the chat/dialog interface
 * Turn semantics:
 * - If messages is empty, it's the user's turn by default
 * - Otherwise, it's whoever's turn is next based on the last message
 * - If it's AI's turn, we're waiting for AI response
 */
export interface ChatWindow {
  intro_text: string;
  messages: ChatMessage[];
  currentInput: string;
  npcId: string;
  pausingForToolUse: boolean;
}

export interface GameState {
  player: Position;
  chatWindow: ChatWindow | null;
}

const initialState: GameState = {
  player: gameConfig.startingPosition,
  chatWindow: null,
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

    // No neighbor found, stop movement
    return;
  }

  const targetTile = currentMap.data[newY][newX];

  // Check if target tile is an NPC - enter chat
  if (targetTile.type === 'npc') {
    const npc = gameConfig.npcs[targetTile.npcId];
    const messages: ChatMessage[] = [];

    if (npc?.first_message) {
      messages.push({
        role: 'assistant',
        content: [{ type: 'text', text: npc.first_message }],
      });
    }

    state.chatWindow = {
      intro_text: npc.intro_text,
      messages,
      currentInput: '',
      npcId: targetTile.npcId,
      pausingForToolUse: false,
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

    deleteCharFromInput: (state) => {
      if (state.chatWindow) {
        state.chatWindow.currentInput = state.chatWindow.currentInput.slice(
          0,
          -1
        );
      }
    },

    addCharToInput: (state, action: PayloadAction<string>) => {
      if (state.chatWindow) {
        state.chatWindow.currentInput += action.payload;
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
      if (state.chatWindow) {
        const message = state.chatWindow.currentInput.trim();
        if (message) {
          state.chatWindow.messages.push({
            role: 'user',
            content: [{ type: 'text', text: message }],
          });
          state.chatWindow.currentInput = '';
        }
      }
    },

    receiveChatFromNpc: (state, action: PayloadAction<ContentBlock[]>) => {
      if (state.chatWindow) {
        // Add the message with content blocks
        state.chatWindow.messages.push({
          role: 'assistant',
          content: action.payload,
        });

        // Check for tool use in the content blocks and handle immediately
        for (const block of action.payload) {
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
      }
    },

    pauseForToolUse: (state) => {
      if (state.chatWindow) {
        state.chatWindow.pausingForToolUse = true;
      }
    },

    resumeFromToolUse: (state) => {
      // Reset pausing state after tool use is handled
      if (state.chatWindow) {
        state.chatWindow.pausingForToolUse = false;
      }
    },
  },
});

export const {
  exitChat,
  deleteCharFromInput,
  addCharToInput,
  movePlayer,
  sendChatToNpc,
  receiveChatFromNpc,
  pauseForToolUse,
  resumeFromToolUse,
} = gameSlice.actions;

export default gameSlice.reducer;
