import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { gameConfig } from '@/src/config/gameConfig'

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
 * Turn semantics:
 * - If messages is empty, it's the user's turn by default
 * - Otherwise, it's whoever's turn is next based on the last message
 * - If it's AI's turn, we're waiting for AI response
 */
export interface InChatLocation {
  type: 'in_chat';
  intro_text: string;
  messages: ChatMessage[];
  currentInput: string;
  previousLocation: Position;
  npcId: string;
  pausingForToolUse: boolean;
}

/**
 * Location is a labeled union representing where/how the player is currently located
 */
export type Location = NavigatingLocation | InChatLocation;

export interface GameState {
  config: typeof gameConfig;
  location: Location;
}

const initialState: GameState = {
  config: gameConfig,
  location: {
    type: 'navigating',
    player: gameConfig.startingPosition
  },
}

// Helper function for movement logic
function handleMovement(state: GameState, direction: 'north' | 'south' | 'east' | 'west') {
  if (state.location.type !== 'navigating') return

  const currentMap = state.config.maps[state.location.player.mapId]
  if (!currentMap) return

  // Calculate new position based on direction
  let newX = state.location.player.x
  let newY = state.location.player.y

  switch (direction) {
    case 'west':
      newX = state.location.player.x - 1
      break
    case 'east':
      newX = state.location.player.x + 1
      break
    case 'north':
      newY = state.location.player.y - 1
      break
    case 'south':
      newY = state.location.player.y + 1
      break
  }

  // Check bounds and handle map transitions
  if (newX < 0 || newX >= currentMap.width || newY < 0 || newY >= currentMap.height) {
    // Check if there's a neighboring map in the direction we're trying to go
    const neighborMapId = currentMap.neighbors[direction as keyof typeof currentMap.neighbors]
    if (neighborMapId) {
      const neighborMap = state.config.maps[neighborMapId]
      // Calculate entry position on the new map
      let entryX: number
      let entryY: number

      if (direction === 'north') {
        entryX = state.location.player.x
        entryY = neighborMap.height - 1
      } else if (direction === 'south') {
        entryX = state.location.player.x
        entryY = 0
      } else if (direction === 'west') {
        entryX = neighborMap.width - 1
        entryY = state.location.player.y
      } else { // east
        entryX = 0
        entryY = state.location.player.y
      }

      // Transition to the new map
      state.location.player = {
        x: entryX,
        y: entryY,
        mapId: neighborMapId
      }
      return
    }

    // No neighbor found, stop movement
    return
  }

  const targetTile = currentMap.data[newY][newX]

  // Check if target tile is an NPC - enter chat
  if (targetTile.type === "npc") {
    const npc = state.config.npcs[targetTile.npcId]
    const messages: ChatMessage[] = []

    if (npc?.first_message) {
      messages.push({ role: 'assistant', content: npc.first_message })
    }

    state.location = {
      type: 'in_chat',
      intro_text: npc.intro_text,
      messages,
      currentInput: "",
      previousLocation: state.location.player,
      npcId: targetTile.npcId,
      pausingForToolUse: false
    }
    return
  }

  // Check if target tile is walkable (terrain)
  if (targetTile.type === "terrain") {
    state.location.player.x = newX
    state.location.player.y = newY
    // mapId stays the same when moving within the same map
  }
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {

    // Functional actions
    exitChat: (state) => {
      if (state.location.type === 'in_chat') {
        state.location = {
          type: 'navigating',
          player: state.location.previousLocation
        }
      }
    },

    deleteCharFromInput: (state) => {
      if (state.location.type === 'in_chat') {
        state.location.currentInput = state.location.currentInput.slice(0, -1)
      }
    },

    addCharToInput: (state, action: PayloadAction<string>) => {
      if (state.location.type === 'in_chat') {
        state.location.currentInput += action.payload
      }
    },

    movePlayer: (state, action: PayloadAction<'north' | 'south' | 'east' | 'west'>) => {
      if (state.location.type === 'navigating') {
        handleMovement(state, action.payload)
      }
    },

    // Chat functionality
    sendChatToNpc: (state) => {
      if (state.location.type === 'in_chat') {
        const message = state.location.currentInput.trim()
        if (message) {
          state.location.messages.push({ role: 'user', content: message })
          state.location.currentInput = ""
        }
      }
    },

    receiveChatFromNpc: (state, action: PayloadAction<string>) => {
      if (state.location.type === 'in_chat') {
        state.location.messages.push({ role: 'assistant', content: action.payload })
      }
    },

    pauseForToolUse: (state) => {
      if (state.location.type === 'in_chat') {
        state.location.pausingForToolUse = true
      }
    },

    handleNpcToolUse: (state, action: PayloadAction<ToolUse>) => {
      switch (action.payload.name) {
        case 'open_door':
          if (state.location.type === 'in_chat') {
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
      
      // Reset pausing state after tool use is handled
      if (state.location.type === 'in_chat') {
        state.location.pausingForToolUse = false
      }
    },
  },
})

export const {
  exitChat,
  deleteCharFromInput,
  addCharToInput,
  movePlayer,
  sendChatToNpc,
  receiveChatFromNpc,
  pauseForToolUse,
  handleNpcToolUse,
} = gameSlice.actions

export default gameSlice.reducer