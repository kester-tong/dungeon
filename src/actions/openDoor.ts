import { GameState } from '../state';
import { ActionResult } from './types';

export function openDoor(state: GameState): ActionResult {
  const newState = { ...state };
  newState.player =
    state.player.mapId === 'town'
      ? { mapId: 'forest', x: 11, y: 13 }
      : { mapId: 'town', x: 11, y: 1 };
  return {
    state: newState,
    functionResponse: { name: 'open_door', response: { result: 'success' } },
  };
}
