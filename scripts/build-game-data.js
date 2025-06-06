#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function loadJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
  }
  return null;
}

function loadPromptChunks(chunksDir) {
  const chunks = {};
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
    console.error(`Error loading prompt chunks:`, error.message);
  }
  return chunks;
}

function assemblePrompt(promptChunks, chunks) {
  return promptChunks.map(chunkName => {
    if (chunks[chunkName]) {
      return chunks[chunkName];
    } else {
      console.warn(`Warning: Prompt chunk '${chunkName}' not found`);
      return '';
    }
  }).join('\n\n');
}

function loadAllJsonFiles(directory) {
  const result = {};
  try {
    if (fs.existsSync(directory)) {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(directory, file);
          const data = loadJsonFile(filePath);
          if (data) {
            const key = path.basename(file, '.json');
            
            // Load corresponding .txt file if it exists
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
    console.error(`Error reading directory ${directory}:`, error.message);
  }
  return result;
}

function processMaps(jsonMaps) {
  const processedMaps = {};

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

function assembleGameData() {
  const rootDir = path.resolve(__dirname, '..');
  const dataDir = path.join(rootDir, 'data');
  
  console.log('Loading global config...');
  const globalConfig = loadJsonFile(path.join(dataDir, 'config', 'globalConfig.json'));
  
  console.log('Loading prompt chunks...');
  const promptChunks = loadPromptChunks(path.join(dataDir, 'config', 'prompt_chunks'));
  
  console.log('Loading maps...');
  const jsonMaps = loadAllJsonFiles(path.join(dataDir, 'maps'));
  
  console.log('Loading NPCs...');
  const npcs = loadAllJsonFiles(path.join(dataDir, 'npcs'));
  
  if (!globalConfig) {
    throw new Error('globalConfig.json is required but not found');
  }
  
  console.log('Processing maps...');
  const processedMaps = processMaps(jsonMaps);
  
  console.log('Assembling NPC prompts...');
  const processedNpcs = {};
  for (const [npcId, npcData] of Object.entries(npcs)) {
    processedNpcs[npcId] = { ...npcData };
    if (npcData.prompt_chunks) {
      processedNpcs[npcId].prompt = assemblePrompt(npcData.prompt_chunks, promptChunks);
      delete processedNpcs[npcId].prompt_chunks;
      console.log(`Assembled prompt for ${npcId} from ${npcData.prompt_chunks.length} chunks`);
    }
  }
  
  const gameData = {
    ...globalConfig,
    maps: processedMaps,
    npcs: processedNpcs
  };
  
  console.log(`\nAssembled game data:`);
  console.log(`- Global config loaded: ${globalConfig ? 'Yes' : 'No'}`);
  console.log(`- Prompt chunks loaded: ${Object.keys(promptChunks).length}`);
  console.log(`- Maps loaded: ${Object.keys(jsonMaps).length}`);
  console.log(`- Maps processed: ${Object.keys(processedMaps).length}`);
  console.log(`- NPCs loaded: ${Object.keys(npcs).length}`);
  console.log(`- NPCs processed: ${Object.keys(processedNpcs).length}`);
  
  return gameData;
}

function main() {
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
    console.error('❌ Error assembling game data:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { assembleGameData };