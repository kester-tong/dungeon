import { z } from 'zod';
import { ItemType } from '../items';

export const StartingPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  mapId: z.string(),
});
export type StartingPosition = z.infer<typeof StartingPositionSchema>;

export const TerrainTileSchema = z.object({
  tileIndex: z.number(),
  type: z.literal('terrain'),
});

export const ObstacleTileSchema = z.object({
  tileIndex: z.number(),
  type: z.literal('obstacle'),
});

export const NPCTileSchema = z.object({
  tileIndex: z.number(),
  type: z.literal('npc'),
  npcId: z.string(),
});

export const TileSchema = z.discriminatedUnion('type', [
  TerrainTileSchema,
  ObstacleTileSchema,
  NPCTileSchema,
]);

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
  type: z.nativeEnum(ItemType),
  tileIndex: z.number().optional(),
});

export const InventorySlotSchema = z.object({
  objectId: z.string(),
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
  objects: z.record(GameItemSchema),
  initialInventory: InventorySchema,
  initialSplashText: z.string(),
  endOfMapText: z.string(),
  maps: z.record(MapSchema),
  npcs: z.record(NPCSchema),
});

export type GameConfig = z.infer<typeof GameConfigSchema>;
