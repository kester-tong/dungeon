# Dungeon

This is a small experimental game built with **Next.js** and **React**. It uses a tile based map and allows chatting with NPCs powered by the Anthropic API. Redux Toolkit provides state management for the game world.

## Requirements

- Node.js 18 or later
- An Anthropic API key
- An application password for the chat API

Create a `.env.local` file in the project root and define:

```bash
ANTHROPIC_API_KEY=<your_api_key>
APP_PASSWORD=<your_password>
```

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

### Linting

Run ESLint with:

```bash
npm run lint
```

## Repository Layout

- **app/** – Next.js application code including API routes, components and Redux store
- **src/** – game configuration, NPC definitions and helper classes
- **public/** – static assets such as the tileset image

## License

MIT
