export class TownMap {
    private static readonly MAP_WIDTH = 25;
    private static readonly MAP_HEIGHT = 15;
    
    // Tile constants
    private static readonly GROUND_TILE = 2;
    private static readonly WALL_TILE = 21;
    private static readonly DOOR_TILE_START = 67;
    private static readonly DOOR_TILE_END = 82;
    
    // Store the map data as a 2D array
    private mapData: number[][];

    constructor() {
        // Initialize with ground tiles
        this.mapData = Array(TownMap.MAP_HEIGHT).fill(null)
            .map(() => Array(TownMap.MAP_WIDTH).fill(TownMap.GROUND_TILE));
        
        // Create town layout
        this.createTownLayout();
    }

    private createTownLayout(): void {
        // Create several buildings with different door types
        
        // Inn (top left)
        this.createBuilding(2, 2, 5, 4, TownMap.DOOR_TILE_START); // 67 = Inn door
        
        // Shop (top right)
        this.createBuilding(17, 2, 5, 4, TownMap.DOOR_TILE_START + 1); // 68 = Shop door
        
        // Blacksmith (middle left)
        this.createBuilding(3, 8, 6, 5, TownMap.DOOR_TILE_START + 2); // 69 = Blacksmith door
        
        // Temple (middle right)
        this.createBuilding(16, 8, 6, 5, TownMap.DOOR_TILE_START + 3); // 70 = Temple door
        
        // Houses (bottom)
        this.createBuilding(7, 10, 4, 3, TownMap.DOOR_TILE_START + 4); // 71 = House door
        this.createBuilding(14, 10, 4, 3, TownMap.DOOR_TILE_START + 5); // 72 = Another house door
    }

    private createBuilding(x: number, y: number, width: number, height: number, doorTile: number): void {
        // Create walls for the building
        for (let yPos = y; yPos < y + height; yPos++) {
            for (let xPos = x; xPos < x + width; xPos++) {
                // Place walls on the perimeter
                if (xPos === x || xPos === x + width - 1 || yPos === y || yPos === y + height - 1) {
                    this.mapData[yPos][xPos] = TownMap.WALL_TILE;
                }
            }
        }
        
        // Place door in the middle of the bottom wall
        const doorX = x + Math.floor(width / 2);
        const doorY = y + height - 1;
        this.mapData[doorY][doorX] = doorTile;
    }

    public getTileAt(x: number, y: number): number {
        if (x < 0 || x >= TownMap.MAP_WIDTH || y < 0 || y >= TownMap.MAP_HEIGHT) {
            return TownMap.GROUND_TILE; // Default to ground for out of bounds
        }
        return this.mapData[y][x];
    }

    public getWidth(): number {
        return TownMap.MAP_WIDTH;
    }

    public getHeight(): number {
        return TownMap.MAP_HEIGHT;
    }

    // Check if a position is walkable (not a wall)
    public isWalkable(x: number, y: number): boolean {
        const tile = this.getTileAt(x, y);
        return tile !== TownMap.WALL_TILE;
    }
}