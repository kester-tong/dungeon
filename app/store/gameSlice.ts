import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Map } from '../../src/maps/Map'
import { gameConfig } from '../../src/config/gameConfig';

/**
 * Position represents x, y coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * NavigatingLocation represents the player moving around the game world
 */
export interface NavigatingLocation {
  type: 'navigating';
  player: Position;
}

/**
 * InChatLocation represents the player in a chat/dialog interface
 */
export interface InChatLocation {
  type: 'in_chat';
  messages: string[];
  currentInput: string;
  previousLocation: Position;
  npcType: string;
}

/**
 * Location is a labeled union representing where/how the player is currently located
 */
export type Location = NavigatingLocation | InChatLocation;

export interface GameState {
  map: Map | null;
  location: Location | null;
  assetsLoaded: boolean;
  chatLoading: boolean;
}

const initialState: GameState = {
  map: null,
  location: null,
  assetsLoaded: false,
  chatLoading: false,
}

// Async thunk for sending chat messages to NPC
export const sendChatMessage = createAsyncThunk(
  'game/sendChatMessage',
  async (params: { message: string; npcType: string }) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: params.message,
        npcType: params.npcType,
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
        // Add user message to chat
        dispatch(gameSlice.actions.addChatMessage(`> ${message}`))
        dispatch(gameSlice.actions.clearChatInput())
        
        // Get the NPC type from the current chat context
        // We'll need to store this when entering chat
        const npcType = gameState.location.npcType || 'generic'
        
        // Send to API and wait for response
        const response = await dispatch(sendChatMessage({ message, npcType }))
        
        if (sendChatMessage.fulfilled.match(response)) {
          dispatch(gameSlice.actions.addChatMessage(response.payload))
        } else {
          dispatch(gameSlice.actions.addChatMessage("Sorry, I couldn't understand that."))
        }
      }
      
      return
    }

    // For all other keys, just dispatch the regular keyDown action
    dispatch(gameSlice.actions.keyDown(key))
  }
)

/**
 * Get NPC type based on tile index for API calls
 */
function getNpcType(tileIndex: number): string {
  switch (tileIndex) {
    case 71: return 'tavern_keeper';
    case 73: return 'shop_keeper';
    case 75: return 'priest';
    case 2465: return 'blacksmith';
    default: return 'generic';
  }
}

/**
 * Get chat messages based on the tile index
 */
function getChatMessages(tileIndex: number): string[] {
  switch (tileIndex) {
    case 71: // Tavern door (t)
      return [
        "Welcome to the Rusty Anchor Tavern!\nWould you like some ale or a hot meal?\nWe have rooms available upstairs if you need rest."
      ];
    case 73: // Shop door (s)
      return [
        "Welcome to the General Store!",
        "We have supplies, weapons, and armor.",
        "What can I help you find today?"
      ];
    case 75: // Temple door (p)
      return [
        "Blessings upon you, traveler.",
        "This is the Temple of Light.",
        "Would you like healing or guidance?"
      ];
    case 2465: // Blacksmith door (b)
      return [
        "Welcome to the forge!",
        "I can repair your equipment or craft new items.",
        "The fire burns hot today - perfect for smithing!"
      ];
    default:
      return [
        "Hello there!",
        "Nice weather we're having."
      ];
  }
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    loadMap: (state, action: PayloadAction<Map>) => {
      state.map = action.payload;
      // Initialize player at starting position when map loads
      state.location = {
        type: 'navigating',
        player: gameConfig.startingPosition
      };
      state.assetsLoaded = true;
    },
    
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
          const newMessage = `> ${state.location.currentInput}`;
          state.location.messages.push(newMessage);
          state.location.currentInput = "";
        } else if (key === 'Backspace') {
          state.location.currentInput = state.location.currentInput.slice(0, -1);
        } else if (key.length === 1) {
          state.location.currentInput += key;
        }
        return;
      }
      
      // Handle movement keys when navigating
      if (state.location?.type === 'navigating' && state.map) {
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
        
        // Check bounds
        if (newX < 0 || newX >= state.map.width || newY < 0 || newY >= state.map.height) {
          return;
        }
        
        const targetTile = state.map.data[newY][newX];
        
        // Check if target tile is chattable - enter chat
        if (targetTile.type === "chattable") {
          const chatMessages = getChatMessages(targetTile.tileIndex);
          const npcType = getNpcType(targetTile.tileIndex);
          state.location = {
            type: 'in_chat',
            messages: chatMessages,
            currentInput: "",
            previousLocation: state.location.player,
            npcType
          };
          return;
        }
        
        // Check if target tile is walkable (terrain)
        if (targetTile.type === "terrain") {
          state.location.player.x = newX;
          state.location.player.y = newY;
        }
      }
    },
    
    // Helper reducers for chat functionality
    addChatMessage: (state, action: PayloadAction<string>) => {
      if (state.location?.type === 'in_chat') {
        state.location.messages.push(action.payload)
      }
    },
    
    clearChatInput: (state) => {
      if (state.location?.type === 'in_chat') {
        state.location.currentInput = ""
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
  loadMap,
  keyDown,
  addChatMessage,
  clearChatInput,
} = gameSlice.actions

export default gameSlice.reducer