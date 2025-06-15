/**
 * Game Configuration - Machine Readable Format
 * Processes JSON game data into format ready for game engine
 * Objects are loaded at build time from individual files in data/objects/
 */

import gameDataJsonRaw from './gameData.json';
import { GameConfigSchema, GameConfig } from './GameConfigSchema';

const gameDataJson = GameConfigSchema.parse(gameDataJsonRaw);

export const gameConfig: GameConfig = gameDataJson;
