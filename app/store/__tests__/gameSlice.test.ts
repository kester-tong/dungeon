import { ChatResponse } from '@/app/api/chat/types';
import gameReducer, {
  movePlayer,
  exitChat,
  dismissSplashText,
  deleteCharFromInput,
  addCharToInput,
  sendChatToNpc,
  handleChatResponse,
  confirmAction,
  GameState,
} from '../gameSlice';
import { createStateWithChat, createMockMessage } from '../testUtils';
import { gameConfig } from '@/src/config/gameConfig';

describe('gameSlice', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = gameReducer(undefined, { type: 'unknown' });
      expect(state).toEqual({
        player: gameConfig.startingPosition,
        chatWindow: null,
        inventory: gameConfig.initialInventory,
        splashText: gameConfig.initialSplashText,
      });
    });
  });

  describe('Movement Reducers', () => {
    let initialState: GameState;

    beforeEach(() => {
      initialState = {
        player: gameConfig.startingPosition,
        chatWindow: null,
        inventory: gameConfig.initialInventory,
        splashText: null,
      };
    });

    describe('movePlayer', () => {
      it('should move player north within map bounds', () => {
        const state = gameReducer(initialState, movePlayer('north'));
        expect(state.player).toEqual({
          x: gameConfig.startingPosition.x,
          y: gameConfig.startingPosition.y - 1,
          mapId: gameConfig.startingPosition.mapId,
        });
      });

      it('should move player south within map bounds', () => {
        const state = gameReducer(initialState, movePlayer('south'));
        expect(state.player).toEqual({
          x: gameConfig.startingPosition.x,
          y: gameConfig.startingPosition.y + 1,
          mapId: gameConfig.startingPosition.mapId,
        });
      });

      it('should move player east within map bounds', () => {
        const state = gameReducer(initialState, movePlayer('east'));
        expect(state.player).toEqual({
          x: gameConfig.startingPosition.x + 1,
          y: gameConfig.startingPosition.y,
          mapId: gameConfig.startingPosition.mapId,
        });
      });

      it('should move player west within map bounds', () => {
        const state = gameReducer(initialState, movePlayer('west'));
        expect(state.player).toEqual({
          x: gameConfig.startingPosition.x - 1,
          y: gameConfig.startingPosition.y,
          mapId: gameConfig.startingPosition.mapId,
        });
      });

      it('should transition to neighboring map when moving beyond bounds', () => {
        const stateAtEdge = {
          ...initialState,
          player: { x: 5, y: 0, mapId: 'town' },
        };
        const state = gameReducer(stateAtEdge, movePlayer('north'));
        expect(state.player).toEqual({ x: 5, y: 14, mapId: 'forest' });
      });

      it('should show end of map text when no neighbor exists', () => {
        const currentMap = gameConfig.maps[gameConfig.startingPosition.mapId];
        const stateAtEdge = {
          ...initialState,
          player: {
            x: currentMap.width - 1,
            y: gameConfig.startingPosition.y,
            mapId: gameConfig.startingPosition.mapId,
          },
        };
        const state = gameReducer(stateAtEdge, movePlayer('east'));
        expect(state.splashText).toBe(gameConfig.endOfMapText);
        expect(state.player).toEqual(stateAtEdge.player); // Player shouldn't move
      });

      it('should not move player while in chat', () => {
        const stateWithChatWindow = createStateWithChat();
        const state = gameReducer(stateWithChatWindow, movePlayer('north'));
        expect(state.player).toEqual(initialState.player); // No change
      });

      it('should not move to an invalid position', () => {
        // Test that player can't move to an invalid position
        const state = gameReducer(initialState, movePlayer('north'));
        // Movement should work within map bounds
        expect(state.player.y).toBeLessThan(
          gameConfig.maps[gameConfig.startingPosition.mapId].height
        );
        expect(state.player.y).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Chat Functionality Reducers', () => {
    describe('exitChat', () => {
      it('should clear chat window', () => {
        const stateWithChatWindow = createStateWithChat();
        const state = gameReducer(stateWithChatWindow, exitChat());
        expect(state.chatWindow).toBeNull();
      });

      it('should not change state if no chat window exists', () => {
        const testState = {
          player: gameConfig.startingPosition,
          chatWindow: null,
          inventory: gameConfig.initialInventory,
          splashText: null,
        };
        const state = gameReducer(testState, exitChat());
        expect(state).toEqual(testState);
      });
    });

    describe('addCharToInput', () => {
      it('should add character to current message in user turn', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'user_turn', currentMessage: 'hello' },
        });
        const state = gameReducer(stateWithChat, addCharToInput('!'));
        expect(state.chatWindow?.turnState).toEqual({
          type: 'user_turn',
          currentMessage: 'hello!',
        });
      });

      it('should not add character if not in user turn', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'waiting_for_ai' },
        });
        const state = gameReducer(stateWithChat, addCharToInput('!'));
        expect(state.chatWindow?.turnState).toEqual({ type: 'waiting_for_ai' });
      });

      it('should not change state if no chat window exists', () => {
        const testState = {
          player: gameConfig.startingPosition,
          chatWindow: null,
          inventory: gameConfig.initialInventory,
          splashText: null,
        };
        const state = gameReducer(testState, addCharToInput('!'));
        expect(state).toEqual(testState);
      });
    });

    describe('deleteCharFromInput', () => {
      it('should remove last character from current message', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'user_turn', currentMessage: 'hello!' },
        });
        const state = gameReducer(stateWithChat, deleteCharFromInput());
        expect(state.chatWindow?.turnState).toEqual({
          type: 'user_turn',
          currentMessage: 'hello',
        });
      });

      it('should handle empty message gracefully', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'user_turn', currentMessage: '' },
        });
        const state = gameReducer(stateWithChat, deleteCharFromInput());
        expect(state.chatWindow?.turnState).toEqual({
          type: 'user_turn',
          currentMessage: '',
        });
      });
    });

    describe('sendChatToNpc', () => {
      it('should add user message and transition to waiting state', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'user_turn', currentMessage: 'Hello there' },
          messages: [],
        });
        const state = gameReducer(stateWithChat, sendChatToNpc());

        expect(state.chatWindow?.messages).toHaveLength(1);
        expect(state.chatWindow?.messages[0]).toEqual({
          role: 'user',
          parts: [{ text: 'Hello there' }],
        });
        expect(state.chatWindow?.turnState).toEqual({ type: 'waiting_for_ai' });
      });

      it('should not change state if not in user turn', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'waiting_for_ai' },
        });
        const originalState = JSON.parse(JSON.stringify(stateWithChat));
        const state = gameReducer(stateWithChat, sendChatToNpc());
        expect(state).toEqual(originalState);
      });
    });

    describe('handleChatResponse', () => {
      it('should handle successful chat response', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'waiting_for_ai' },
          messages: [createMockMessage('user', 'Hello')],
        });

        const response: ChatResponse = {
          success: true,
          response: {
            content: {
              role: 'model' as const,
              parts: [{ text: 'Hi there!' }],
            },
          },
        };

        const state = gameReducer(stateWithChat, handleChatResponse(response));

        expect(state.chatWindow?.messages).toHaveLength(2);
        expect(state.chatWindow?.messages[1]).toEqual(
          response.response.content
        );
        expect(state.chatWindow?.turnState).toEqual({
          type: 'user_turn',
          currentMessage: '',
        });
      });

      it('should handle response with function call for confirmation', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'waiting_for_ai' },
          messages: [createMockMessage('user', 'I want to buy something')],
        });

        const functionCall = {
          name: 'sell_item',
          args: { object_id: 'sword', price: 10 },
        };

        const response: ChatResponse = {
          success: true,
          response: {
            content: {
              role: 'model' as const,
              parts: [{ text: 'I have a sword for 10 gold.', functionCall }],
            },
          },
        };

        const state = gameReducer(stateWithChat, handleChatResponse(response));

        expect(state.chatWindow?.turnState).toEqual({
          type: 'confirming_action',
          functionCall,
        });
      });

      it('should handle response with open_door function call', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'waiting_for_ai' },
          messages: [createMockMessage('user', 'Open the door')],
        });

        const functionCall = {
          name: 'open_door',
          args: {},
        };

        const response: ChatResponse = {
          success: true,
          response: {
            content: {
              role: 'model' as const,
              parts: [{ text: 'Opening the door...', functionCall }],
            },
          },
        };

        const state = gameReducer(stateWithChat, handleChatResponse(response));

        expect(state.chatWindow?.turnState).toEqual({
          type: 'animating_before_end_chat',
        });
      });

      it('should not change state if not waiting for AI', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'user_turn', currentMessage: '' },
        });
        const originalState = JSON.parse(JSON.stringify(stateWithChat));

        const response: ChatResponse = {
          success: true,
          response: {
            content: {
              role: 'model' as const,
              parts: [{ text: 'Hi there!' }],
            },
          },
        };

        const state = gameReducer(stateWithChat, handleChatResponse(response));
        expect(state).toEqual(originalState);
      });

      it('should return early on unsuccessful response', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'waiting_for_ai' },
        });
        const originalState = JSON.parse(JSON.stringify(stateWithChat));

        const response: ChatResponse = {
          success: false,
          error: 'Something went wrong',
        };

        const state = gameReducer(stateWithChat, handleChatResponse(response));
        expect(state).toEqual(originalState);
      });
    });
  });

  describe('Action Confirmation Reducers', () => {
    describe('confirmAction', () => {
      it('should handle confirmed sell_item action', () => {
        const functionCall = {
          name: 'sell_item',
          args: { object_id: 'rope', price: 2 },
        };

        const stateWithConfirmation = createStateWithChat({
          turnState: { type: 'confirming_action', functionCall },
          messages: [createMockMessage('user', 'I want to buy rope')],
        });

        const state = gameReducer(stateWithConfirmation, confirmAction(true));

        // Should add function response to messages
        expect(state.chatWindow?.messages).toHaveLength(2);
        expect(state.chatWindow?.messages[1]).toEqual({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: 'sell_item',
                response: { output: 'accept' },
              },
            },
          ],
        });

        // Should add item to inventory
        const ropeItem = state.inventory.items.find(
          (slot) => slot.item.id === 'rope'
        );
        expect(ropeItem).toBeDefined();
        expect(ropeItem?.quantity).toBe(1);

        // Should deduct gold
        const goldItem = state.inventory.items.find(
          (slot) => slot.item.id === 'gold_coin'
        );
        expect(goldItem?.quantity).toBe(8); // 10 - 2

        // Should transition to waiting for AI
        expect(state.chatWindow?.turnState).toEqual({ type: 'waiting_for_ai' });
      });

      it('should handle rejected action', () => {
        const functionCall = {
          name: 'sell_item',
          args: { object_id: 'rope', price: 2 },
        };

        const stateWithConfirmation = createStateWithChat({
          turnState: { type: 'confirming_action', functionCall },
          messages: [createMockMessage('user', 'I want to buy rope')],
        });

        const state = gameReducer(stateWithConfirmation, confirmAction(false));

        // Should add rejection response to messages
        expect(state.chatWindow?.messages[1]).toEqual({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: 'sell_item',
                response: { output: 'reject' },
              },
            },
          ],
        });

        // Should transition to waiting for AI
        expect(state.chatWindow?.turnState).toEqual({ type: 'waiting_for_ai' });
      });

      it('should not change state if not in confirming action state', () => {
        const stateWithChat = createStateWithChat({
          turnState: { type: 'user_turn', currentMessage: '' },
        });
        const originalState = JSON.parse(JSON.stringify(stateWithChat));

        const state = gameReducer(stateWithChat, confirmAction(true));
        expect(state).toEqual(originalState);
      });
    });
  });

  describe('Utility Reducers', () => {
    describe('dismissSplashText', () => {
      it('should clear splash text', () => {
        const stateWithSplash = {
          player: gameConfig.startingPosition,
          chatWindow: null,
          inventory: gameConfig.initialInventory,
          splashText: 'Welcome!',
        };
        const state = gameReducer(stateWithSplash, dismissSplashText());
        expect(state.splashText).toBeNull();
      });

      it('should not change state if no splash text exists', () => {
        const testState = {
          player: gameConfig.startingPosition,
          chatWindow: null,
          inventory: gameConfig.initialInventory,
          splashText: null,
        };
        const state = gameReducer(testState, dismissSplashText());
        expect(state).toEqual(testState);
      });
    });
  });
});
