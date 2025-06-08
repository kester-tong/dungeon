/**
 * Game Configuration - Machine Readable Format
 * Processes JSON game data into format ready for game engine
 */

import { Map } from '../maps/Map';
import { NPC } from '../npcs/NPC';
import { TilesetConfig } from '../tileset';
import gameDataJsonRaw from './gameData.json';

const gameDataJson = gameDataJsonRaw as GameConfig;

export interface StartingPosition {
  x: number;
  y: number;
  mapId: string;
}

export interface GameConfig {
  tileset: TilesetConfig;
  startingPosition: StartingPosition;
  canvas: {
    width: number;
    height: number;
  };
  sidepane: {
    width: number; // Width in tiles
  };
  maps: Record<string, Map>;
  npcs: Record<string, NPC>;
}

export const gameConfig: GameConfig = gameDataJson;
