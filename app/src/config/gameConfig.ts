/**
 * Game Configuration
 * Centralized configuration for game settings, assets, and constants
 */

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
}

export interface GameConfig {
  tileset: TilesetConfig;
  startingPosition: StartingPosition;
  mapUrl: string;
  canvas: {
    width: number;
    height: number;
  };
}

export const gameConfig: GameConfig = {
  tileset: {
    imagePath: "/assets/images/tileset.png",
    tileSize: 32,
    width: 64,
    height: 71,
    columnWidth: 32,
    characterTileIndex: 576, // 18 * 32
  },
  
  startingPosition: {
    x: 5,
    y: 7,
  },
  
  mapUrl: "/assets/maps/town.json",
  
  canvas: {
    width: 800,
    height: 480,
  },
};