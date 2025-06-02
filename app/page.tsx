'use client'

import { useEffect, useMemo } from 'react'
import { useTileset } from './components/TilesetProvider'
import { useGameAssets } from './components/GameAssetsProvider'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { loadMap, keyDown } from './store/gameSlice'
import { TileRenderer, TileArray } from './components/TileRenderer'

const CHARACTER_TILE_INDEX = 576; // 18 * 32

export default function Home() {
  const { tileset, loaded } = useTileset()
  const { map, loaded: mapLoaded, error } = useGameAssets()
  const dispatch = useAppDispatch()
  const gameState = useAppSelector(state => state.game)

  // Load map into Redux when assets are ready
  useEffect(() => {
    if (mapLoaded && map && !gameState.map) {
      dispatch(loadMap(map))
    }
  }, [mapLoaded, map, gameState.map, dispatch])

  // Convert Redux state to TileArray format for rendering
  const tileArray: TileArray | null = useMemo(() => {
    if (!gameState.map || !gameState.location || gameState.location.type !== 'navigating') {
      return null
    }
    
    // Extract tile indices from map data
    const tiles: number[][][] = gameState.map.data.map(row => 
      row.map(tile => [tile.tileIndex])
    )
    
    // Add character at player position
    const player = gameState.location.player
    tiles[player.y][player.x].push(CHARACTER_TILE_INDEX)
    
    return { tiles }
  }, [gameState.map, gameState.location])

  // Handle keyboard input - just dispatch the key, let reducer handle state logic
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      dispatch(keyDown(event.key))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])

  // Render chat window if in chat mode
  if (gameState.location?.type === 'in_chat') {
    return (
      <main style={{ padding: '1rem' }}>
        <pre style={{
          width: '804px',
          height: '484px',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'monospace',
          //padding: '20px',
          border: '2px solid #333',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}>
          {gameState.location.messages.map((message, index) => 
          <>
            {message + "\n\n"}
            {index === 0 ? "Press ESC to exit\n\n" : null}
            </>
          )}
          {'> ' + gameState.location.currentInput}
        </pre>
      </main>
    )
  }

  return (
    <main style={{ padding: '1rem' }}>
      {loaded && tileset && gameState.assetsLoaded && tileArray ? (
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