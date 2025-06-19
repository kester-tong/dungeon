#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { GameConfig, GameConfigSchema } from '../src/config/GameConfigSchema';

// Types for our build process
interface MapData {
  data: string[];
  tileMapping: Record<string, any>;
  neighbors: Record<string, string>;
  [key: string]: any;
}

interface NPCData {
  intro_text: string;
  first_message?: string;
  preseeded_message_history?: any[];
  prompt_chunks?: string[];
  tools?: string[];
  [key: string]: any;
}

interface GlobalConfig {
  tileset: any;
  startingPosition: any;
  canvas: any;
  sidepane: any;
  initialInventory: any;
  initialSplashText: string;
  endOfMapText: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

interface GameItem {
  id: string;
  name: string;
  description: string;
  type: string;
  tileIndex?: number;
}

function loadJsonFile<T = any>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, (error as Error).message);
  }
  return null;
}

function loadPromptChunks(chunksDir: string): Record<string, string> {
  const chunks: Record<string, string> = {};
  try {
    if (fs.existsSync(chunksDir)) {
      const files = fs.readdirSync(chunksDir);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const chunkName = path.basename(file, '.txt');
          const chunkPath = path.join(chunksDir, file);
          chunks[chunkName] = fs.readFileSync(chunkPath, 'utf8').trim();
        }
      }
    }
  } catch (error) {
    console.error(`Error loading prompt chunks:`, (error as Error).message);
  }
  return chunks;
}

function assemblePrompt(promptChunks: string[], chunks: Record<string, string>): string {
  return promptChunks.map(chunkName => {
    if (chunks[chunkName]) {
      return chunks[chunkName];
    } else {
      console.warn(`Warning: Prompt chunk '${chunkName}' not found`);
      return '';
    }
  }).join('\n\n');
}

function loadAllJsonFiles<T = any>(directory: string): Record<string, T> {
  const result: Record<string, T> = {};
  try {
    if (fs.existsSync(directory)) {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(directory, file);
          const data = loadJsonFile<T>(filePath);
          if (data) {
            const key = path.basename(file, '.json');
            
            // Load corresponding .txt file if it exists (for maps)
            const txtFile = path.join(directory, `${key}.txt`);
            if (fs.existsSync(txtFile)) {
              const mapData = fs.readFileSync(txtFile, 'utf8').split('\n');
              (data as any).data = mapData;
              console.log(`Loaded ${key} from ${file} with data from ${key}.txt`);
            } else {
              console.log(`Loaded ${key} from ${file}`);
            }
            
            result[key] = data;
          }
        }
      }
    } else {
      console.warn(`Directory not found: ${directory}`);
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, (error as Error).message);
  }
  return result;
}

function processMaps(jsonMaps: Record<string, MapData>): Record<string, any> {
  const processedMaps: Record<string, any> = {};

  for (const [mapId, mapConfig] of Object.entries(jsonMaps)) {
    const height = mapConfig.data.length;
    const width = mapConfig.data[0]?.length || 0;

    const processedData = mapConfig.data.map((row) =>
      row.split('').map((char) => {
        const tile = mapConfig.tileMapping[char];
        if (!tile) {
          throw new Error(`Unknown tile character: '${char}' in map ${mapId}`);
        }
        return tile;
      })
    );

    processedMaps[mapId] = {
      width,
      height,
      data: processedData,
      neighbors: mapConfig.neighbors,
    };
  }

  return processedMaps;
}

function validateGameData(gameData: any): GameConfig {
  try {
    return GameConfigSchema.parse(gameData);
  } catch (error) {
    console.error('❌ Game data validation failed:');
    console.error(error);
    throw new Error('Generated game data does not match expected schema');
  }
}

function assembleGameData(): GameConfig {
  const rootDir = path.resolve(__dirname, '..');
  const dataDir = path.join(rootDir, 'data');
  
  console.log('Loading global config...');
  const globalConfig = loadJsonFile<GlobalConfig>(path.join(dataDir, 'config', 'globalConfig.json'));
  
  console.log('Loading prompt chunks...');
  const promptChunks = loadPromptChunks(path.join(dataDir, 'prompt_chunks'));
  
  console.log('Loading tools...');
  const tools = loadAllJsonFiles<ToolDefinition>(path.join(dataDir, 'tools'));
  
  console.log('Loading maps...');
  const jsonMaps = loadAllJsonFiles<MapData>(path.join(dataDir, 'maps'));
  
  console.log('Loading NPCs...');
  const npcs = loadAllJsonFiles<NPCData>(path.join(dataDir, 'npcs'));
  
  console.log('Loading objects...');
  const objects = loadAllJsonFiles<GameItem>(path.join(dataDir, 'objects'));
  
  if (!globalConfig) {
    throw new Error('globalConfig.json is required but not found');
  }
  
  console.log('Processing maps...');
  const processedMaps = processMaps(jsonMaps);
  
  console.log('Assembling NPC prompts and tools...');
  const processedNpcs: Record<string, any> = {};
  for (const [npcId, npcData] of Object.entries(npcs)) {
    processedNpcs[npcId] = { ...npcData };
    
    if (npcData.prompt_chunks) {
      processedNpcs[npcId].prompt = assemblePrompt(npcData.prompt_chunks, promptChunks);
      delete processedNpcs[npcId].prompt_chunks;
      console.log(`Assembled prompt for ${npcId} from ${npcData.prompt_chunks.length} chunks`);
    }
    
    if (npcData.tools) {
      processedNpcs[npcId].functions = npcData.tools.map(toolName => {
        if (!tools[toolName]) {
          throw new Error(`Tool '${toolName}' referenced by NPC '${npcId}' not found in tools directory`);
        }
        return tools[toolName];
      });
      delete processedNpcs[npcId].tools;
      console.log(`Assembled ${npcData.tools.length} tools for ${npcId}`);
    }
  }
  
  const gameData = {
    ...globalConfig,
    objects: objects,
    maps: processedMaps,
    npcs: processedNpcs
  };
  
  console.log(`\nAssembled game data:`);
  console.log(`- Global config loaded: ${globalConfig ? 'Yes' : 'No'}`);
  console.log(`- Prompt chunks loaded: ${Object.keys(promptChunks).length}`);
  console.log(`- Tools loaded: ${Object.keys(tools).length}`);
  console.log(`- Objects loaded: ${Object.keys(objects).length}`);
  console.log(`- Maps loaded: ${Object.keys(jsonMaps).length}`);
  console.log(`- Maps processed: ${Object.keys(processedMaps).length}`);
  console.log(`- NPCs loaded: ${Object.keys(npcs).length}`);
  console.log(`- NPCs processed: ${Object.keys(processedNpcs).length}`);
  
  // Validate the assembled data matches our schema
  console.log('\nValidating game data against schema...');
  const validatedGameData = validateGameData(gameData);
  console.log('✅ Game data validation passed!');
  
  return validatedGameData;
}

function main(): void {
  try {
    console.log('=== Building Game Data ===\n');
    
    const gameData = assembleGameData();
    const outputPath = path.resolve(__dirname, '..', 'src', 'config', 'gameData.json');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(gameData, null, 2));
    
    console.log(`\n✅ Game data assembled successfully!`);
    console.log(`📁 Output: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error assembling game data:', (error as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { assembleGameData };