'use client'

import { useEffect, useMemo } from 'react'
import { useTileset } from './components/TilesetProvider'
import { useGameAssets } from './components/GameAssetsProvider'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { loadMap, handleKeyPress } from './store/gameSlice'
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

  // Handle keyboard input - use thunk for async chat handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      dispatch(handleKeyPress(event.key))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])

  // Render chat window if in chat mode
  if (gameState.location?.type === 'in_chat') {
    const chatContent = gameState.location.intro_text + '\n\nPress ESC to exit\n\n' +
      gameState.location.messages.map(message => 
        (message.role === 'user' ? '> ' : '') + message.content
      ).join('\n\n') + 
      (gameState.chatLoading ? '' : '\n\n> ' + gameState.location.currentInput + '█')

    return (
      <main style={{ padding: '1rem' }}>
        <style jsx>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          .blinking-cursor {
            animation: blink 1s infinite;
          }
        `}</style>
        <pre style={{
          width: '804px',
          height: '484px',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'monospace',
          border: '2px solid #333',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}>
          {chatContent}
          {gameState.chatLoading && (
            <span className="blinking-cursor">{'\n\n█'}</span>
          )}
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