# Product Requirements: Pages of Thought

## 1. Overview

**Pages of Thought** is a top-down, 2D open-world RPG that uses Large Language Models (LLMs) to power its non-player characters (NPCs). The game is built for players who enjoy exploration, emergent storytelling, and dynamic interactions. This document outlines the game's core concept, architecture, and future direction.

## 2. Core Concept

### 2.1. Gameplay

Players explore a persistent world, interacting with NPCs through natural language. The narrative is not pre-scripted but emerges from the player's choices and the NPCs' responses. The core gameplay loop consists of exploration, dialogue, and questing.

### 2.2. Key Features

*   **LLM-Powered NPCs**: Every NPC has a unique personality, background, and goals, driven by a dedicated LLM.
*   **Dynamic World**: The game world evolves based on player actions and NPC interactions.
*   **Emergent Narrative**: The story unfolds organically based on player choices.
*   **Moddable Content**: The game is designed for easy extension, supporting custom maps, items, and characters.

## 3. Architecture and Project Structure

Pages of Thought is a Next.js application with a React frontend and a Node.js backend. It uses Redux for state management and an HTML5 Canvas for rendering.

```
/Users/kestertong/dungeon/
├───app/                     # Frontend application
│   ├───layout.tsx           # Root layout, sets up providers
│   ├───page.tsx             # Main game page
│   ├───api/chat/            # Backend API for LLM chat
│   │   ├───route.ts         # API endpoint for handling chat
│   │   └───types.ts         # TypeScript types for the chat API
│   ├───components/          # React components
│   │   ├───Game.tsx         # Main game component
│   │   ├───InputController.tsx # Handles all keyboard input
│   │   ├───Renderer.tsx     # Renders the game world to the canvas
│   │   └───TilesetProvider.tsx # Provides the tileset to all components
│   └───store/               # Redux state management
│       ├───gameSlice.ts     # Core game state and reducers
│       ├───thunks.ts        # Asynchronous actions (e.g., key handling)
│       └───store.ts         # Redux store configuration
├───data/                    # Raw game data (maps, NPCs, etc.)
│   ├───config/globalConfig.json # Global game settings
│   ├───maps/                # Map data and layouts
│   ├───npcs/                # NPC definitions and prompts
│   ├───objects/             # Item definitions
│   ├───prompt_chunks/       # Reusable text for NPC prompts
│   └───tools/               # NPC tool definitions
├───public/                  # Static assets
│   └───assets/images/tileset.png # Game tileset
├───scripts/                 # Build-time scripts
│   ├───build-game-data.ts   # Assembles game data into a single file
│   └───validate-config.ts   # Validates the assembled game data
└───src/                     # Core game logic and data structures
    ├───actions/NpcAction.ts # Defines NPC actions
    ├───config/              # Game configuration schemas and data
    │   ├───gameConfig.ts    # Loads and exports the game data
    │   └───GameConfigSchema.ts # Zod schema for game data validation
    ├───items/GameItem.ts    # Item and inventory data structures
    ├───maps/Map.ts          # Map and tile data structures
    ├───npcs/NPC.ts          # NPC data structure
    └───tileset/Tileset.ts   # Tileset class for drawing tiles
```

### 3.1. State Management (`app/store`)

The game's state is managed by Redux Toolkit. The core of the state is the `gameSlice.ts`, which defines the `GameState` and all the synchronous actions that can modify it. Asynchronous actions, such as handling keyboard input, are defined in `thunks.ts`. The `handleKeyPress` thunk is the entry point for all user input, and it dispatches the appropriate synchronous actions based on the current game state.

### 3.2. Rendering (`app/components/Renderer.tsx`)

The game is rendered to an HTML5 Canvas using the `Renderer` component. This component takes the current game state as input and uses the `Tileset` class to draw the appropriate tiles to the canvas. It also renders text boxes for dialogue and other UI elements.

### 3.3. LLM Integration (`app/api/chat`)

All communication with the LLM is handled through the `/api/chat` endpoint. This endpoint receives the chat history and the current NPC's ID, and it returns the LLM's response. The backend is responsible for authenticating the request, retrieving the correct prompt for the NPC, and formatting the request for the Google Generative AI API.

### 3.4. Data Pipeline (`data/` and `scripts/`)

The game's data is stored in a human-readable format in the `data` directory. Before the game is built, the `scripts/build-game-data.ts` script assembles all of this data into a single `gameData.json` file. The `scripts/validate-config.ts` script then validates this file to ensure its integrity.

## 4. Future Enhancements

*   **Combat System**: A turn-based combat system.
*   **Crafting System**: A system for crafting items.
*   **Multiplayer**: Support for multiple players.
*   **Expanded World**: New maps, NPCs, and quests.