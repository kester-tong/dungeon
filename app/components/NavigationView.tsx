'use client'

import { useMemo } from 'react'
import { useAppSelector } from '../store/hooks'
import { TileRenderer, TileArray } from './TileRenderer'

const CHARACTER_TILE_INDEX = 576; // 18 * 32

export default function NavigationView() {
  const gameState = useAppSelector(state => state.game)

  // Convert Redux state to TileArray format for rendering
  const tileArray: TileArray | null = useMemo(() => {
    if (!gameState.location || gameState.location.type !== 'navigating') {
      return null
    }
    
    const currentMap = gameState.config.maps[gameState.location.player.mapId]
    if (!currentMap) {
      return null
    }
    
    // Extract tile indices from map data
    const tiles: number[][][] = currentMap.data.map(row => 
      row.map(tile => [tile.tileIndex])
    )
    
    // Add character at player position
    const player = gameState.location.player
    tiles[player.y][player.x].push(CHARACTER_TILE_INDEX)
    
    return { tiles }
  }, [gameState.config.maps, gameState.location])

  if (gameState.location?.type !== 'navigating') {
    return null
  }

  return (
    <main style={{ padding: '1rem' }}>
      {tileArray && (
        <TileRenderer tileArray={tileArray} width={800} height={480} />
      )}
    </main>
  )
}