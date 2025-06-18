import { GameState, ChatWindow } from './gameSlice';
import { Content } from '@google/genai';
import { gameConfig } from '@/src/config/gameConfig';

// Mock chat window
export const createMockChatWindow = (
  overrides?: Partial<ChatWindow> & { messages?: Content[] }
): ChatWindow => {
  const legacyMessages = (overrides as any)?.messages || [];
  const contents: Content[] = overrides?.contents || legacyMessages;
  const chatHistory = contents.flatMap((content) => {
    const entries = [];
    const parts = content.parts || [];

    for (const part of parts) {
      if (part.text) {
        entries.push({
          type: 'text' as const,
          role: content.role as 'user' | 'model',
          content: part.text,
        });
      }
    }

    return entries;
  });

  const baseWindow = {
    intro_text: 'A guard stands here',
    contents,
    chatHistory,
    npcId: 'guard',
    turnState: { type: 'user_turn', currentMessage: '' } as const,
  };

  return {
    ...baseWindow,
    ...overrides,
    contents: overrides?.contents || contents,
    chatHistory: overrides?.chatHistory || chatHistory,
  };
};

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
