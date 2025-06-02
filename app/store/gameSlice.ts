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

// Async thunk for loading NPC intro messages
export const loadNPCChat = createAsyncThunk(
  'game/loadNPCChat',
  async (params: { npcId: string; previousLocation: Position }) => {
    const response = await fetch(`/assets/npcs/${params.npcId}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load NPC ${params.npcId}`)
    }
    const npc = await response.json()
    
    // Return intro_text and first_message if available
    const messages: ChatMessage[] = []
    if (npc.first_message) {
      messages.push({ role: 'assistant', content: npc.first_message })
    }
    
    return {
      intro_text: npc.intro_text,
      messages,
      npcId: params.npcId,
      previousLocation: params.previousLocation
    }
  }
)

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
          dispatch(gameSlice.actions.addChatMessage({ role: 'assistant', content: response.payload }))
        } else {
          dispatch(gameSlice.actions.addChatMessage({ role: 'assistant', content: "Sorry, I couldn't understand that." }))
        }
      }
      
      return
    }

    // First, dispatch the regular keyDown action
    dispatch(gameSlice.actions.keyDown(key))
    
    // Then check if we entered chat and need to load NPC data
    const newState = getState() as { game: GameState }
    if (newState.game.location?.type === 'in_chat' && newState.game.location.intro_text === null) {
      // We just entered chat but have no messages - load NPC intro
      await dispatch(loadNPCChat({ 
        npcId: newState.game.location.npcId, 
        previousLocation: newState.game.location.previousLocation 
      }))
    }
  }
)



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
        
        // Check if target tile is an NPC - enter chat with empty messages
        if (targetTile.type === "npc") {
          state.location = {
            type: 'in_chat',
            intro_text: null,  // Signal to load intro text and messages with async thunk
            messages: [],
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
  },
  
  // Handle async thunk states
  extraReducers: (builder) => {
    builder
      .addCase(loadNPCChat.fulfilled, (state, action) => {
        if (state.location?.type === 'in_chat') {
          state.location.intro_text = action.payload.intro_text
          state.location.messages = action.payload.messages
        }
      })
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