import { RootState } from './store';
import { ChatWindow } from './gameSlice';
import { ContentBlock, ToolUseBlock } from '@/src/npcs/Anthropic';
import { TileArray } from '../components/Renderer';
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

function renderToolUseBlockText(block: ToolUseBlock): string {
  switch (block.name) {
    case 'open_door':
      return 'The gate swings open and you pass through';
    default:
      return '';
  }
}

function renderContentBlockText(role: 'user' | 'assistant', block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return '> ' + block.text + '\n\n';
    case 'tool_use':
      return renderToolUseBlockText(block) + '\n\n';
    case 'tool_result':
      // Currently only action is open_door whose result doesn't need displaying (always success)
      return '';
    default:
      return '[Unknown content block]';
  }
}

/**
 * Selector to get the chat window content as text representation for TextBox
 */
export const selectChatWindowText = (state: RootState): string | null => {
  const chatWindow = state.game.chatWindow;
  if (chatWindow === null) {
    return null;
  }

  let text = chatWindow.intro_text + '\n\nPress ESC to exit\n\n';

  // Flatten and render all message blocks
  const flattenedBlocks = chatWindow.messages.flatMap(
    ({ role, content }) => content.map((block) => ({ role, block }))
  );

  for (const { role, block } of flattenedBlocks) {
    text += renderContentBlockText(role, block);
  }

  // Add current message with cursor
  if (chatWindow.currentMessage !== null) {
    text += '> ' + chatWindow.currentMessage + '█';
  } else if (chatWindow.animatingBeforeEndChat) {
    text += '█';
  } else {
    text += '█';
  }

  return text;
};
