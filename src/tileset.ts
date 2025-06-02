export class Tileset {
    private image: HTMLImageElement;

    private static readonly TILE_SIZE = 32;
    private static readonly TILESET_WIDTH = 64;
    private static readonly TILESET_HEIGHT = 71;
    private static readonly COLUMN_WIDTH = 32;
    private static readonly CHARACTER_TILE_INDEX = 18 * 32; // Character tile index

    constructor(image: HTMLImageElement) {
        this.image = image;
    }

    public drawTile(ctx: CanvasRenderingContext2D, tileIndex: number, x: number, y: number): void {
        const sourceCoords = this.getTileCoordinates(tileIndex);
        
        // Draw the tile with built-in transparency
        ctx.drawImage(
            this.image,
            sourceCoords.x,
            sourceCoords.y,
            Tileset.TILE_SIZE,
            Tileset.TILE_SIZE,
            x,
            y,
            Tileset.TILE_SIZE,
            Tileset.TILE_SIZE
        );
    }

    public getTileCoordinatesForIndex(tileIndex: number): { x: number, y: number } {
        if (tileIndex < 0 || tileIndex >= Tileset.TILESET_WIDTH * Tileset.TILESET_HEIGHT) {
            throw new Error(`Tile index out of range: ${tileIndex}`);
        }

        // Determine which column the tile is in
        const column = Math.floor(tileIndex / (Tileset.TILESET_HEIGHT * Tileset.COLUMN_WIDTH));
        
        // Calculate the index within the column
        const indexInColumn = tileIndex % (Tileset.TILESET_HEIGHT * Tileset.COLUMN_WIDTH);
        
        // Calculate row within the column
        const rowInColumn = Math.floor(indexInColumn / Tileset.COLUMN_WIDTH);
        
        // Calculate column within the 32-tile wide sub-column
        const colInSubColumn = indexInColumn % Tileset.COLUMN_WIDTH;
        
        // Calculate the pixel coordinates
        const x = (column * Tileset.COLUMN_WIDTH + colInSubColumn) * Tileset.TILE_SIZE;
        const y = rowInColumn * Tileset.TILE_SIZE;
        
        return { x, y };
    }
    
    private getTileCoordinates(tileIndex: number): { x: number, y: number } {
        return this.getTileCoordinatesForIndex(tileIndex);
    }
    
    public getImage(): HTMLImageElement {
        return this.image;
    }

    public getTileSize(): number {
        return Tileset.TILE_SIZE;
    }
}