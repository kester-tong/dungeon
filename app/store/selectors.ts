import { RootState } from './store';
import { ChatWindow } from './gameSlice';
import { ContentBlock, ToolUseBlock } from '@/src/npcs/Anthropic';
import { TileArray, TextSegment } from '../components/Renderer';
import { gameConfig } from '@/src/config/gameConfig';

const CHARACTER_TILE_INDEX = 576; // 18 * 32

/**
 * Selector to get the current chat window if in chat
 */
export const selectChatWindow = (state: RootState): ChatWindow | null => {
  return state.game.chatWindow;
};

/**
 * Selector to get the current tile array for rendering
 */
export const selectTileArray = (state: RootState): TileArray | null => {
  const currentMap = gameConfig.maps[state.game.player.mapId];
  if (!currentMap) {
    return null;
  }

  // Extract tile indices from map data
  const tiles: number[][][] = currentMap.data.map((row) =>
    row.map((tile) => [tile.tileIndex])
  );

  // Add character at player position
  const player = state.game.player;
  tiles[player.y][player.x].push(CHARACTER_TILE_INDEX);

  return { tiles };
};

function renderToolUseBlockText(block: ToolUseBlock): TextSegment {
  switch (block.name) {
    case 'open_door':
      return { text: 'The gate swings open and you pass through\n\n', color: '#ffaa00' };
    default:
      return { text: '', color: '#fff' };
  }
}

function renderContentBlockText(role: 'user' | 'assistant', block: ContentBlock): TextSegment {
  switch (block.type) {
    case 'text':
      const color = role === 'user' ? '#00ff00' : '#87ceeb';
      return { text: '> ' + block.text + '\n\n', color };
    case 'tool_use':
      return renderToolUseBlockText(block);
    case 'tool_result':
      // Currently only action is open_door whose result doesn't need displaying (always success)
      return { text: '', color: '#fff' };
    default:
      return { text: '[Unknown content block]', color: '#fff' };
  }
}

/**
 * Selector to get the chat window content as TextSegment array for TextBox
 */
export const selectChatWindowText = (state: RootState): TextSegment[] | null => {
  const chatWindow = state.game.chatWindow;
  if (chatWindow === null) {
    return null;
  }

  const segments: TextSegment[] = [];

  // Add intro text
  segments.push({ text: chatWindow.intro_text + '\n\nPress ESC to exit\n\n', color: '#87ceeb' });

  // Flatten and render all message blocks
  const flattenedBlocks = chatWindow.messages.flatMap(
    ({ role, content }) => content.map((block) => ({ role, block }))
  );

  for (const { role, block } of flattenedBlocks) {
    const segment = renderContentBlockText(role, block);
    if (segment.text) {
      segments.push(segment);
    }
  }

  // Add current message with cursor
  if (chatWindow.currentMessage !== null) {
    segments.push({ text: '> ' + chatWindow.currentMessage + '█', color: '#00ff00' });
  } else if (chatWindow.animatingBeforeEndChat) {
    segments.push({ text: '█', color: '#ffaa00' });
  } else {
    segments.push({ text: '█', color: '#87ceeb' });
  }

  return segments;
};
