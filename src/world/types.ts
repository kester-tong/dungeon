
/**
 * Position represents x, y coordinates and map location
 */
export interface Position {
  x: number;
  y: number;
  mapId: string;
}

export interface WorldState {
  player: Position;
  splashText: string | null;
}
