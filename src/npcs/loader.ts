import { NPC } from './NPC.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Server-side NPC loader utility
 * Loads NPC configuration from JSON files in public/assets/npcs/
 */
export async function loadNPC(npcId: string): Promise<NPC> {
  const filePath = join(process.cwd(), 'public', 'assets', 'npcs', `${npcId}.json`);
  const fileContent = await readFile(filePath, 'utf-8');
  const npc: NPC = JSON.parse(fileContent);
  return npc;
}