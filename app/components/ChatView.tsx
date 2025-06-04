'use client'

import { useAppSelector } from '../store/hooks'
import { selectIsWaitingForAI, selectIsUserTurn } from '../store/selectors'

export default function ChatView() {
  const gameState = useAppSelector(state => state.game)
  const isWaitingForAI = useAppSelector(selectIsWaitingForAI)
  const isUserTurn = useAppSelector(selectIsUserTurn)

  if (gameState.location.type !== 'in_chat') {
    return null
  }

  const isPausing = gameState.location.pausingForToolUse
  
  // Don't show user input prompt when pausing for tool use
  const showUserPrompt = isUserTurn && !isPausing

  const chatContent = gameState.location.intro_text + '\n\nPress ESC to exit\n\n' +
    gameState.location.messages.map(message => 
      (message.role === 'user' ? '> ' : '') + message.content
    ).join('\n\n') + 
    (showUserPrompt ? '\n\n> ' + gameState.location.currentInput + '█' : '')

  return (
    <main style={{ padding: '1rem' }}>
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .blinking-cursor {
          animation: blink 1s infinite;
        }
        .action-pending {
          animation: pulse 1.5s infinite;
          color: #ffaa00;
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
        {isWaitingForAI && !isPausing && (
          <span className="blinking-cursor">{'\n\n█'}</span>
        )}
        {isPausing && (
          <span className="action-pending">{'\n\n⌛'}</span>
        )}
      </pre>
    </main>
  )
}