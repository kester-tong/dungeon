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
            result[key] = data;
            console.log(`Loaded ${key} from ${file}`);
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

function assembleGameData() {
  const rootDir = path.resolve(__dirname, '..');
  const dataDir = path.join(rootDir, 'data');
  
  console.log('Loading global config...');
  const globalConfig = loadJsonFile(path.join(dataDir, 'config', 'globalConfig.json'));
  
  console.log('Loading maps...');
  const maps = loadAllJsonFiles(path.join(dataDir, 'maps'));
  
  console.log('Loading NPCs...');
  const npcs = loadAllJsonFiles(path.join(dataDir, 'npcs'));
  
  if (!globalConfig) {
    throw new Error('globalConfig.json is required but not found');
  }
  
  const gameData = {
    ...globalConfig,
    maps,
    npcs
  };
  
  console.log(`\nAssembled game data:`);
  console.log(`- Global config loaded: ${globalConfig ? 'Yes' : 'No'}`);
  console.log(`- Maps loaded: ${Object.keys(maps).length}`);
  console.log(`- NPCs loaded: ${Object.keys(npcs).length}`);
  
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