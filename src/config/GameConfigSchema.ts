import { z } from 'zod';

export const StartingPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  mapId: z.string(),
});
export type StartingPosition = z.infer<typeof StartingPositionSchema>;

export const TileSchema = z.object({
  tileIndex: z.number(),
  type: z.enum(['terrain', 'obstacle', 'npc']),
  npcId: z.string().optional(),
});

export const MapSchema = z.object({
  data: z.array(z.array(TileSchema)),
  width: z.number(),
  height: z.number(),
  neighbors: z
    .object({
      north: z.string().optional(),
      south: z.string().optional(),
      east: z.string().optional(),
      west: z.string().optional(),
    })
    .partial()
    .default({}),
});

export const GameItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  tileIndex: z.number().optional(),
});

export const InventorySlotSchema = z.object({
  item: GameItemSchema,
  quantity: z.number(),
});

export const InventorySchema = z.object({
  items: z.array(InventorySlotSchema),
  maxSlots: z.number(),
});

export const TilesetConfigSchema = z.object({
  imagePath: z.string(),
  tileSize: z.number(),
  width: z.number(),
  height: z.number(),
  columnWidth: z.number(),
  characterTileIndex: z.number(),
});

export const NPCSchema = z.object({
  intro_text: z.string(),
  first_message: z.string().optional(),
  prompt: z.string(),
  functions: z.array(z.any()).optional(),
});

export const GameConfigSchema = z.object({
  tileset: TilesetConfigSchema,
  startingPosition: StartingPositionSchema,
  canvas: z.object({
    width: z.number(),
    height: z.number(),
  }),
  sidepane: z.object({
    width: z.number(),
  }),
  initialInventory: InventorySchema,
  initialSplashText: z.string(),
  endOfMapText: z.string(),
  maps: z.record(MapSchema),
  npcs: z.record(NPCSchema),
});

export type GameConfig = z.infer<typeof GameConfigSchema>;
