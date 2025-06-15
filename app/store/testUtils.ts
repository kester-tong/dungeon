import { GameState, ChatWindow } from './gameSlice';
import { Content } from '@google/genai';
import { gameConfig } from '@/src/config/gameConfig';

// Mock chat window
export const createMockChatWindow = (
  overrides?: Partial<ChatWindow>
): ChatWindow => ({
  intro_text: 'A guard stands here',
  messages: [],
  npcId: 'guard',
  turnState: { type: 'user_turn', currentMessage: '' },
  ...overrides,
});

// Mock messages
export const createMockMessage = (
  role: 'user' | 'model',
  text: string
): Content => ({
  role,
  parts: [{ text }],
});

// Helper to create state with chat window
export const createStateWithChat = (
  chatOverrides?: Partial<ChatWindow>
): GameState => ({
  player: gameConfig.startingPosition,
  chatWindow: createMockChatWindow(chatOverrides),
  inventory: gameConfig.initialInventory,
  splashText: null,
});
