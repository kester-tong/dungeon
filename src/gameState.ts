import { TextBox } from './renderer.js';

/**
 * GameState represents the complete state of the game.
 * It serves as the single source of truth for the game's data.
 */
export class GameState {
    // Map state
    private readonly mapWidth: number;
    private readonly mapHeight: number;
    private mapData: number[][];
    
    // Tile constants
    public static readonly GROUND_TILE = 2;
    public static readonly WALL_TILE = 21;
    public static readonly DOOR_TILE_START = 67;
    public static readonly DOOR_TILE_END = 82;
    public static readonly CHARACTER_TILE_INDEX = 18 * 32;
    public static readonly TILE_SIZE = 32;
    
    // Player state
    private playerX: number;
    private playerY: number;
    
    // UI state
    private textBoxes: TextBox[] = [];
    
    // Input state
    private processedKeys: { [key: string]: boolean } = {};

    constructor(mapWidth: number, mapHeight: number) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        
        // Initialize player position in the middle of the map
        this.playerX = Math.floor(mapWidth / 2);
        this.playerY = Math.floor(mapHeight / 2);
        
        // Initialize with ground tiles
        this.mapData = Array(mapHeight).fill(null)
            .map(() => Array(mapWidth).fill(GameState.GROUND_TILE));
    }
    
    // Map methods
    
    public getMapWidth(): number {
        return this.mapWidth;
    }
    
    public getMapHeight(): number {
        return this.mapHeight;
    }
    
    public getTileAt(x: number, y: number): number {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return GameState.GROUND_TILE; // Default to ground for out of bounds
        }
        return this.mapData[y][x];
    }
    
    public setTileAt(x: number, y: number, tileIndex: number): void {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            this.mapData[y][x] = tileIndex;
        }
    }
    
    public isWalkable(x: number, y: number): boolean {
        const tile = this.getTileAt(x, y);
        return tile !== GameState.WALL_TILE;
    }
    
    // Player methods
    
    public getPlayerX(): number {
        return this.playerX;
    }
    
    public getPlayerY(): number {
        return this.playerY;
    }
    
    public movePlayer(dx: number, dy: number): boolean {
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;
        
        // Check if the new position is within bounds and walkable
        if (newX >= 0 && newX < this.mapWidth && 
            newY >= 0 && newY < this.mapHeight && 
            this.isWalkable(newX, newY)) {
            this.playerX = newX;
            this.playerY = newY;
            return true;
        }
        
        return false;
    }
    
    // Text box methods
    
    public getTextBoxes(): TextBox[] {
        return [...this.textBoxes];
    }
    
    public addTextBox(textBox: TextBox): void {
        this.textBoxes.push(textBox);
    }
    
    public clearTextBoxes(): void {
        this.textBoxes = [];
    }
    
    // Input methods
    
    public isKeyProcessed(key: string): boolean {
        return !!this.processedKeys[key];
    }
    
    public setKeyProcessed(key: string, processed: boolean): void {
        if (processed) {
            this.processedKeys[key] = true;
        } else {
            delete this.processedKeys[key];
        }
    }
    
    // Building creation
    
    public createBuilding(x: number, y: number, width: number, height: number, doorTile: number): void {
        // Create walls for the building
        for (let yPos = y; yPos < y + height; yPos++) {
            for (let xPos = x; xPos < x + width; xPos++) {
                // Place walls on the perimeter
                if (xPos === x || xPos === x + width - 1 || yPos === y || yPos === y + height - 1) {
                    this.mapData[yPos][xPos] = GameState.WALL_TILE;
                }
            }
        }
        
        // Place door in the middle of the bottom wall
        const doorX = x + Math.floor(width / 2);
        const doorY = y + height - 1;
        this.mapData[doorY][doorX] = doorTile;
    }
    
    // Create standard town layout
    public createTownLayout(): void {
        // Inn (top left)
        this.createBuilding(2, 2, 5, 4, GameState.DOOR_TILE_START); // 67 = Inn door
        
        // Shop (top right)
        this.createBuilding(17, 2, 5, 4, GameState.DOOR_TILE_START + 1); // 68 = Shop door
        
        // Blacksmith (middle left)
        this.createBuilding(3, 8, 6, 5, GameState.DOOR_TILE_START + 2); // 69 = Blacksmith door
        
        // Temple (middle right)
        this.createBuilding(16, 8, 6, 5, GameState.DOOR_TILE_START + 3); // 70 = Temple door
        
        // Houses (bottom)
        this.createBuilding(7, 10, 4, 3, GameState.DOOR_TILE_START + 4); // 71 = House door
        this.createBuilding(14, 10, 4, 3, GameState.DOOR_TILE_START + 5); // 72 = Another house door
    }
}