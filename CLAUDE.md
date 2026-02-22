# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Type-check + Vite production build
npm run preview    # Preview production build
npm run lint       # ESLint
```

No test framework is configured.

## Architecture

**Pressure** is a React + TypeScript pipe-puzzle game. The player rotates tiles to connect goal nodes before closing walls crush them.

### Stack
- **React 19** with inline styles (no CSS-in-JS library, no component library)
- **Zustand v5** for all game state (`src/game/store.ts`)
- **Vite** with `@` aliased to `src/`

### State machine

The store (`src/game/store.ts`) is the single source of truth. Game status flows:

```
tutorial → menu → idle → playing → won | lost
```

All timers are centralized: `safeTimeout` / `clearAllTimers` track every `setTimeout` in a `Set` so they can all be cancelled atomically on level load/restart. The game tick runs via a module-level `setInterval` that calls `useGameStore.getState().tickTimer()` to avoid stale closure issues. Reentrancy guards (`_winCheckPending`) live in Zustand state so they reset on `loadLevel`.

Persistence uses `localStorage` under the key `pressure_save_v3`. Only a small `PersistedState` slice is written; transient state is never persisted.

### Game mode plugin system

Every mode implements `GameModeConfig` (`src/game/modes/types.ts`). The store delegates to the active mode for:
- `onTileTap` — returns new tile state or null (invalid tap)
- `checkWin` — called after every valid tap
- `checkLoss` — optional extra loss condition beyond wall crushing
- `onTick` — optional per-second hook

Modes also declare `wallCompression: 'always' | 'never' | 'optional'` and optional `tileRenderer` for custom visuals.

**Built-in modes** (`src/game/modes/`):
- `ClassicMode` — walls close on timer, move limit, undo supported
- `ZenMode` — no walls, no move limit, undo supported
- `BlitzMode` — walls close, no move limit, no undo; any crushed goal node = instant loss

To add a new mode: implement `GameModeConfig` in a new file and register it in `src/game/modes/index.ts`.

### Adding a custom mode (e.g. Candy Crush)

1. Create `src/game/modes/CandyMode.ts` implementing `GameModeConfig`
2. Set `tileRenderer: { type: 'candy', hidePipes: true, getSymbol, getColors }` for custom visuals
3. Put all game logic in `onTileTap` (swap, match, cascade) and `checkWin`
4. Optionally implement `getWinTiles` to control which tiles glow on win
5. Register in `src/game/modes/index.ts` — it auto-appears in the UI
6. Mark interactive tiles `canRotate: true` so `GameBoard` fires particle effects on tap

`tileRenderer` flows: `GameModeConfig.tileRenderer` → `GameBoard` (reads via `getModeById`) → `GameGrid` → each `GameTile`.

### Level system (`src/game/levels.ts`)

`LEVELS` is a static array of 10 hand-authored levels across 3 worlds. Solutions are **lazily computed** on first call to `getSolution()` and cached in a module-level `Map` — nothing runs at module load time. `verifyLevel()` reuses `getSolution()` so the BFS never runs twice for the same level.

The `generateLevel()` function creates procedural levels: it places goal nodes, routes L-shaped/straight pipe paths between them via Manhattan routing, scrambles rotations, verifies solvability with the BFS solver, and optionally adds decoy tiles.

### Tile types and connections

Every `Tile` has a `connections: Direction[]` array (`'up' | 'down' | 'left' | 'right'`). Rotating a tile shifts each direction one step clockwise in the `['up', 'right', 'down', 'left']` ring. Connection is bidirectional — tile A points to B **and** B has the opposite direction back to A.

Pipe shapes stay in their class: a straight pipe (`['up','down']`) rotates to `['right','left']` — it can never become an L-shape.

Modes can attach arbitrary per-tile data in `tile.displayData` without touching the core type.

### UI structure

`App.tsx` renders only `<GameBoard />`. `GameBoard` owns all screen routing:
- `status === 'tutorial'` → `<TutorialScreen>`
- `status === 'menu' || !currentLevel` → `<MenuScreen>` (inline component in GameBoard.tsx)
- Otherwise → the in-game view with header, stats row, tile grid, and footer controls

The `ParticleLayer` is an isolated `forwardRef` component driven by `requestAnimationFrame`; it communicates via an imperative `burst()` handle so particle updates never cause the main board to re-render.

Tile size is computed responsively from `window.innerWidth / innerHeight` via `useViewport()` on every resize/orientation-change.

Audio uses the Web Audio API (`AudioContext`) — synthesized tones, no audio files.
