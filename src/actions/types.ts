import { GameState } from '../state';
import { FunctionResponse } from '@google/genai';

/**
 * Strongly-typed action definitions
 */
export interface OpenDoorAction {
  type: 'open_door';
}

export interface SellItemAction {
  type: 'sell_item';
  objectId: string;
  price: number;
}

export type Action = OpenDoorAction | SellItemAction;

export type ActionResult = {
  state: GameState;
  functionResponse: FunctionResponse;
};
