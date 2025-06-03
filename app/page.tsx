'use client'

import { useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTileset } from './components/TilesetProvider'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { handleKeyPress } from './store/gameSlice'
import { selectIsWaitingForAI, selectIsUserTurn } from './store/selectors'
import { TileRenderer, TileArray } from './components/TileRenderer'

const CHARACTER_TILE_INDEX = 576; // 18 * 32

function GameContent() {
  const searchParams = useSearchParams()
  const accessKey = searchParams.get('access_key')
  const { tileset, loaded } = useTileset()
  const dispatch = useAppDispatch()
  const gameState = useAppSelector(state => state.game)
  const isWaitingForAI = useAppSelector(selectIsWaitingForAI)
  const isUserTurn = useAppSelector(selectIsUserTurn)

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

  // Handle keyboard input - use thunk for async chat handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      dispatch(handleKeyPress({ key: event.key, accessKey: accessKey || '' }))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, accessKey])

  // Check password protection
  if (!accessKey) {
    return (
      <main style={{ padding: '1rem' }}>
        <div style={{ 
          border: '2px solid #333', 
          width: '800px', 
          height: '480px', 
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'monospace',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>Access Key Required</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            Add ?access_key=YOUR_KEY to the URL
          </div>
        </div>
      </main>
    )
  }

  // Render chat window if in chat mode
  if (gameState.location?.type === 'in_chat') {
    const chatContent = gameState.location.intro_text + '\n\nPress ESC to exit\n\n' +
      gameState.location.messages.map(message => 
        (message.role === 'user' ? '> ' : '') + message.content
      ).join('\n\n') + 
      (isUserTurn ? '\n\n> ' + gameState.location.currentInput + '█' : '')

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
          {isWaitingForAI && (
            <span className="blinking-cursor">{'\n\n█'}</span>
          )}
        </pre>
      </main>
    )
  }

  return (
    <main style={{ padding: '1rem' }}>
      {loaded && tileset && tileArray ? (
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
      
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        fontSize: '12px',
        color: '#666'
      }}>
        Tiles (32x32 graphics) by David Gervais, used under{' '}
        <a 
          href="https://creativecommons.org/licenses/by/3.0/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#0066cc' }}
        >
          CC BY 3.0
        </a>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main style={{ padding: '1rem' }}>
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
      </main>
    }>
      <GameContent />
    </Suspense>
  )
}