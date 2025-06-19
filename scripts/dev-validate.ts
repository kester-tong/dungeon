#!/usr/bin/env ts-node

/**
 * Development validation script that can be run during development
 * to quickly check configuration integrity without full build
 */

import { validateConfig } from './validate-config';

function main(): void {
  console.log('🚀 Running development configuration validation...\n');
  
  const isValid = validateConfig();
  
  if (isValid) {
    console.log('\n✨ Configuration is ready for development!');
  } else {
    console.log('\n💥 Fix configuration issues before continuing development.');
  }
  
  process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
  main();
}