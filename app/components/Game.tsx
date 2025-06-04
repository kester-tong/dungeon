'use client'

import { useMemo, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { handleKeyPress } from '../store/gameSlice'
import { selectIsWaitingForAI, selectIsUserTurn } from '../store/selectors'
import { TileRenderer, TileArray } from './TileRenderer'
import InputController from './InputController'

const CHARACTER_TILE_INDEX = 576; // 18 * 32

export default function Game() {
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

  // Handle keyboard input via InputController
  const onKeyDown = useCallback((key: string) => {
    dispatch(handleKeyPress({ key }))
  }, [dispatch])

  // Render chat window if in chat mode
  if (gameState.location?.type === 'in_chat') {
    const chatContent = gameState.location.intro_text + '\n\nPress ESC to exit\n\n' +
      gameState.location.messages.map(message => 
        (message.role === 'user' ? '> ' : '') + message.content
      ).join('\n\n') + 
      (isUserTurn ? '\n\n> ' + gameState.location.currentInput + '█' : '')

    return (
      <>
        <InputController onKeyDown={onKeyDown} />
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
      </>
    )
  }

  return (
    <>
      <InputController onKeyDown={onKeyDown} />
      <main style={{ padding: '1rem' }}>
        {tileArray && (
          <TileRenderer tileArray={tileArray} width={800} height={480} />
        )}
      </main>
    </>
  )
}