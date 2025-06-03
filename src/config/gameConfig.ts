/**
 * Game Configuration - Machine Readable Format
 * Processes JSON game data into format ready for game engine
 */

import { Map, Tile } from '../maps/Map';
import gameDataJsonRaw from './gameData.json';

const gameDataJson = gameDataJsonRaw as JsonGameConfig;

export interface TilesetConfig {
  imagePath: string;
  tileSize: number;
  width: number;
  height: number;
  columnWidth: number;
  characterTileIndex: number;
}

export interface StartingPosition {
  x: number;
  y: number;
  mapId: string;
}

export interface NPCConfig {
  intro_text: string;
  first_message: string;
  prompt: string;
}

export interface JsonMapConfig {
  tileMapping: Record<string, Tile>;
  data: string[];
}

export interface JsonGameConfig {
  tileset: TilesetConfig;
  startingPosition: StartingPosition;
  canvas: {
    width: number;
    height: number;
  };
  maps: Record<string, JsonMapConfig>;
  npcs: Record<string, NPCConfig>;
}

export interface GameConfig {
  tileset: TilesetConfig;
  startingPosition: StartingPosition;
  canvas: {
    width: number;
    height: number;
  };
  maps: Record<string, Map>;
  npcs: Record<string, NPCConfig>;
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
      data: processedData
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