# Board Games Playground

Single-page React + TypeScript playground for prototyping board-game mechanics before building physical versions.

## Goals

- Keep UI intentionally simple and practical for quick experiments.
- Host multiple games in separate modules with shared technical foundations.
- Run fully client-side (no backend), using browser storage when useful.
- Deploy as a static site on GitHub Pages.

## Current starter games

- **Dice Race**: simple turn-based points simulator.
- **Memo Pairs**: lightweight memory-card matching loop.

## Commands

- `./scripts/setup.sh` — install dependencies with Bun.
- `bun run dev` — start local development server.
- `bun run build` — type-check and build production assets.
- `bun run check` — run lint + typecheck + tests.
