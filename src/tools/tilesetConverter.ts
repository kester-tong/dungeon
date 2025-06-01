/**
 * Tileset Converter
 * 
 * This tool converts a tileset BMP and its mask BMP into a single PNG with transparency.
 * The white pixels in the mask become transparent in the final PNG.
 */

class TilesetConverter {
    private tilesetCanvas: HTMLCanvasElement;
    private maskCanvas: HTMLCanvasElement;
    private outputCanvas: HTMLCanvasElement;
    private tileSize: number = 32;
    private tilesetWidth: number = 64;  // in tiles
    private tilesetHeight: number = 71; // in tiles
    
    constructor() {
        // Create canvases
        this.tilesetCanvas = document.createElement('canvas');
        this.maskCanvas = document.createElement('canvas');
        this.outputCanvas = document.createElement('canvas');
        
        // Set canvas dimensions
        const pixelWidth = this.tilesetWidth * this.tileSize;
        const pixelHeight = this.tilesetHeight * this.tileSize;
        
        this.tilesetCanvas.width = pixelWidth;
        this.tilesetCanvas.height = pixelHeight;
        this.maskCanvas.width = pixelWidth;
        this.maskCanvas.height = pixelHeight;
        this.outputCanvas.width = pixelWidth;
        this.outputCanvas.height = pixelHeight;
    }
    
    public async convertTileset(tilesetPath: string, maskPath: string): Promise<string> {
        try {
            // Load the images
            await Promise.all([
                this.loadImage(tilesetPath, this.tilesetCanvas),
                this.loadImage(maskPath, this.maskCanvas)
            ]);
            
            // Process the images
            this.processTileset();
            
            // Return the data URL of the output canvas
            return this.outputCanvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error converting tileset:', error);
            throw error;
        }
    }
    
    private async loadImage(src: string, canvas: HTMLCanvasElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                resolve();
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }
    
    private processTileset(): void {
        // Get contexts for canvas operations
        const tilesetCtx = this.tilesetCanvas.getContext('2d')!;
        const maskCtx = this.maskCanvas.getContext('2d')!;
        const outputCtx = this.outputCanvas.getContext('2d')!;
        
        // Get image data
        const tilesetData = tilesetCtx.getImageData(
            0, 0, this.tilesetCanvas.width, this.tilesetCanvas.height
        );
        const maskData = maskCtx.getImageData(
            0, 0, this.maskCanvas.width, this.maskCanvas.height
        );
        const outputData = outputCtx.createImageData(
            this.outputCanvas.width, this.outputCanvas.height
        );
        
        // Process each pixel
        for (let i = 0; i < tilesetData.data.length; i += 4) {
            // Copy RGB from tileset
            outputData.data[i] = tilesetData.data[i];       // R
            outputData.data[i + 1] = tilesetData.data[i + 1]; // G
            outputData.data[i + 2] = tilesetData.data[i + 2]; // B
            
            // Set alpha based on mask (white = transparent)
            if (maskData.data[i] > 200) { // If mask pixel is white (using red channel)
                outputData.data[i + 3] = 0; // Transparent
            } else {
                outputData.data[i + 3] = 255; // Fully opaque
            }
        }
        
        // Put the processed data back
        outputCtx.putImageData(outputData, 0, 0);
    }
    
    public downloadPNG(dataUrl: string, filename: string): void {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }
}

// Create a simple HTML interface to use this tool
function createInterface(): void {
    // Add HTML elements
    document.body.innerHTML = `
        <div style="max-width: 600px; margin: 20px auto; font-family: sans-serif;">
            <h1>Tileset Converter</h1>
            <p>Convert BMP tileset and mask to a single PNG with transparency.</p>
            
            <div style="margin: 20px 0;">
                <label>Tileset Image (BMP):
                    <input type="file" id="tilesetInput" accept=".bmp">
                </label>
            </div>
            
            <div style="margin: 20px 0;">
                <label>Mask Image (BMP):
                    <input type="file" id="maskInput" accept=".bmp">
                </label>
            </div>
            
            <button id="convertButton" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer;">
                Convert and Download
            </button>
            
            <div style="margin-top: 20px;">
                <h3>Preview:</h3>
                <div id="previewContainer" style="border: 1px solid #ccc; min-height: 200px; background: #f0f0f0; display: flex; justify-content: center; align-items: center;">
                    <p id="previewPlaceholder">Preview will appear here</p>
                    <img id="previewImage" style="display: none; max-width: 100%;">
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const converter = new TilesetConverter();
    let tilesetFile: File | null = null;
    let maskFile: File | null = null;
    
    document.getElementById('tilesetInput')!.addEventListener('change', (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            tilesetFile = files[0];
        }
    });
    
    document.getElementById('maskInput')!.addEventListener('change', (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            maskFile = files[0];
        }
    });
    
    document.getElementById('convertButton')!.addEventListener('click', async () => {
        if (!tilesetFile || !maskFile) {
            alert('Please select both a tileset and mask file.');
            return;
        }
        
        try {
            // Convert files to data URLs
            const tilesetUrl = await fileToDataUrl(tilesetFile);
            const maskUrl = await fileToDataUrl(maskFile);
            
            // Process the images
            const outputUrl = await converter.convertTileset(tilesetUrl, maskUrl);
            
            // Show preview
            const previewImage = document.getElementById('previewImage') as HTMLImageElement;
            previewImage.src = outputUrl;
            previewImage.style.display = 'block';
            document.getElementById('previewPlaceholder')!.style.display = 'none';
            
            // Download the result
            converter.downloadPNG(outputUrl, 'tileset_with_alpha.png');
        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Error converting tileset: ${error}`);
        }
    });
    
    function fileToDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Initialize the interface when the document is loaded
document.addEventListener('DOMContentLoaded', createInterface);