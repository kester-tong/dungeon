export interface Tile {
    tileIndex: number;
    type: "terrain" | "obstacle" | "chattable";
}

export interface Map {
    data: Tile[][];
    width: number;
    height: number;
};