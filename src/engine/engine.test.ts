import { handleEvent } from './engine';
import { GameState } from '@/app/store/gameSlice';
import { GameEvent, AsyncAction } from './types';
import { gameConfig } from '@/src/config/gameConfig';

type TestCase = {
  name: string;
  initialState: GameState;
  event: GameEvent;
  expectedState: Partial<GameState>;
  expectedActions?: AsyncAction[];
};

const initialGameState: GameState = {
  player: { mapId: 'town', x: 5, y: 7 },
  chatWindow: null,
  inventory: { items: [], maxSlots: 10 },
  splashText: null,
};

const testCases: TestCase[] = [
  // Player Movement
  {
    name: 'should move the player north',
    initialState: initialGameState,
    event: { type: 'keydown', key: 'ArrowUp' },
    expectedState: { player: { mapId: 'town', x: 5, y: 6 } },
  },
  {
    name: 'should move the player south',
    initialState: initialGameState,
    event: { type: 'keydown', key: 'ArrowDown' },
    expectedState: { player: { mapId: 'town', x: 5, y: 8 } },
  },
  {
    name: 'should move the player west',
    initialState: initialGameState,
    event: { type: 'keydown', key: 'ArrowLeft' },
    expectedState: { player: { mapId: 'town', x: 4, y: 7 } },
  },
  {
    name: 'should move the player east',
    initialState: initialGameState,
    event: { type: 'keydown', key: 'ArrowRight' },
    expectedState: { player: { mapId: 'town', x: 6, y: 7 } },
  },
  {
    name: 'should not move the player into a wall',
    initialState: { ...initialGameState, player: { mapId: 'town', x: 1, y: 1 } },
    event: { type: 'keydown', key: 'ArrowUp' },
    expectedState: { player: { mapId: 'town', x: 1, y: 1 } },
  },
  {
    name: 'should transition to a new map',
    initialState: { ...initialGameState, player: { mapId: 'town', x: 11, y: 0 } },
    event: { type: 'keydown', key: 'ArrowUp' },
    expectedState: { player: { mapId: 'forest', x: 11, y: 14 } },
  },
  {
    name: 'should show splash text when hitting a map boundary with no connecting map',
    initialState: { ...initialGameState, player: { mapId: 'town', x: 0, y: 7 } },
    event: { type: 'keydown', key: 'ArrowLeft' },
    expectedState: { splashText: gameConfig.endOfMapText },
  },
  // Chat and Tool Use
  {
    name: 'should transition to confirming_action when a function call is received',
    initialState: {
      ...initialGameState,
      chatWindow: {
        npcId: 'shop_keeper',
        intro_text: 'Welcome to my shop!',
        contents: [],
        chatHistory: [],
        turnState: { type: 'waiting_for_ai' },
      },
    },
    event: {
      type: 'chatresponse',
      response: {
        success: true,
        response: {
          content: {
            role: 'model',
            parts: [
              {
                functionCall: {
                  name: 'sell_item',
                  args: { object_id: 'rope', price: 10 },
                },
              },
            ],
          },
        },
      },
    },
    expectedState: {
      chatWindow: {
        npcId: 'shop_keeper',
        intro_text: 'Welcome to my shop!',
        contents: [
          {
            role: 'model',
            parts: [
              {
                functionCall: {
                  name: 'sell_item',
                  args: { object_id: 'rope', price: 10 },
                },
              },
            ],
          },
        ],
        chatHistory: [],
        turnState: {
          type: 'confirming_action',
          pendingAction: {
            type: 'sell_item',
            objectId: 'rope',
            price: 10,
          },
        },
      },
    },
  },
  {
    name: 'should perform the action when the user confirms',
    initialState: {
      ...initialGameState,
      chatWindow: {
        npcId: 'shop_keeper',
        intro_text: 'Welcome to my shop!',
        contents: [],
        chatHistory: [],
        turnState: {
          type: 'confirming_action',
          pendingAction: {
            type: 'sell_item',
            objectId: 'rope',
            price: 10,
          },
        },
      },
    },
    event: { type: 'keydown', key: 'y' },
    expectedState: {
      inventory: { items: [{ objectId: 'rope', quantity: 1 }], maxSlots: 10 },
    },
    expectedActions: [{ type: 'send_chat_request' }],
  },
  {
    name: 'should not perform the action when the user rejects',
    initialState: {
      ...initialGameState,
      chatWindow: {
        npcId: 'shop_keeper',
        intro_text: 'Welcome to my shop!',
        contents: [],
        chatHistory: [],
        turnState: {
          type: 'confirming_action',
          pendingAction: {
            type: 'sell_item',
            objectId: 'rope',
            price: 10,
          },
        },
      },
    },
    event: { type: 'keydown', key: 'n' },
    expectedState: {
      inventory: { items: [], maxSlots: 10 },
    },
    expectedActions: [{ type: 'send_chat_request' }],
  },
  {
    name: 'should remain in chat after a successful purchase',
    initialState: {
      ...initialGameState,
      chatWindow: {
        npcId: 'shop_keeper',
        intro_text: 'Welcome to my shop!',
        contents: [],
        chatHistory: [],
        turnState: {
          type: 'waiting_for_ai',
        },
      },
    },
    event: {
      type: 'chatresponse',
      response: {
        success: true,
        response: {
          content: {
            role: 'model',
            parts: [{ text: 'Thank you for your purchase!' }],
          },
        },
      },
    },
    expectedState: {
      chatWindow: {
        npcId: 'shop_keeper',
        intro_text: 'Welcome to my shop!',
        contents: [
          {
            role: 'model',
            parts: [{ text: 'Thank you for your purchase!' }],
          },
        ],
        chatHistory: [
          {
            type: 'text',
            role: 'model',
            content: 'Thank you for your purchase!',
          },
        ],
        turnState: { type: 'user_turn', currentMessage: '' },
      },
    },
  },
];

describe('Game Engine', () => {
  it.each(testCases)('$name', ({ initialState, event, expectedState, expectedActions }) => {
    const { state: newState, actions } = handleEvent(initialState, event);
    expect(newState).toMatchObject(expectedState);
    if (expectedActions) {
      expect(actions).toEqual(expectedActions);
    }
  });
});