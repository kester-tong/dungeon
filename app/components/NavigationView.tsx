'use client'

import { useMemo } from 'react'
import { useAppSelector } from '../store/hooks'
import { TileRenderer, TileArray } from './TileRenderer'
import { gameConfig } from '@/src/config/gameConfig'

const CHARACTER_TILE_INDEX = 576; // 18 * 32

export default function NavigationView() {
  const gameState = useAppSelector(state => state.game)

  // Convert Redux state to TileArray format for rendering
  const tileArray: TileArray | null = useMemo(() => {
    if (gameState.chatWindow !== null) {
      return null
    }
    
    const currentMap = gameConfig.maps[gameState.player.mapId]
    if (!currentMap) {
      return null
    }
    
    // Extract tile indices from map data
    const tiles: number[][][] = currentMap.data.map(row => 
      row.map(tile => [tile.tileIndex])
    )
    
    // Add character at player position
    const player = gameState.player
    tiles[player.y][player.x].push(CHARACTER_TILE_INDEX)
    
    return { tiles }
  }, [gameState.player, gameState.chatWindow])

  if (gameState.chatWindow !== null) {
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