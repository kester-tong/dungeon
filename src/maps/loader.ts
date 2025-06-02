import { Map, Tile } from './Map.js';

interface MapAsset {
    data: string[];
    tileMapping: { [key: string]: Tile };
}

export async function loadMap(path: string): Promise<Map> {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
        }
        
        const mapAsset: MapAsset = await response.json();
        
        // Default tile for unmapped characters
        const defaultTile: Tile = { tileIndex: 2, type: "terrain" };
        
        // Convert string-based data to Tile objects using the mapping from the file
        const data: Tile[][] = mapAsset.data.map(row => 
            Array.from(row).map(char => {
                const tileDef = mapAsset.tileMapping[char];
                return tileDef || defaultTile;
            })
        );
        
        const height = data.length;
        const width = height > 0 ? data[0].length : 0;
        
        return {
            data,
            width,
            height
        };
    } catch (error) {
        console.error('Error loading map:', error);
        throw error;
    }
}