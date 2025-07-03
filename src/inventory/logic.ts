import { Inventory, InventorySlot } from './types';

export function getItemQuantity(inventory: Inventory, objectId: string): number {
  const item = inventory.items.find((slot) => slot.objectId === objectId);
  return item ? item.quantity : 0;
}

export function getUsedSlots(inventory: Inventory): number {
  return inventory.items.length;
}

export function addItem(
  inventory: Inventory,
  objectId: string,
  quantity: number
): Inventory {
  const newInventory = JSON.parse(JSON.stringify(inventory));
  const itemIndex = newInventory.items.findIndex(
    (i: InventorySlot) => i.objectId === objectId
  );
  if (itemIndex > -1) {
    newInventory.items[itemIndex].quantity += quantity;
  } else {
    newInventory.items.push({ objectId, quantity });
  }
  return newInventory;
}

export function removeItem(
  inventory: Inventory,
  objectId: string,
  quantity: number
): Inventory {
  const newInventory = JSON.parse(JSON.stringify(inventory));
  const itemIndex = newInventory.items.findIndex(
    (i: InventorySlot) => i.objectId === objectId
  );
  if (itemIndex > -1) {
    newInventory.items[itemIndex].quantity -= quantity;
    if (newInventory.items[itemIndex].quantity <= 0) {
      newInventory.items.splice(itemIndex, 1);
    }
  }
  return newInventory;
}
