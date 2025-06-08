/**
 * Represents an item that can be held in the player's inventory
 */
export interface GameItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  tileIndex?: number; // Optional tile index for visual representation
}

/**
 * Categories of items that can exist in the game
 */
export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  CONSUMABLE = 'consumable',
  TOOL = 'tool',
  QUEST = 'quest',
  MISC = 'misc',
}

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
  item: GameItem;
  quantity: number;
}
