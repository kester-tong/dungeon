import { GameState } from '@/src/state';
import { gameConfig } from '@/src/config/gameConfig';
import { Content } from '@google/genai';

function parseContent(content: Content): any[] {
  const entries: any[] = [];
  const parts = content.parts || [];
  for (const part of parts) {
    if (part.text) {
      entries.push({
        type: 'text',
        role: content.role as 'user' | 'model',
        content: part.text,
      });
    }
  }
  return entries;
}

export function handleMovement(
  state: GameState,
  direction: 'north' | 'south' | 'east' | 'west'
): GameState {
  if (state.chatWindow !== null) return state;

  const currentMap = gameConfig.maps[state.player.mapId];
  if (!currentMap) return state;

  let { x: newX, y: newY } = state.player;
  if (direction === 'north') newY--;
  if (direction === 'south') newY++;
  if (direction === 'west') newX--;
  if (direction === 'east') newX++;

  if (
    newX < 0 ||
    newX >= currentMap.width ||
    newY < 0 ||
    newY >= currentMap.height
  ) {
    const neighborMapId = currentMap.neighbors[direction];
    if (neighborMapId) {
      const neighborMap = gameConfig.maps[neighborMapId];
      let entryX = state.player.x,
        entryY = state.player.y;
      if (direction === 'north') entryY = neighborMap.height - 1;
      if (direction === 'south') entryY = 0;
      if (direction === 'west') entryX = neighborMap.width - 1;
      if (direction === 'east') entryX = 0;
      return { ...state, player: { x: entryX, y: entryY, mapId: neighborMapId } };
    }
    return { ...state, splashText: gameConfig.endOfMapText };
  }

  const targetTile = currentMap.data[newY][newX];
  if (targetTile.type === 'terrain') {
    return { ...state, player: { ...state.player, x: newX, y: newY } };
  }

  if (targetTile.type === 'npc') {
    const npc = gameConfig.npcs[targetTile.npcId];
    const contents: Content[] = npc.preseeded_message_history
      ? [...npc.preseeded_message_history]
      : [{ role: 'model', parts: [{ text: npc.first_message }] }];

    return {
      ...state,
      chatWindow: {
        intro_text: npc.intro_text,
        contents,
        chatHistory: contents.flatMap(parseContent),
        turnState: { type: 'user_turn', currentMessage: '' },
        npcId: targetTile.npcId,
      },
    };
  }

  return state;
}
