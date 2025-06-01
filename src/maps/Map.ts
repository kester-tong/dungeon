export interface Tile {
    tileIndex: number;
    type: "terrain" | "obstacle";
}

export interface Map {
    data: Tile[][];
    width: number;
    height: number;
};