'use client'

import { useEffect, useMemo } from 'react'
import { useTileset } from './components/TilesetProvider'
import { useGameAssets } from './components/GameAssetsProvider'
import { TestCanvas } from './components/TestCanvas'
import { TileRenderer, TileArray } from './components/TileRenderer'

export default function Home() {
  const { tileset, loaded } = useTileset()
  const { map, loaded: mapLoaded, error } = useGameAssets()

  // Convert map to TileArray format
  const tileArray: TileArray | null = useMemo(() => {
    if (!map) return null
    
    // Convert map data to 3D tile array format
    const tiles: number[][][] = map.data.map(row => 
      row.map(tile => [tile.tileIndex])
    )
    
    return { tiles }
  }, [map])

  useEffect(() => {
    console.log('Game page loaded - ready for game engine migration')
    console.log('Tileset loaded:', loaded)
    console.log('Map loaded:', mapLoaded)
    if (loaded && tileset) {
      console.log('Tileset ready for rendering')
    }
    if (mapLoaded && map) {
      console.log('Map dimensions:', map.width, 'x', map.height)
    }
    if (error) {
      console.error('Map loading error:', error)
    }
  }, [loaded, tileset, mapLoaded, map, error])

  return (
    <main style={{ padding: '1rem' }}>
      {loaded && tileset && mapLoaded && tileArray ? (
        <TileRenderer tileset={tileset} tileArray={tileArray} width={800} height={480} />
      ) : (
        <div style={{ 
          border: '2px solid #333', 
          width: '800px', 
          height: '480px', 
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'monospace'
        }}>
          <div>Loading...</div>
        </div>
      )}
    </main>
  )
}