#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { GameConfig, GameConfigSchema } from '../src/config/GameConfigSchema';

function loadGameConfig(): GameConfig | null {
  try {
    const configPath = path.resolve(__dirname, '..', 'src', 'config', 'gameData.json');
    if (!fs.existsSync(configPath)) {
      console.error('❌ gameData.json not found. Run `npm run build-data` first.');
      return null;
    }
    
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return GameConfigSchema.parse(configData);
  } catch (error) {
    console.error('❌ Error loading or parsing game config:', (error as Error).message);
    return null;
  }
}

function validateMapReferences(config: GameConfig): boolean {
  let isValid = true;
  
  console.log('🗺️  Validating map references...');
  
  // Check for orphaned NPC references in maps
  for (const [mapId, map] of Object.entries(config.maps)) {
    for (const [y, row] of map.data.entries()) {
      for (const [x, tile] of row.entries()) {
        if (tile.type === 'npc' && !config.npcs[tile.npcId]) {
          console.error(`❌ Map ${mapId} at (${x}, ${y}) references undefined NPC: ${tile.npcId}`);
          isValid = false;
        }
      }
    }
  }
  
  // Check for orphaned neighbor references
  for (const [mapId, map] of Object.entries(config.maps)) {
    for (const [direction, neighborId] of Object.entries(map.neighbors)) {
      if (neighborId && !config.maps[neighborId]) {
        console.error(`❌ Map ${mapId} references undefined neighbor ${direction}: ${neighborId}`);
        isValid = false;
      }
    }
  }
  
  return isValid;
}

function validateInventoryReferences(config: GameConfig): boolean {
  let isValid = true;
  
  console.log('🎒 Validating inventory references...');
  
  // Check initial inventory references
  for (const slot of config.initialInventory.items) {
    if (!config.objects[slot.objectId]) {
      console.error(`❌ Initial inventory references undefined object: ${slot.objectId}`);
      isValid = false;
    }
  }
  
  return isValid;
}

function validateMapConnectivity(config: GameConfig): boolean {
  console.log('🔗 Validating map connectivity...');
  
  const startingMapId = config.startingPosition.mapId;
  if (!config.maps[startingMapId]) {
    console.error(`❌ Starting position references undefined map: ${startingMapId}`);
    return false;
  }
  
  // Find all reachable maps using BFS
  const reachableMaps = new Set<string>([startingMapId]);
  const queue = [startingMapId];
  
  while (queue.length > 0) {
    const mapId = queue.shift()!;
    const map = config.maps[mapId];
    
    for (const neighborId of Object.values(map.neighbors)) {
      if (neighborId && !reachableMaps.has(neighborId)) {
        reachableMaps.add(neighborId);
        queue.push(neighborId);
      }
    }
  }
  
  // Check for unreachable maps
  const allMaps = Object.keys(config.maps);
  const unreachableMaps = allMaps.filter(id => !reachableMaps.has(id));
  
  if (unreachableMaps.length > 0) {
    console.warn(`⚠️  Found ${unreachableMaps.length} unreachable maps: ${unreachableMaps.join(', ')}`);
    // This is a warning, not an error
  }
  
  console.log(`✅ Map connectivity: ${reachableMaps.size}/${allMaps.length} maps reachable`);
  return true;
}

function validateNPCToolReferences(config: GameConfig): boolean {
  let isValid = true;
  
  console.log('🤖 Validating NPC tool references...');
  
  for (const [npcId, npc] of Object.entries(config.npcs)) {
    if (npc.functions) {
      for (const func of npc.functions) {
        if (!func.name) {
          console.error(`❌ NPC ${npcId} has a function without a name`);
          isValid = false;
        }
        if (!func.parameters) {
          console.warn(`⚠️  NPC ${npcId} function ${func.name} has no parameters defined`);
        }
      }
    }
  }
  
  return isValid;
}

function validateStartingPosition(config: GameConfig): boolean {
  console.log('🏠 Validating starting position...');
  
  const { mapId, x, y } = config.startingPosition;
  const map = config.maps[mapId];
  
  if (!map) {
    console.error(`❌ Starting position references undefined map: ${mapId}`);
    return false;
  }
  
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
    console.error(`❌ Starting position (${x}, ${y}) is outside map bounds (${map.width}x${map.height})`);
    return false;
  }
  
  const startingTile = map.data[y][x];
  if (startingTile.type !== 'terrain') {
    console.error(`❌ Starting position (${x}, ${y}) is not on a walkable terrain tile (found: ${startingTile.type})`);
    return false;
  }
  
  console.log(`✅ Starting position is valid: ${mapId} (${x}, ${y})`);
  return true;
}

function validateConfig(): boolean {
  console.log('=== Game Configuration Validation ===\n');
  
  const config = loadGameConfig();
  if (!config) {
    return false;
  }
  
  console.log('✅ Game configuration schema validation passed\n');
  
  let allValidationsPass = true;
  
  // Run all validation checks
  allValidationsPass = validateStartingPosition(config) && allValidationsPass;
  allValidationsPass = validateMapReferences(config) && allValidationsPass;
  allValidationsPass = validateMapConnectivity(config) && allValidationsPass;
  allValidationsPass = validateInventoryReferences(config) && allValidationsPass;
  allValidationsPass = validateNPCToolReferences(config) && allValidationsPass;
  
  console.log('\n' + '='.repeat(50));
  
  if (allValidationsPass) {
    console.log('✅ All configuration validations passed!');
    
    // Print summary statistics
    console.log('\n📊 Configuration Summary:');
    console.log(`   Maps: ${Object.keys(config.maps).length}`);
    console.log(`   NPCs: ${Object.keys(config.npcs).length}`);
    console.log(`   Objects: ${Object.keys(config.objects).length}`);
    console.log(`   Starting Map: ${config.startingPosition.mapId}`);
    console.log(`   Canvas Size: ${config.canvas.width}x${config.canvas.height}`);
    
    return true;
  } else {
    console.log('❌ Configuration validation failed!');
    return false;
  }
}

function main(): void {
  const isValid = validateConfig();
  process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { validateConfig };