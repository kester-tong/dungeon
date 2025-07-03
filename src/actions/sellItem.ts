import { GameState } from '../state';
import { SellItemAction, ActionResult } from './types';
import {
  addItem,
  removeItem,
  getItemQuantity,
  getUsedSlots,
} from '../inventory';

export function validateSellItem(
  state: GameState,
  action: SellItemAction
): string | null {
  const { price } = action;
  const gold = getItemQuantity(state.inventory, 'gold_coin');
  if (gold < price) {
    return 'You cannot afford this.';
  }

  const usedSlots = getUsedSlots(state.inventory);
  if (usedSlots >= state.inventory.maxSlots) {
    return 'Your inventory is full.';
  }

  return null;
}

export function sellItem(state: GameState, action: SellItemAction): ActionResult {
  const validationError = validateSellItem(state, action);
  if (validationError) {
    return {
      state,
      functionResponse: {
        name: 'sell_item',
        response: { error: validationError },
      },
    };
  }

  const { objectId, price } = action;
  let newState = { ...state };
  newState.inventory = addItem(newState.inventory, objectId, 1);
  newState.inventory = removeItem(newState.inventory, 'gold_coin', price);
  return {
    state: newState,
    functionResponse: { name: 'sell_item', response: { result: 'accept' } },
  };
}
