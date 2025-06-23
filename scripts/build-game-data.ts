#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { GameConfig, GameConfigSchema, GameItemSchema, NPCSchema, MapSchema } from '../src/config/GameConfigSchema';

// Zod schemas for build-time validation
const MapDataSchema = z.object({
  data: z.array(z.string()),
  tileMapping: z.record(z.any()),
  neighbors: z.record(z.string()).default({}),
}).passthrough(); // Allow additional properties

const NPCDataSchema = z.object({
  intro_text: z.string(),
  first_message: z.string().optional(),
  preseeded_message_history: z.array(z.any()).optional(),
  prompt_chunks: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
}).passthrough(); // Allow additional properties

const BuildTimeGlobalConfigSchema = z.object({
  tileset: z.any(),
  startingPosition: z.any(),
  canvas: z.any(),
  sidepane: z.any(),
  initialInventory: z.any(),
  initialSplashText: z.string(),
  endOfMapText: z.string(),
}).passthrough(); // Allow additional properties

const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.any(),
}).passthrough(); // Allow additional properties

// Type aliases for convenience
type MapData = z.infer<typeof MapDataSchema>;
type NPCData = z.infer<typeof NPCDataSchema>;
type GlobalConfig = z.infer<typeof BuildTimeGlobalConfigSchema>;
type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
type GameItem = z.infer<typeof GameItemSchema>;

function loadJsonFile(filePath: string): any | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
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

function loadAllJsonFiles(directory: string): Record<string, any> {
  const result: Record<string, any> = {};
  try {
    if (fs.existsSync(directory)) {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(directory, file);
          const data = loadJsonFile(filePath);
          if (data) {
            const key = path.basename(file, '.json');
            
            // Load corresponding .txt file if it exists (for maps)
            const txtFile = path.join(directory, `${key}.txt`);
            if (fs.existsSync(txtFile)) {
              const mapData = fs.readFileSync(txtFile, 'utf8').split('\n');
              data.data = mapData;
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
  const globalConfigRaw = loadJsonFile(path.join(dataDir, 'config', 'globalConfig.json'));
  if (!globalConfigRaw) {
    throw new Error('globalConfig.json is required but not found');
  }
  const globalConfig = BuildTimeGlobalConfigSchema.parse(globalConfigRaw);
  
  console.log('Loading prompt chunks...');
  const promptChunks = loadPromptChunks(path.join(dataDir, 'prompt_chunks'));
  
  console.log('Loading tools...');
  const toolsRaw = loadAllJsonFiles(path.join(dataDir, 'tools'));
  const tools: Record<string, ToolDefinition> = {};
  for (const [key, value] of Object.entries(toolsRaw)) {
    try {
      tools[key] = ToolDefinitionSchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`Schema validation failed for tool ${key}:`);
        console.error(error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
      }
      throw error;
    }
  }
  
  console.log('Loading maps...');
  const mapsRaw = loadAllJsonFiles(path.join(dataDir, 'maps'));
  const jsonMaps: Record<string, MapData> = {};
  for (const [key, value] of Object.entries(mapsRaw)) {
    try {
      jsonMaps[key] = MapDataSchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`Schema validation failed for map ${key}:`);
        console.error(error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
      }
      throw error;
    }
  }
  
  console.log('Loading NPCs...');
  const npcsRaw = loadAllJsonFiles(path.join(dataDir, 'npcs'));
  const npcs: Record<string, NPCData> = {};
  for (const [key, value] of Object.entries(npcsRaw)) {
    try {
      npcs[key] = NPCDataSchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`Schema validation failed for NPC ${key}:`);
        console.error(error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
      }
      throw error;
    }
  }
  
  console.log('Loading objects...');
  const objectsRaw = loadAllJsonFiles(path.join(dataDir, 'objects'));
  const objects: Record<string, GameItem> = {};
  for (const [key, value] of Object.entries(objectsRaw)) {
    try {
      objects[key] = GameItemSchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`Schema validation failed for object ${key}:`);
        console.error(error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
      }
      throw error;
    }
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