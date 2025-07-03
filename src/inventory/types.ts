/**
 * Represents a player's inventory containing items and quantities
 */
export interface Inventory {
  items: InventorySlot[];
  maxSlots: number;
}

/**
 * Represents a single slot in the inventory
 */
export interface InventorySlot {
  objectId: string;
  quantity: number;
}

export interface InventoryState {
  inventory: Inventory;
}