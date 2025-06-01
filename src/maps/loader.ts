import { Map } from './Map.js';

interface MapAsset {
    data: string[];
    tileMapping: { [key: string]: number };
}

export async function loadMap(path: string): Promise<Map> {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
        }
        
        const mapAsset: MapAsset = await response.json();
        
        // Convert string-based data to number-based data using the mapping from the file
        const data: number[][] = mapAsset.data.map(row => 
            Array.from(row).map(char => mapAsset.tileMapping[char] ?? 2)
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