export interface TerrainTile {
  tileIndex: number;
  type: 'terrain';
}

export interface ObstacleTile {
  tileIndex: number;
  type: 'obstacle';
}

export interface NPCTile {
  tileIndex: number;
  type: 'npc';
  npcId: string;
}

export type Tile = TerrainTile | ObstacleTile | NPCTile;

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Map {
  data: Tile[][];
  width: number;
  height: number;
  neighbors: { [K in Direction]?: string };
}
