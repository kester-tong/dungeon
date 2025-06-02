'use client'

import { useEffect, useMemo } from 'react'
import { useTileset } from './components/TilesetProvider'
import { useGameAssets } from './components/GameAssetsProvider'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { loadMap, movePlayer, exitChat, addChatInput, deleteChatInput, submitChatInput } from './store/gameSlice'
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

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event
      
      // Handle ESC key to exit chat
      if (key === 'Escape' && gameState.location?.type === 'in_chat') {
        dispatch(exitChat())
        return
      }
      
      // If we're in chat, handle text input
      if (gameState.location?.type === 'in_chat') {
        if (key === 'Enter') {
          dispatch(submitChatInput())
        } else if (key === 'Backspace') {
          dispatch(deleteChatInput())
        } else if (key.length === 1) {
          dispatch(addChatInput(key))
        }
        return
      }
      
      // Handle movement keys when navigating
      if (gameState.location?.type === 'navigating') {
        let dx = 0
        let dy = 0
        
        switch (key) {
          case 'ArrowLeft':
          case 'a':
            dx = -1
            break
          case 'ArrowRight':
          case 'd':
            dx = 1
            break
          case 'ArrowUp':
          case 'w':
            dy = -1
            break
          case 'ArrowDown':
          case 's':
            dy = 1
            break
          default:
            return
        }
        
        dispatch(movePlayer({ dx, dy }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState.location, dispatch])

  // Render chat window if in chat mode
  if (gameState.location?.type === 'in_chat') {
    return (
      <main style={{ padding: '1rem' }}>
        <div style={{
          width: '800px',
          height: '480px',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'monospace',
          padding: '20px',
          border: '2px solid #333',
          overflow: 'auto'
        }}>
          {gameState.location.messages.map((message, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              {message}
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '10px' }}>Press ESC to exit</div>
            <div style={{ color: '#ccc' }}>
              {'> ' + gameState.location.currentInput}
            </div>
          </div>
        </div>
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