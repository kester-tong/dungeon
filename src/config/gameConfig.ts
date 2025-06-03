/**
 * Game Configuration - Machine Readable Format
 * Processes JSON game data into format ready for game engine
 */

import { Map, Tile, Direction } from '../maps/Map';
import { NPC } from '../npcs/NPC';
import { TilesetConfig } from '../tileset';
import gameDataJsonRaw from './gameData.json';

const gameDataJson = gameDataJsonRaw as JsonGameConfig;


export interface StartingPosition {
  x: number;
  y: number;
  mapId: string;
}

export interface JsonMapConfig {
  tileMapping: Record<string, Tile>;
  data: string[];
  neighbors: { [K in Direction]?: string };
}

export interface JsonGameConfig {
  tileset: TilesetConfig;
  startingPosition: StartingPosition;
  canvas: {
    width: number;
    height: number;
  };
  maps: Record<string, JsonMapConfig>;
  npcs: Record<string, NPC>;
}

export interface GameConfig {
  tileset: TilesetConfig;
  startingPosition: StartingPosition;
  canvas: {
    width: number;
    height: number;
  };
  maps: Record<string, Map>;
  npcs: Record<string, NPC>;
}

// Process maps from JSON format to machine-readable format
function processMaps(jsonMaps: Record<string, JsonMapConfig>): Record<string, Map> {
  const processedMaps: Record<string, Map> = {};
  
  for (const [mapId, mapConfig] of Object.entries(jsonMaps)) {
    const height = mapConfig.data.length;
    const width = mapConfig.data[0]?.length || 0;
    
    const processedData = mapConfig.data.map(row => 
      row.split('').map(char => {
        const tile = mapConfig.tileMapping[char];
        if (!tile) {
          throw new Error(`Unknown tile character: '${char}' in map ${mapId}`);
        }
        return tile;
      })
    );

    processedMaps[mapId] = {
      width,
      height,
      data: processedData,
      neighbors: mapConfig.neighbors
    };
  }
  
  return processedMaps;
}

export const gameConfig: GameConfig = {
  tileset: gameDataJson.tileset,
  startingPosition: gameDataJson.startingPosition,
  canvas: gameDataJson.canvas,
  maps: processMaps(gameDataJson.maps),
  npcs: gameDataJson.npcs
};