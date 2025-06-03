import { RootState } from './store'
import { InChatLocation } from './gameSlice'

/**
 * Selector to determine whose turn it is in a chat
 * - If messages is empty, it's the user's turn by default
 * - Otherwise, it's whoever's turn is next based on the last message
 */
export const selectIsUserTurn = (state: RootState): boolean => {
  const location = state.game.location
  if (!location || location.type !== 'in_chat') {
    return false
  }
  
  const chatLocation = location as InChatLocation
  
  // If messages is empty, it's the user's turn by default
  if (chatLocation.messages.length === 0) {
    return true
  }
  
  // Otherwise, it's whoever's turn is next based on the last message
  const lastMessage = chatLocation.messages[chatLocation.messages.length - 1]
  return lastMessage.role === 'assistant'
}

/**
 * Selector to determine if we're waiting for AI response
 * This replaces the old chatLoading state
 */
export const selectIsWaitingForAI = (state: RootState): boolean => {
  const location = state.game.location
  if (!location || location.type !== 'in_chat') {
    return false
  }
  
  return !selectIsUserTurn(state)
}

/**
 * Selector to get the current chat location if in chat
 */
export const selectChatLocation = (state: RootState): InChatLocation | null => {
  const location = state.game.location
  if (!location || location.type !== 'in_chat') {
    return null
  }
  
  return location as InChatLocation
}