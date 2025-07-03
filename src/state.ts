import { WorldState } from './world/types';
import { InventoryState } from './inventory/types';
import { DialogState } from './dialog/types';

export type GameState = WorldState & InventoryState & DialogState;
