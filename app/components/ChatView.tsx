'use client';
import styles from './ChatView.module.css';

import { useAppSelector } from '../store/hooks';
import { selectChatWindow } from '../store/selectors';
import { ContentBlock, ToolUseBlock } from '@/src/npcs/Anthropic';

function renderToolUseBlock(block: ToolUseBlock) {
  switch (block.name) {
    case 'open_door':
      return 'The gate swings open and you pass through [press any key to continue]';
  }
}

// Helper function to render content blocks
function renderContentBlocks(role: 'user' | 'assistant', block: ContentBlock) {
  // Handle content blocks array
  switch (block.type) {
    case 'text':
      return (
        <span
          className={
            role === 'user' ? styles['user-message'] : styles['npc-message']
          }
        >
          {'> ' + block.text + '\n\n'}
        </span>
      );
    case 'tool_use':
      return (
        <span className={styles.action}>
          {renderToolUseBlock(block) + '\n\n'}
        </span>
      );
    case 'tool_result':
      return `[Tool result: ${block.content}]`;
    default:
      return '[Unknown content block]';
  }
}

export default function ChatView() {
  const chatWindow = useAppSelector(selectChatWindow);
  if (chatWindow === null) {
    return null;
  }

  const lastMessage = chatWindow.messages.length > 0 ? chatWindow.messages[chatWindow.messages.length - 1] : null;

  const isWaitingForAI = lastMessage && lastMessage.role === 'user';
  const toolUseInProgress = lastMessage && lastMessage.role === 'assistant' && lastMessage.content.length > 0 && lastMessage.content[lastMessage.content.length - 1].type === 'tool_use';
  const isUserTurn = !isWaitingForAI && !toolUseInProgress;

  // TODO: use this when waiting to complete an action that doesn't
  // require user response.
  const isPausing = false;

  // Don't show user input prompt when pausing for tool use
  const showUserPrompt = isUserTurn && !isPausing;

  return (
    <main style={{ padding: '1rem' }}>
      <pre
        style={{
          width: '804px',
          height: '484px',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'monospace',
          border: '2px solid #333',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}
      >
        {chatWindow.intro_text}
        {'\n\nPress ESC to exit\n\n'}
        {chatWindow.messages.flatMap((message) =>
          message.content.map((block) =>
            renderContentBlocks(message.role, block)
          )
        )}
        {showUserPrompt && (
          <span className={styles['user-message']}>
            {'> ' + chatWindow.currentInput + '█'}
          </span>
        )}
        {isWaitingForAI && !isPausing && (
          <span className={styles['blinking-cursor']}>{'█'}</span>
        )}
        {isPausing && <span className={styles['action-pending']}>{'█'}</span>}
      </pre>
    </main>
  );
}
