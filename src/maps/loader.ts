import { Map } from './Map.js';

interface MapAsset {
    data: string[];
}

const CHAR_TO_TILE_MAP: { [key: string]: number } = {
    ' ': 2,   // ground (TILE.GROUND)
    'w': 21,  // wall (TILE.WALL)
};

export async function loadMap(path: string): Promise<Map> {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
        }
        
        const mapAsset: MapAsset = await response.json();
        
        // Convert string-based data to number-based data
        const data: number[][] = mapAsset.data.map(row => 
            Array.from(row).map(char => CHAR_TO_TILE_MAP[char] ?? 2)
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