import { handleEvent } from './engine';
import { GameState } from '@/app/store/gameSlice';
import { GameEvent } from './types';

const initialGameState: GameState = {
  player: { mapId: 'town', x: 5, y: 7 },
  chatWindow: null,
  inventory: { items: [], maxSlots: 10 },
  splashText: null,
};

describe('Game Engine', () => {
  describe('Player Movement', () => {
    const movementTestCases: [string, GameState, GameEvent, Partial<GameState>][] = [
      [
        'should move the player north',
        initialGameState,
        { type: 'keydown', key: 'ArrowUp' },
        { player: { mapId: 'town', x: 5, y: 6 } },
      ],
      [
        'should move the player south',
        initialGameState,
        { type: 'keydown', key: 'ArrowDown' },
        { player: { mapId: 'town', x: 5, y: 8 } },
      ],
      [
        'should move the player west',
        initialGameState,
        { type: 'keydown', key: 'ArrowLeft' },
        { player: { mapId: 'town', x: 4, y: 7 } },
      ],
      [
        'should move the player east',
        initialGameState,
        { type: 'keydown', key: 'ArrowRight' },
        { player: { mapId: 'town', x: 6, y: 7 } },
      ],
      [
        'should not move the player into a wall',
        { ...initialGameState, player: { mapId: 'town', x: 1, y: 1 } },
        { type: 'keydown', key: 'ArrowUp' },
        { player: { mapId: 'town', x: 1, y: 1 } },
      ],
      [
        'should transition to a new map',
        { ...initialGameState, player: { mapId: 'town', x: 11, y: 0 } },
        { type: 'keydown', key: 'ArrowUp' },
        { player: { mapId: 'forest', x: 11, y: 14 } },
      ],
    ];

    it.each(movementTestCases)('%s', (name, initialState, event, expectedState) => {
      const { state: newState } = handleEvent(initialState, event);
      expect(newState).toMatchObject(expectedState);
    });
  });
});
