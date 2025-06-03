import { TilesetConfig } from './TilesetConfig';

export class Tileset {
    private image: HTMLImageElement;
    private config: TilesetConfig;

    constructor(image: HTMLImageElement, config: TilesetConfig) {
        this.image = image;
        this.config = config;
    }

    public drawTile(ctx: CanvasRenderingContext2D, tileIndex: number, x: number, y: number): void {
        const sourceCoords = this.getTileCoordinates(tileIndex);
        
        // Draw the tile with built-in transparency
        ctx.drawImage(
            this.image,
            sourceCoords.x,
            sourceCoords.y,
            this.config.tileSize,
            this.config.tileSize,
            x,
            y,
            this.config.tileSize,
            this.config.tileSize
        );
    }

    public getTileCoordinatesForIndex(tileIndex: number): { x: number, y: number } {
        if (tileIndex < 0 || tileIndex >= this.config.width * this.config.height) {
            throw new Error(`Tile index out of range: ${tileIndex}`);
        }

        // Determine which column the tile is in
        const column = Math.floor(tileIndex / (this.config.height * this.config.columnWidth));
        
        // Calculate the index within the column
        const indexInColumn = tileIndex % (this.config.height * this.config.columnWidth);
        
        // Calculate row within the column
        const rowInColumn = Math.floor(indexInColumn / this.config.columnWidth);
        
        // Calculate column within the 32-tile wide sub-column
        const colInSubColumn = indexInColumn % this.config.columnWidth;
        
        // Calculate the pixel coordinates
        const x = (column * this.config.columnWidth + colInSubColumn) * this.config.tileSize;
        const y = rowInColumn * this.config.tileSize;
        
        return { x, y };
    }
    
    private getTileCoordinates(tileIndex: number): { x: number, y: number } {
        return this.getTileCoordinatesForIndex(tileIndex);
    }
    
    public getImage(): HTMLImageElement {
        return this.image;
    }

    public getTileSize(): number {
        return this.config.tileSize;
    }
}