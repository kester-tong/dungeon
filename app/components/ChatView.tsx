'use client';
import styles from './ChatView.module.css';

import { useAppSelector } from '../store/hooks';
import { selectChatWindow } from '../store/selectors';
import { ContentBlock, ToolUseBlock } from '@/src/npcs/Anthropic';

function renderToolUseBlock(block: ToolUseBlock) {
  switch (block.name) {
    case 'open_door':
      return 'The gate swings open and you pass through';
  }
}

/**
 * Output of flattening blocks from all messages.
 *
 * For the purpose of display it's easier to flatten all blocks into a single array.
 * In order to display them we then need to also keep track of which role the block
 * belonged to.
 */
interface FlattenedBlock {
  role: 'user' | 'assistant';
  block: ContentBlock;
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
      // Currently only action is open_door whose result doesn't need displaying (always success)
      return null;
    default:
      return '[Unknown content block]';
  }
}

export default function ChatView() {
  const chatWindow = useAppSelector(selectChatWindow);
  if (chatWindow === null) {
    return null;
  }

  const flattenedBlocks: FlattenedBlock[] = chatWindow.messages.flatMap(
    ({ role, content }) => content.map((block) => ({ role, block }))
  );

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
        {flattenedBlocks.map(({ role, block }) =>
          renderContentBlocks(role, block)
        )}
        {chatWindow.currentMessage !== null && (
          <span className={styles['user-message']}>
            {'> ' + chatWindow.currentMessage + '█'}
          </span>
        )}
        {chatWindow.currentMessage === null &&
          chatWindow.animatingBeforeEndChat && (
            <span className={styles['action-pending']}>{'█'}</span>
          )}
        {chatWindow.currentMessage === null &&
          !chatWindow.animatingBeforeEndChat && (
            <span className={styles['blinking-cursor']}>{'█'}</span>
          )}
      </pre>
    </main>
  );
}
