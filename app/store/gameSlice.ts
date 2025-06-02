import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Map } from '../../src/maps/Map'

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
}

/**
 * Location is a labeled union representing where/how the player is currently located
 */
export type Location = NavigatingLocation | InChatLocation;

export interface GameState {
  map: Map | null;
  location: Location | null;
  assetsLoaded: boolean;
}

const initialState: GameState = {
  map: null,
  location: null,
  assetsLoaded: false,
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
        player: { x: 5, y: 5 }
      };
      state.assetsLoaded = true;
    },
    
    movePlayer: (state, action: PayloadAction<{ dx: number; dy: number }>) => {
      if (!state.map || !state.location || state.location.type !== 'navigating') return;
      
      const { dx, dy } = action.payload;
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
        state.location = {
          type: 'in_chat',
          messages: chatMessages,
          currentInput: "",
          previousLocation: state.location.player
        };
        return;
      }
      
      // Check if target tile is walkable (terrain)
      if (targetTile.type === "terrain") {
        state.location.player.x = newX;
        state.location.player.y = newY;
      }
    },
    
    exitChat: (state) => {
      if (state.location?.type === 'in_chat') {
        state.location = {
          type: 'navigating',
          player: state.location.previousLocation
        };
      }
    },
    
    addChatInput: (state, action: PayloadAction<string>) => {
      if (state.location?.type === 'in_chat') {
        state.location.currentInput += action.payload;
      }
    },
    
    deleteChatInput: (state) => {
      if (state.location?.type === 'in_chat') {
        state.location.currentInput = state.location.currentInput.slice(0, -1);
      }
    },
    
    submitChatInput: (state) => {
      if (state.location?.type === 'in_chat') {
        const newMessage = `> ${state.location.currentInput}`;
        state.location.messages.push(newMessage);
        state.location.currentInput = "";
      }
    },
  },
})

export const {
  loadMap,
  movePlayer,
  exitChat,
  addChatInput,
  deleteChatInput,
  submitChatInput,
} = gameSlice.actions

export default gameSlice.reducer