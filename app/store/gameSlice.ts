import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { gameConfig } from '../../src/config/GameConfig';

/**
 * Position represents x, y coordinates and map location
 */
export interface Position {
  x: number;
  y: number;
  mapId: string;
}

/**
 * NavigatingLocation represents the player moving around the game world
 */
export interface NavigatingLocation {
  type: 'navigating';
  player: Position;
}

/**
 * ChatMessage represents a single message in a conversation
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * InChatLocation represents the player in a chat/dialog interface
 */
export interface InChatLocation {
  type: 'in_chat';
  intro_text: string | null;
  messages: ChatMessage[];
  currentInput: string;
  previousLocation: Position;
  npcId: string;
}

/**
 * Location is a labeled union representing where/how the player is currently located
 */
export type Location = NavigatingLocation | InChatLocation;

export interface GameState {
  config: typeof gameConfig;
  location: Location | null;
  chatLoading: boolean;
}

const initialState: GameState = {
  config: gameConfig,
  location: {
    type: 'navigating',
    player: gameConfig.startingPosition
  },
  chatLoading: false,
}


// Async thunk for sending chat messages to NPC
export const sendChatMessage = createAsyncThunk(
  'game/sendChatMessage',
  async (params: { messages: ChatMessage[]; npcId: string }) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: params.messages,
        npcId: params.npcId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    const data = await response.json()
    return data.response
  }
)

// Async thunk for handling key presses with async logic
export const handleKeyPress = createAsyncThunk(
  'game/handleKeyPress',
  async (key: string, { getState, dispatch }) => {
    const state = getState() as { game: GameState }
    const gameState = state.game

    // Handle Enter key in chat - check if we should send to API
    if (key === 'Enter' && gameState.location?.type === 'in_chat') {
      const message = gameState.location.currentInput.trim()

      if (message) {
        // Build messages array including the new user message
        const allMessages = [...gameState.location.messages, { role: 'user' as const, content: message }]

        // Add user message to chat and clear input
        dispatch(gameSlice.actions.addChatMessage({ role: 'user', content: message }))
        dispatch(gameSlice.actions.clearChatInput())

        // Send all messages to API and wait for response
        const response = await dispatch(sendChatMessage({ messages: allMessages, npcId: gameState.location.npcId }))

        if (sendChatMessage.fulfilled.match(response)) {
          dispatch(gameSlice.actions.addChatMessage({ role: 'assistant', content: response.payload.text }))

          if (response.payload.tool_use) {
            setTimeout(() => {
              dispatch(gameSlice.actions.handleNpcToolUse(response.payload.tool_use))
            }, 500)
          }
        } else {
          dispatch(gameSlice.actions.addChatMessage({ role: 'assistant', content: "Sorry, I couldn't understand that." }))
        }
      }

      return
    }

    // Dispatch the keyDown action
    dispatch(gameSlice.actions.keyDown(key))
  }
)



const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {

    keyDown: (state, action: PayloadAction<string>) => {
      const key = action.payload;

      // Handle ESC key to exit chat
      if (key === 'Escape' && state.location?.type === 'in_chat') {
        state.location = {
          type: 'navigating',
          player: state.location.previousLocation
        };
        return;
      }

      // If we're in chat, handle text input
      if (state.location?.type === 'in_chat') {
        if (key === 'Enter') {
          const newMessage = state.location.currentInput;
          state.location.messages.push({ role: 'user', content: newMessage });
          state.location.currentInput = "";
        } else if (key === 'Backspace') {
          state.location.currentInput = state.location.currentInput.slice(0, -1);
        } else if (key.length === 1) {
          state.location.currentInput += key;
        }
        return;
      }

      // Handle movement keys when navigating
      if (state.location?.type === 'navigating') {
        const currentMap = state.config.maps[state.location.player.mapId];
        if (!currentMap) return;
        let dx = 0;
        let dy = 0;

        switch (key) {
          case 'ArrowLeft':
          case 'a':
            dx = -1;
            break;
          case 'ArrowRight':
          case 'd':
            dx = 1;
            break;
          case 'ArrowUp':
          case 'w':
            dy = -1;
            break;
          case 'ArrowDown':
          case 's':
            dy = 1;
            break;
          default:
            return;
        }

        const newX = state.location.player.x + dx;
        const newY = state.location.player.y + dy;

        // Check bounds and handle map transitions
        if (newX < 0 || newX >= currentMap.width || newY < 0 || newY >= currentMap.height) {
          // Check if there's a neighboring map in the direction we're trying to go
          let direction: string | null = null;
          if (newX < 0) direction = 'west';
          else if (newX >= currentMap.width) direction = 'east';
          else if (newY < 0) direction = 'north';
          else if (newY >= currentMap.height) direction = 'south';

          if (direction) {
            const neighborMapId = currentMap.neighbors[direction as keyof typeof currentMap.neighbors];
            if (neighborMapId) {
              const neighborMap = state.config.maps[neighborMapId];
              // Calculate entry position on the new map
              let entryX: number;
              let entryY: number;

              if (direction === 'north') {
                entryX = state.location.player.x;
                entryY = neighborMap.height - 1;
              } else if (direction === 'south') {
                entryX = state.location.player.x;
                entryY = 0;
              } else if (direction === 'west') {
                entryX = neighborMap.width - 1;
                entryY = state.location.player.y;
              } else { // east
                entryX = 0;
                entryY = state.location.player.y;
              }

              // Transition to the new map
              state.location.player = {
                x: entryX,
                y: entryY,
                mapId: neighborMapId
              };
              return;
            }
          }

          // No neighbor found, stop movement
          return;
        }

        const targetTile = currentMap.data[newY][newX];

        // Check if target tile is an NPC - enter chat
        if (targetTile.type === "npc") {
          const npc = state.config.npcs[targetTile.npcId];
          const messages: ChatMessage[] = [];

          if (npc?.first_message) {
            messages.push({ role: 'assistant', content: npc.first_message });
          }

          state.location = {
            type: 'in_chat',
            intro_text: npc?.intro_text || null,
            messages,
            currentInput: "",
            previousLocation: state.location.player,
            npcId: targetTile.npcId
          };
          return;
        }

        // Check if target tile is walkable (terrain)
        if (targetTile.type === "terrain") {
          state.location.player.x = newX;
          state.location.player.y = newY;
          // mapId stays the same when moving within the same map
        }
      }
    },

    // Helper reducers for chat functionality
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (state.location?.type === 'in_chat') {
        state.location.messages.push(action.payload)
      }
    },

    clearChatInput: (state) => {
      if (state.location?.type === 'in_chat') {
        state.location.currentInput = ""
      }
    },

    handleNpcToolUse: (state, action: PayloadAction<ToolUse>) => {
      switch (action.payload.name) {
        case 'open_door':
          if (state.location?.type === 'in_chat') {
            // If play is on the town side of the door, move them to the forest
            if (state.location.previousLocation.mapId === 'town') {
              state.location = {
                type: 'navigating',
                player: {
                  mapId: 'forest',
                  x: 11,
                  y: 13,
                }
              }
            } else {
              state.location = {
                type: 'navigating',
                player: {
                  mapId: 'town',
                  x: 11,
                  y: 1,
                }
              }
            }
          }
      }
    },
  },

  // Handle async thunk states
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.chatLoading = true
      })
      .addCase(sendChatMessage.fulfilled, (state) => {
        state.chatLoading = false
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.chatLoading = false
      })
  },
})

export const {
  keyDown,
  addChatMessage,
  clearChatInput,
} = gameSlice.actions

export default gameSlice.reducer