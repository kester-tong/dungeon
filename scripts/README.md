# Build Scripts

This directory contains TypeScript build scripts for generating and validating game configuration data.

## Overview

The build system uses TypeScript with ts-node for type-safe configuration processing. All scripts are fully typed and validate data at compile-time and runtime.

## Scripts

### `build-game-data.ts`
Main build script that assembles the final game configuration from source data.

**What it does:**
- Loads JSON configuration files from `data/` directory
- Processes map data from text files with tile mapping
- Assembles NPC prompts from modular chunks
- Combines tool definitions with NPCs
- Validates output against Zod schema
- Generates `src/config/gameData.json`

**Usage:**
```bash
npm run build-data
```

### `validate-config.ts`
Comprehensive validation script for game configuration integrity.

**Validations performed:**
- ✅ Schema compliance (Zod validation)
- 🏠 Starting position validity
- 🗺️ Map reference integrity (NPCs, neighbors)
- 🔗 Map connectivity analysis
- 🎒 Inventory object references
- 🤖 NPC tool definitions

**Usage:**
```bash
npm run validate-config
```

### `dev-validate.ts`
Quick validation script for development workflow.

**Usage:**
```bash
npm run dev-validate
```

## Configuration

### `tsconfig.scripts.json`
TypeScript configuration specifically for build scripts:
- CommonJS modules for Node.js compatibility
- Strict type checking enabled
- Path resolution for project imports

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run build-data` | Build game data from source files |
| `npm run validate-config` | Validate existing configuration |
| `npm run dev-validate` | Quick development validation |
| `npm run prebuild` | Full build + validation (runs before Next.js build) |

## Type Safety Benefits

1. **Compile-time validation**: Catch configuration errors during build
2. **IntelliSense support**: Full autocomplete and error checking in VS Code
3. **Refactoring safety**: TypeScript ensures all references are updated
4. **Schema enforcement**: Runtime validation with Zod schemas
5. **Documentation**: Types serve as living documentation

## Error Handling

All scripts include comprehensive error handling:
- Clear error messages with context
- Non-zero exit codes for CI/CD integration
- Warnings for non-critical issues (e.g., unreachable maps)
- Graceful handling of missing files

## Development Workflow

1. **Make changes** to data files in `data/` directory
2. **Run validation** during development:
   ```bash
   npm run dev-validate
   ```
3. **Build and validate** before committing:
   ```bash
   npm run prebuild
   ```
4. **Automatic validation** runs before production builds

## Adding New Validations

To add new validation rules:

1. Add validation function to `validate-config.ts`
2. Call it from `validateConfig()` function
3. Follow existing patterns for error reporting
4. Update this README with new validation description