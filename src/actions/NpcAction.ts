export type ActionType = 'open_gate' | 'offer_sale';

export interface BaseAction {
  type: ActionType;
}

export interface OpenGateAction extends BaseAction {
  type: 'open_gate';
}

export interface OfferSaleAction extends BaseAction {
  type: 'offer_sale';
  description: string;
  price: number;
}

/**
 * An action is something an NPC can do.
 *
 * Actions are expressed to NPCs via "tool use" within the Anthropic API
 */
export type NpcAction = OpenGateAction | OfferSaleAction;
