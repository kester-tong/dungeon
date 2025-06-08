import { RootState } from './store';
import { ChatWindow } from './gameSlice';
import { ContentBlock, ToolUseBlock } from '@/src/npcs/Anthropic';
import { TileArray, TextSegment, View } from '../components/Renderer';
import { gameConfig } from '@/src/config/gameConfig';

// UI Color Constants
const UI_COLORS = {
  NARRATIVE_TEXT: '#ffaa00', // Brown/orange for game world descriptions, actions, and system text
  USER_INPUT: '#00ff00', // Green for user input text
  ASSISTANT_TEXT: '#87ceeb', // Light blue for assistant/NPC responses
  INSTRUCTION_TEXT: '#fff', // White for user instructions like "Press ESC"
  MUTED_TEXT: '#666', // Gray for empty states and borders
} as const;

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

  // Extract tile indices from map data and extend with sidepane
  const sidepaneWidth = gameConfig.sidepane.width;
  const tiles: number[][][] = currentMap.data.map(
    (row) =>
      row.map((tile) => [tile.tileIndex]).concat(Array(sidepaneWidth).fill([])) // Add empty arrays for sidepane
  );

  // Add character at player position
  const player = state.game.player;
  tiles[player.y][player.x].push(CHARACTER_TILE_INDEX);

  // Add inventory tiles (replace empty arrays with single tile)
  const inventoryDisplay = selectInventoryDisplay(state);
  for (const inventoryTile of inventoryDisplay.inventoryTiles) {
    if (inventoryTile.y < tiles.length && inventoryTile.x < tiles[0].length) {
      tiles[inventoryTile.y][inventoryTile.x] = [inventoryTile.tileIndex];
    }
  }

  return { tiles };
};

function renderToolUseBlockText(block: ToolUseBlock): TextSegment {
  switch (block.name) {
    case 'open_door':
      return {
        text: 'The gate swings open and you pass through\n\n',
        color: UI_COLORS.NARRATIVE_TEXT,
      };
    default:
      return { text: '', color: UI_COLORS.INSTRUCTION_TEXT };
  }
}

function renderContentBlockText(
  role: 'user' | 'assistant',
  block: ContentBlock
): TextSegment {
  switch (block.type) {
    case 'text':
      const color =
        role === 'user' ? UI_COLORS.USER_INPUT : UI_COLORS.ASSISTANT_TEXT;
      return { text: '> ' + block.text + '\n\n', color };
    case 'tool_use':
      return renderToolUseBlockText(block);
    case 'tool_result':
      // Currently only action is open_door whose result doesn't need displaying (always success)
      return { text: '', color: UI_COLORS.INSTRUCTION_TEXT };
    default:
      return {
        text: '[Unknown content block]',
        color: UI_COLORS.INSTRUCTION_TEXT,
      };
  }
}

/**
 * Selector to get the chat window content as TextSegment array for TextBox
 */
export const selectChatWindowText = (
  state: RootState
): TextSegment[] | null => {
  const chatWindow = state.game.chatWindow;
  if (chatWindow === null) {
    return null;
  }

  const segments: TextSegment[] = [];

  // Add intro text with brown description and white instruction
  segments.push(
    { text: chatWindow.intro_text, color: UI_COLORS.NARRATIVE_TEXT },
    { text: '\n\nPress ESC to exit\n\n', color: UI_COLORS.INSTRUCTION_TEXT }
  );

  // Flatten and render all message blocks
  const flattenedBlocks = chatWindow.messages.flatMap(({ role, content }) =>
    content.map((block) => ({ role, block }))
  );

  for (const { role, block } of flattenedBlocks) {
    const segment = renderContentBlockText(role, block);
    if (segment.text) {
      segments.push(segment);
    }
  }

  // Add current message with cursor
  if (chatWindow.currentMessage !== null) {
    segments.push({
      text: '> ' + chatWindow.currentMessage + '█',
      color: UI_COLORS.USER_INPUT,
    });
  } else if (chatWindow.animatingBeforeEndChat) {
    segments.push({ text: '█', color: UI_COLORS.NARRATIVE_TEXT });
  } else {
    segments.push({ text: '█', color: UI_COLORS.ASSISTANT_TEXT });
  }

  return segments;
};

/**
 * Selector to get inventory as separate text boxes and tiles for proper alignment
 */
export const selectInventoryDisplay = (state: RootState) => {
  const inventory = state.game.inventory;
  const textBoxes = [];
  const inventoryTiles = [];

  // Add inventory header text box
  textBoxes.push({
    text: [{ text: 'INVENTORY', color: UI_COLORS.NARRATIVE_TEXT }],
    startx: 25,
    starty: 0,
    endx: 33,
    endy: 1,
  });

  if (inventory.items.length === 0) {
    textBoxes.push({
      text: [{ text: 'Empty', color: UI_COLORS.MUTED_TEXT }],
      startx: 25,
      starty: 2,
      endx: 33,
      endy: 3,
    });
  } else {
    // Add each item as separate text box with corresponding tile
    for (let i = 0; i < inventory.items.length; i++) {
      const slot = inventory.items[i];
      const startY = 1 + i; // Start immediately after header (no gap)

      // Add item tile to the tile array at appropriate position
      if (slot.item.tileIndex) {
        inventoryTiles.push({
          x: 25,
          y: startY,
          tileIndex: slot.item.tileIndex,
        });
      }

      // Add item name text box (positioned next to tile)
      const quantityText = slot.quantity > 1 ? ` (${slot.quantity})` : '';
      textBoxes.push({
        text: [
          {
            text: slot.item.name + quantityText,
            color: UI_COLORS.INSTRUCTION_TEXT,
          },
        ],
        startx: 26,
        starty: startY,
        endx: 33,
        endy: startY + 1,
      });
    }
  }

  return { textBoxes, inventoryTiles };
};

/**
 * Selector to get the complete view including tiles and text overlays
 */
export const selectView = (state: RootState): View | null => {
  const tileArray = selectTileArray(state);
  const chatText = selectChatWindowText(state);
  const inventoryDisplay = selectInventoryDisplay(state);
  const splashText = state.game.splashText;

  if (!tileArray) {
    return null;
  }

  const textBoxes = [];

  // Add splash text if present
  if (splashText) {
    textBoxes.push({
      text: [
        { text: splashText, color: UI_COLORS.NARRATIVE_TEXT },
        {
          text: '\n\nPress ESC to continue...',
          color: UI_COLORS.INSTRUCTION_TEXT,
        },
      ],
      startx: 2,
      starty: 2,
      endx: 23,
      endy: 13,
      borderColor: UI_COLORS.MUTED_TEXT,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    });
  }

  // Add chat text box if there's chat content
  if (chatText) {
    textBoxes.push({
      text: chatText,
      startx: 2,
      starty: 2,
      endx: 23,
      endy: 13,
      borderColor: '#666',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    });
  }

  // Add inventory text boxes
  textBoxes.push(...inventoryDisplay.textBoxes);

  return {
    tileArray,
    textBoxes,
  };
};
