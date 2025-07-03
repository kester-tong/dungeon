import { GameState } from '@/src/state';
import { Action, ActionResult } from './types';
import { sellItem, validateSellItem } from './sellItem';
import { openDoor } from './openDoor';
import { FunctionCall } from '@google/genai';

export function parseFunctionCall(functionCall: FunctionCall): Action | null {
  switch (functionCall.name) {
    case 'sell_item':
      return {
        type: 'sell_item',
        objectId: functionCall.args?.['object_id'] as string,
        price: functionCall.args?.['price'] as number,
      };
    case 'open_door':
      return { type: 'open_door' };
    default:
      return null;
  }
}

export function actionNeedsConfirmation(
  state: GameState,
  action: Action
): boolean {
  switch (action.type) {
    case 'sell_item':
      return validateSellItem(state, action) === null;
    case 'open_door':
      return false;
  }
}

export function shouldExitDialogAfterAction(action: Action): boolean {
  switch (action.type) {
    case 'open_door':
      return true;
    case 'sell_item':
      return false;
  }
}

export function performAction(state: GameState, action: Action): ActionResult {
  switch (action.type) {
    case 'open_door':
      return openDoor(state);
    case 'sell_item':
      return sellItem(state, action);
  }
}
