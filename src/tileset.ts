export class Tileset {
    private image: HTMLImageElement;
    private tileSize: number;
    private tilesetWidth: number;
    private tilesetHeight: number;
    private columnWidth: number;

    constructor(image: HTMLImageElement, tileSize: number, tilesetWidth: number, tilesetHeight: number, columnWidth: number) {
        this.image = image;
        this.tileSize = tileSize;
        this.tilesetWidth = tilesetWidth;
        this.tilesetHeight = tilesetHeight;
        this.columnWidth = columnWidth;
    }

    public drawTile(ctx: CanvasRenderingContext2D, tileIndex: number, x: number, y: number): void {
        const sourceCoords = this.getTileCoordinates(tileIndex);
        
        // Draw the tile with built-in transparency
        ctx.drawImage(
            this.image,
            sourceCoords.x,
            sourceCoords.y,
            this.tileSize,
            this.tileSize,
            x,
            y,
            this.tileSize,
            this.tileSize
        );
    }

    public getTileCoordinatesForIndex(tileIndex: number): { x: number, y: number } {
        if (tileIndex < 0 || tileIndex >= this.tilesetWidth * this.tilesetHeight) {
            throw new Error(`Tile index out of range: ${tileIndex}`);
        }

        // Determine which column the tile is in
        const column = Math.floor(tileIndex / (this.tilesetHeight * this.columnWidth));
        
        // Calculate the index within the column
        const indexInColumn = tileIndex % (this.tilesetHeight * this.columnWidth);
        
        // Calculate row within the column
        const rowInColumn = Math.floor(indexInColumn / this.columnWidth);
        
        // Calculate column within the 32-tile wide sub-column
        const colInSubColumn = indexInColumn % this.columnWidth;
        
        // Calculate the pixel coordinates
        const x = (column * this.columnWidth + colInSubColumn) * this.tileSize;
        const y = rowInColumn * this.tileSize;
        
        return { x, y };
    }
    
    private getTileCoordinates(tileIndex: number): { x: number, y: number } {
        return this.getTileCoordinatesForIndex(tileIndex);
    }
    
    public getImage(): HTMLImageElement {
        return this.image;
    }

    public getTileSize(): number {
        return this.tileSize;
    }
}