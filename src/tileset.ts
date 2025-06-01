export class Tileset {
    private image: HTMLImageElement;
    private maskImage: HTMLImageElement | null = null;
    private loadedMain: boolean = false;
    private loadedMask: boolean = false;

    private static readonly TILE_SIZE = 32;
    private static readonly TILESET_WIDTH = 64;
    private static readonly TILESET_HEIGHT = 71;
    private static readonly COLUMN_WIDTH = 32;
    private static readonly CHARACTER_TILE_INDEX = 18 * 32; // Character tile index

    constructor(imageUrl: string, maskUrl?: string) {
        // Load main tileset image
        this.image = new Image();
        this.image.src = imageUrl;
        this.image.onload = () => {
            console.log("Main tileset loaded:", imageUrl);
            this.loadedMain = true;
        };
        this.image.onerror = (err) => {
            console.error("Failed to load main tileset:", imageUrl, err);
        };

        // Load mask image if provided
        if (maskUrl) {
            this.maskImage = new Image();
            this.maskImage.src = maskUrl;
            this.maskImage.onload = () => {
                console.log("Mask image loaded:", maskUrl);
                this.loadedMask = true;
            };
            this.maskImage.onerror = (err) => {
                console.error("Failed to load mask image:", maskUrl, err);
            };
        }
    }

    public isLoaded(): boolean {
        // If mask is being used, both need to be loaded
        if (this.maskImage) {
            return this.loadedMain && this.loadedMask;
        }
        // Otherwise just check main image
        return this.loadedMain;
    }

    public drawTile(ctx: CanvasRenderingContext2D, tileIndex: number, x: number, y: number, useAlpha?: boolean): void {
        if (!this.loadedMain) return;

        const sourceCoords = this.getTileCoordinates(tileIndex);
        
        // Only use alpha mask for character tiles
        const applyAlpha = tileIndex === Tileset.CHARACTER_TILE_INDEX;

        if (applyAlpha && this.maskImage && this.loadedMask) {
            // Draw with alpha mask
            this.drawTileWithMask(ctx, sourceCoords, x, y);
        } else {
            // Draw normally without mask
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
    }

    private drawTileWithMask(ctx: CanvasRenderingContext2D, sourceCoords: { x: number, y: number }, x: number, y: number): void {
        if (!this.maskImage || !this.loadedMask) {
            // If mask isn't available, just draw the tile normally
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
            return;
        }
        
        // Create a temporary canvas for the masked character
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Tileset.TILE_SIZE;
        tempCanvas.height = Tileset.TILE_SIZE;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        // 1. Draw the character
        tempCtx.drawImage(
            this.image,
            sourceCoords.x,
            sourceCoords.y,
            Tileset.TILE_SIZE,
            Tileset.TILE_SIZE,
            0,
            0,
            Tileset.TILE_SIZE,
            Tileset.TILE_SIZE
        );
        
        // 2. Get the image data to apply the mask
        const imageData = tempCtx.getImageData(0, 0, Tileset.TILE_SIZE, Tileset.TILE_SIZE);
        
        // 3. Draw the mask to a separate canvas
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = Tileset.TILE_SIZE;
        maskCanvas.height = Tileset.TILE_SIZE;
        const maskCtx = maskCanvas.getContext('2d')!;
        
        maskCtx.drawImage(
            this.maskImage,
            sourceCoords.x,
            sourceCoords.y,
            Tileset.TILE_SIZE,
            Tileset.TILE_SIZE,
            0,
            0,
            Tileset.TILE_SIZE,
            Tileset.TILE_SIZE
        );
        
        const maskData = maskCtx.getImageData(0, 0, Tileset.TILE_SIZE, Tileset.TILE_SIZE);
        
        // 4. Apply the mask (white = transparent)
        for (let i = 0; i < imageData.data.length; i += 4) {
            // If mask pixel is white (or close to white), make transparent
            if (maskData.data[i] > 200) {  // Using 200 as threshold for "white"
                imageData.data[i + 3] = 0; // Set alpha to 0
            }
        }
        
        // 5. Put the modified data back
        tempCtx.putImageData(imageData, 0, 0);
        
        // 6. Draw the result to the main canvas
        ctx.drawImage(tempCanvas, 0, 0, Tileset.TILE_SIZE, Tileset.TILE_SIZE, x, y, Tileset.TILE_SIZE, Tileset.TILE_SIZE);
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
    
    public getMaskImage(): HTMLImageElement | null {
        return this.maskImage;
    }

    public getTileSize(): number {
        return Tileset.TILE_SIZE;
    }
}