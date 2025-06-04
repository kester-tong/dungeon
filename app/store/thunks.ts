import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from './store'
import type { ChatMessage } from './gameSlice'
import { 
  addChatMessage, 
  clearChatInput, 
  handleNpcToolUse,
  exitChat,
  deleteCharFromInput,
  addCharToInput,
  movePlayer,
} from './gameSlice'

// Async thunk for sending chat messages to NPC
export const sendChatMessage = createAsyncThunk(
  'game/sendChatMessage',
  async (params: { messages: ChatMessage[]; npcId: string }, { dispatch, getState }) => {
    const state = getState() as RootState
    const accessKey = state.auth.accessKey
    
    if (!accessKey) {
      throw new Error('No access key available')
    }
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: params.messages,
          npcId: params.npcId,
          accessKey: accessKey,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Add AI response to chat
      dispatch(addChatMessage({ role: 'assistant', content: data.response.text }))
      
      // Handle tool use if present
      if (data.response.tool_use) {
        setTimeout(() => {
          dispatch(handleNpcToolUse(data.response.tool_use))
        }, 500)
      }
      
      return data.response
    } catch (error) {
      // Add fallback message on error
      dispatch(addChatMessage({ role: 'assistant', content: "Sorry, I couldn't understand that." }))
      throw error
    }
  }
)

// Async thunk for handling key presses with async logic
export const handleKeyPress = createAsyncThunk(
  'game/handleKeyPress',
  async (params: { key: string }, { getState, dispatch }) => {
    const { key } = params
    const state = getState() as RootState
    const gameState = state.game

    // Handle Enter key in chat - check if we should send to API
    if (key === 'Enter' && gameState.location.type === 'in_chat') {
      const message = gameState.location.currentInput.trim()

      if (message) {
        // Build messages array including the new user message
        const allMessages = [...gameState.location.messages, { role: 'user' as const, content: message }]

        // Add user message to chat and clear input
        dispatch(addChatMessage({ role: 'user', content: message }))
        dispatch(clearChatInput())

        // Send all messages to API (response handling is done in the thunk)
        await dispatch(sendChatMessage({ messages: allMessages, npcId: gameState.location.npcId }))
      }

      return
    }

    // Dispatch appropriate action based on location type and key
    const locationType = gameState.location.type

    if (locationType === 'in_chat') {
      switch (key) {
        case 'Escape':
          dispatch(exitChat())
          break
        case 'Backspace':
          dispatch(deleteCharFromInput())
          break
        default:
          // For regular characters in chat mode
          if (key.length === 1) {
            dispatch(addCharToInput(key))
          }
          break
      }
    } else if (locationType === 'navigating') {
      switch (key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dispatch(movePlayer('west'))
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          dispatch(movePlayer('east'))
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          dispatch(movePlayer('north'))
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          dispatch(movePlayer('south'))
          break
      }
    }
  }
)