import { GameState } from '../state';
import { SellItemAction, ActionResult } from './types';
import { addItem, removeItem } from '../inventory';

export function sellItem(state: GameState, action: SellItemAction): ActionResult {
  const { objectId, price } = action;
  let newState = { ...state };
  newState.inventory = addItem(newState.inventory, objectId, 1);
  newState.inventory = removeItem(newState.inventory, 'gold_coin', price);
  return {
    state: newState,
    functionResponse: { name: 'sell_item', response: { result: 'accept' } },
  };
}
