# Pressure Game — Web Application Reference

**Purpose**: This document maps the entire web app codebase so future Claude sessions can instantly understand architecture, find files, and understand key patterns without re-exploration.

**Last Updated**: 2026-03-22
**Scope**: `apps/web/` + `src/` game engine + core types and utilities

---

## Entry Points

### Web App Bootstrap

| File | Purpose |
|------|---------|
| `apps/web/src/main.tsx` | React DOM entry point; sets up Zustand store access for E2E testing via `__GAME_STORE__` global |
| `apps/web/src/App.tsx` | Root component; detects test mode via `?levelId&modeId` query params; renders `GameProviders` → `GameBoard` |
| `apps/web/vite.config.ts` | Vite build config; aliases `@/game`, `@/utils`, `@/config`, `@/components`; chunks by mode group (pressure/arcade/strategy/brain/experimental) |
| `src/game/GameProviders.tsx` | Thin wrapper that renders `GameEngineProvider` (where all engines are created) |

### Key Configuration Files

| File | Content |
|------|---------|
| `package.json` (root) | Workspaces: `apps/web`, `apps/mobile`; scripts: `dev`, `build`, `test`, `web:*`, `mobile:*` |
| `apps/web/package.json` | React 19.1.0, Zustand 4.5.5; Vite, Playwright, Vitest |
| `tsconfig.json` | Path aliases: `@` → `src/`, `@/game` → `src/game/`, `@/utils` → `src/utils/`, `@/components` → `apps/web/components/` |
| `src/config/features.ts` | `ENABLED_MODE_IDS`: which game modes appear in UI (uncomment to enable disabled modes) |
| `src/utils/constants.ts` | `STORAGE_KEYS`, `GAME_MODES`, `GAME_STATUS`, `RGBA_COLORS` — centralized magic values |

---

## Components (apps/web/components/)

### Main Views

| Component | File | Purpose |
|-----------|------|---------|
| `GameBoard` | `GameBoard.tsx` | **Root game view**; renders game grid, stats, overlays, modals; delegates to child components; hooks: state, solution, replay, notification, tap rejection; routes status (`'tutorial'` → `TutorialScreen`, `'menu'` → `MenuScreen`, else game) |
| `MenuScreen` | `screens/MenuScreen.tsx` | Level browser, mode selector, leaderboard, achievements, profile; uses `ReplayEngine` for replays; hooks: theme, stats, unlimited high scores |
| `TutorialScreen` | `TutorialScreen.tsx` | Per-mode tutorial steps (read from `GameModeConfig.tutorialSteps`); demo renderers (`fixed-path`, `rotatable`, `node`, etc.); fallback steps if mode has none |
| `ArcadeHubScreen` | `ArcadeHubScreen.tsx` | Hub view for arcade game modes (candy crush-like games) |
| `PressureHubScreen` | `PressureHubScreen.tsx` | Hub view for pressure series modes (classic/blitz/zen) |

### Game Grid & Tiles

| Component | File | Purpose |
|-----------|------|---------|
| `GameGrid` | `game/GameGrid.tsx` | Renders tile grid; uses `Map` for O(1) tile lookups; memoized grid cells; computes `inDanger` for each tile (respects compression direction); renders `WallOverlay` + `GameTile` for each cell |
| `GameTile` | `game/GameTile.tsx` | Single tile renderer; supports `tileRenderer` override for custom modes (candy symbols, quantum numbers, etc.); animations: rotation, crush, bounce; particles on tap |
| `WallOverlay` | `game/WallOverlay.tsx` | Renders wall graphics based on compression direction; animates wall advancement |
| `ParticleLayer` | `game/ParticleLayer.tsx` | Isolated `forwardRef` component driven by `requestAnimationFrame`; imperative `burst()` API; never causes main board re-render |
| `GameStats` | `game/GameStats.tsx` | Renders mode-specific stats (moves, timer, score, compression bar); reads `statComponentConfigs` from active mode |

### UI Modals & Overlays

| Component | File | Purpose |
|-----------|------|---------|
| `ModeSelectorModal` | `ModeSelectorModal.tsx` | Mode picker; organizes by `MODE_GROUPS` (Pressure Series, Arcade, Strategy, Brain, Arcade+, Experimental); shows mode card with description, icon, color |
| `SettingsPanel` | `modals/SettingsPanel.tsx` | Settings: theme toggle, animations toggle, about button, how-to-play |
| `PauseOverlay` | `modals/PauseOverlay.tsx` | Pause menu; resume/reset/menu buttons |
| `ModeCard` | `modals/ModeCard.tsx` | Single mode display card (icon, name, description); clickable to select |
| `HowToPlayModal` | `HowToPlayModal.tsx` | In-app documentation; game rules and mechanics |
| `AboutScreen` | `AboutScreen.tsx` | Game description, mode info, playable 4x4 logo puzzle (level 999) |
| `Overlay` | `overlays/Overlay.tsx` | Generic overlay component for game end states (won/lost) |
| `ReplayOverlay` | `game/ReplayOverlay.tsx` | Replay viewing/scrubbing interface |

### Achievement & Stats Screens

| Component | File | Purpose |
|-----------|------|---------|
| `AchievementsScreen` | `AchievementsScreen.tsx` | Displays earned achievements with progress bars; filters by rarity/category |
| `AchievementToast` | `AchievementToast.tsx` | Toast notification when achievement earned; async render queue |
| `StatsScreen` | `StatsScreen.tsx` | Player stats (levels completed, best times, total score, play time) |
| `LeaderboardScreen` | `LeaderboardScreen.tsx` | Global leaderboard; syncs with backend API |
| `ProfileScreen` | `ProfileScreen.tsx` | User profile display; achievements, stats, recent wins |

### Hooks & Utilities

| File | Purpose |
|------|---------|
| `src/hooks/useTheme.ts` | Returns `{ theme, colors, toggleTheme }`; reads from store and `getThemeColors()` |
| `src/hooks/usePauseOnCondition.ts` | Auto-pause game based on condition (mobile blur, etc.) |
| `src/hooks/useModeColors.ts` | Gets active mode's color palette |
| `components/hooks/useViewport.ts` | Responsive tile size calculation from window dimensions; listens to resize/orientation |
| `components/hooks/useGameBoardInitialization.ts` | Custom hooks: `useSolutionComputation`, `useLevelRecord`, `useReplayEngine`, `useNotificationSystem`, `useTapRejection`, `useAcceptedTapNotification` |
| `components/hooks/useStateEditorLogic.ts` | Level editor state management |
| `components/hooks/useStateEditorHandlers.ts` | Level editor event handlers |

### Helper Functions

| File | Purpose |
|------|---------|
| `game/GameBoardUtils.ts` | Compute particle burst colors/shapes, board dimensions, time strings, level navigation, overlay props, compression percent |
| `game/GameBoardHelpers.tsx` | Render overlays, modals, footer, notifications; determine visibility; compute styles |
| `game/GameBoardState.ts` | Extract store state for reduced re-renders |
| `game/GameTileUtils.ts` | Tile animation helpers, step background styling |
| `game/GameStatsUtils.ts` | Stats display logic |
| `game/NotificationLog.tsx` | Central notification system for invalid taps, hints, etc. |
| `components/utils/gameStyles.ts` | CSS-in-JS style helpers (shadows, borders, animations) |
| `components/utils/styles.ts` | Global style injection (notification, spinner) |
| `components/utils/gameConditions.ts` | Conditional game state checks |

### Dev Tools

| Component | File | Purpose |
|-----------|------|---------|
| `StateEditor` | `StateEditor.tsx` | **Dev-only level editor**; edit tiles, connections, goal nodes, grid size; save/load; test solvability |
| `TestHarness` | `components/testing/TestHarness.tsx` | Run specific level/mode combinations via query params (`?levelId=X&modeId=Y`) for E2E testing |
| `LevelEditor` | `LevelEditor.tsx` | Full level creation UI |

---

## Game Engine (src/game/)

### Core State Management

| File | Purpose |
|------|---------|
| `store.ts` | **Zustand v5 store** (`useGameStore`); thin wrapper around `PressureEngine`; game status flow: `tutorial` → `menu` → `idle` → `playing` → `won\|lost`; actions: `loadLevel`, `tapTile`, `restartLevel`, `undo`, `toggleAnimations`, etc.; persists small slice to localStorage |
| `types.ts` | Core types: `Direction`, `Position`, `Tile`, `Level`, `GameState`, `GameActions`; tile types: `'path'`, `'node'`, `'wall'`, `'crushed'`, `'empty'`, `'number'`, `'operator'`, `'quantumFlux'`, `'target'` |
| `contexts/GameEngineProvider.tsx` | Creates and injects `PressureEngine`, `StatsEngine`, `AchievementEngine`; detects React Native vs web; configures persistence backend (localStorage, database, syncing); re-exports `useEngine`, `useStats`, `useAchievements` hooks; **single-instance pattern** with module-level tracking for StrictMode |

### Pressure Engine

| File | Purpose |
|------|---------|
| `engine/index.ts` | `PressureEngine` class; orchestrates `TimerSystem`, `AudioSystem`, `PersistenceSystem`, `CompressionSystem`; methods: `init()`, `destroy()`, `createContext()`, `onTileTap()`, `checkWin()`, `checkLoss()`, `advanceWalls()` |
| `engine/types.ts` | `PressureEngine` interface, `EngineContext`, `PersistedState`, sound effect types |
| `engine/timer.ts` | `TimerSystem` class; manages all `setTimeout`/`setInterval` in a `Set`; atomic cleanup via `destroy()` |
| `engine/audio.ts` | `AudioSystem` using Web Audio API; synthesized tones (no audio files); methods: `playTone()`, `destroy()` |
| `engine/compression.ts` | `CompressionSystem` class; wall animation logic; wall offset computation based on direction |
| `engine/persistence.ts` | `PersistenceSystem` class; loads/saves to backend; supports localStorage, database, syncing backends |
| `engine/backends.ts` | Backend implementations: `CookieBackend`, `LocalStorageBackend`, `MySQLBackend`, `SyncingBackend`; `robustFetch()` helper |
| `engine/native-mock.ts` | Mock engine for React Native development (when `navigator.product === 'ReactNative'`) |

### Game Modes (Plugin System)

| File | Purpose |
|------|---------|
| `modes/index.ts` | **Mode registry**; imports all modes; `GAME_MODES` array (filtered by `ENABLED_MODE_IDS`); `MODE_GROUPS` (organize UI sections); `getModeById()` function; export all mode classes |
| `modes/types.ts` | `GameModeConfig` interface (plugin contract): `id`, `name`, `description`, `icon`, `color`, `wallCompression`, `supportsUndo`, `tutorialSteps`, `walkthroughSteps`, `tileRenderer`, `statComponentConfigs`, `onTileTap()`, `checkWin()`, `checkLoss()`, `onTick()`, `getHintTiles()`, `getWinTiles()` |
| `modes/utils.ts` | Shared utilities: `rotateConnections()`, `createTileMap()`, `getMinGroupSizeForWorld()`, `deltaToDirection()`, `directionToOffset()`, `checkConnected()` (BFS), `getConnectedTiles()`, union-find for O(α(n)) connectivity |
| `modes/modeColorFactory.ts` | `getModeColorPalette()` returns `ModeColorContext` for a mode (UI colors, tile colors, state colors, transparent variants) |

#### Built-in Modes

| Mode | File | Mechanics |
|------|------|-----------|
| **Classic** | `modes/classic/index.ts` | Rotate pipes to connect goals before walls close; move limit + time limit; supports undo; 7 worlds |
| **Blitz** | `modes/blitz/index.ts` | Fast wall compression, no move limit, no undo; solve before crushed; 7 worlds |
| **Zen** | `modes/zen/index.ts` | No walls, infinite time, supports undo; pure puzzle |
| **Candy** | `modes/candy/index.ts` | Tap groups of 2+ matching symbols to clear; cascade multiplier; score-based win; features: wildcards, bombs, combos, rain, ice |
| **Shopping Spree** | `modes/shoppingSpree/index.ts` | Collect shopping items; thieves steal periodically; score-based; features: wildcards, bombs |
| **Quantum Chain** | `modes/quantumChain/index.ts` | Chain numbers + operators to hit target sums; quantum flux tiles modify adjacent values; experimental |
| **Outbreak** | `modes/outbreak/index.ts` | Strategy mode; disease spread mechanics |
| **Memory Match** | `modes/memoryMatch/index.ts` | Brain game; match pairs |
| **Gravity Drop** | `modes/gravityDrop/index.ts` | Arcade+; gravity-based mechanics |
| **Mirror Forge** | `modes/mirrorForge/index.ts` | Arcade+; light/mirror mechanics |
| **Laser Relay** | `modes/laserRelay/index.ts` | Experimental; laser/relay puzzles |
| **Voltage** | `modes/voltage/index.ts` | Experimental; charge accumulation; discharge to score |
| **Fuse** | `modes/fuse/index.ts` | Experimental; fuse/chain mechanics |
| **Gem Blast** | `modes/gemBlast/index.ts` | Blast gems explode entire colors when matched; cascade 5× multiplier |

Each mode has:
- `index.ts` — `GameModeConfig` export + color palette
- `levels.ts` — level definitions (static array)
- `tutorial.ts` — `TUTORIAL_STEPS` array for mode
- `demo.tsx` — demo renderer function
- `walkthrough.ts` — optional walkthrough config (first-play guidance)

### Levels & Solutions

| File | Purpose |
|------|---------|
| `levels.ts` | **Main level utilities**; BFS solution solver (computes on-demand, caches in Map); `getSolution()`, `verifySolvers()`, `isConnected()` (goal node connectivity check); procedural level generation via `generateLevel()` with Manhattan routing, rotation scrambling, decoy placement |
| `modes/shared/levels.ts` | `PRESSURE_LEVELS` — shared static levels for Classic/Blitz/Zen (10 levels across 3 worlds) |
| `modes/*/levels.ts` | Mode-specific level arrays (each has 4-5 worlds, 3-4 levels per world) |
| `modes/shared/generatedLevels.ts` | Procedural level generation; reused across modes |
| `levels/procedural.ts` | Procedural generation helpers (routing, scrambling) |
| `levels/compact.ts` | Compact level serialization format |

### Achievements

| File | Purpose |
|------|---------|
| `achievements/types.ts` | `Achievement`, `AchievementCondition`, `AchievementProgress`, `SessionStats`, `AchievementState` types |
| `achievements/engine.ts` | `AchievementEngine` class; manages progress, unlocking, subscription; persists to localStorage; tracks level attempts, streaks, perfect levels; methods: `checkAchievements()`, `unlock()`, `subscribe()`, `getProgress()` |

### API & Persistence

| File | Purpose |
|------|---------|
| `api/leaderboards.ts` | HTTP client for leaderboard sync; endpoints: highscores, leaderboard, profile, achievements, replays; uses `robustFetch()` with retry; `saveHighscore()`, `saveReplay()`, `unlockAchievement()`, `updateUserStats()` |
| `utils/userId.ts` | User ID management; uses `globalThis` (React Native compatible); reads from localStorage with try-catch; `getUserId()` function |
| `utils/storage.ts` | Web storage abstraction; `nativeStorage` object with `getItem`/`setItem`/`removeItem` (uses `globalThis.localStorage`) |
| `utils/storage.native.ts` | React Native storage fallback |
| `stats/engine.ts` | `StatsEngine` class; tracks per-level stats (moves, time, score); emits `GameEndEvent` on level completion |
| `stats/types.ts` | `GameEndEvent`, `StatsBackend` interface |
| `stats/backends/localStorage.ts` | `LocalStorageStatsBackend` — persists stats to localStorage |
| `stats/backends/memory.ts` | `MemoryStatsBackend` — in-memory only (for testing) |
| `stats/replay.ts` | `ReplayEngine` class; captures move sequences; allows playback/scrubbing |

### Utilities & Helpers

| File | Purpose |
|------|---------|
| `unlimited.ts` | Endless/unlimited mode logic; high score tracking per mode; `getUnlimitedHighScore()`, `setUnlimitedHighScore()` |
| `constants/timings.ts` | `UNDO_DELAY_MS`, `HISTORY_TRIM_DELAY_MS`, `SCREEN_SHAKE_DURATION_MS` |
| `constants/grid.ts` | `GRID_SIZE_MIN`, `GRID_SIZE_MAX` |
| `walkthroughs.ts` | Walkthrough registry; `WALKTHROUGHS` map by mode ID; `getWalkthrough()`, `hasWalkthrough()` functions |
| `utils/conditionalStyles.ts` | Utility functions: `isEmpty()`, `isNotEmpty()`, `pickRandom()`, `clamp()` |
| `utils/themeColors.ts` | Theme colors for light/dark modes; `getThemeColors()` returns `ThemeColors` object |
| `utils/modeColors.ts` | Mode-specific color constants |

---

## Key Patterns & Gotchas

### State Machine (Store Status)

```
tutorial → menu → idle → playing → won | lost
```

Only one of these states is active. `status` controls which screen renders in `GameBoard.tsx`.

### Engine Initialization (StrictMode-Safe)

The `GameEngineProvider` uses **module-level tracking** (`enginesCreated`, `enginesInstance`) to prevent double-instantiation in React StrictMode. The engine is created once and reused across multiple renders.

### Mode Plugin System

Every mode implements `GameModeConfig` which is a **plugin contract**. The grid engine is completely mode-agnostic:
- `GameBoard` reads the active mode via `getModeById(currentModeId)`
- Passes mode's `tileRenderer` → `GameGrid` → `GameTile` for custom visuals
- On tile tap, calls `mode.onTileTap(x, y)` which returns `TapResult`
- `TapResult.customState` merges into `modeState` (arbitrary mode data)
- Modes define their own `checkWin()`, `checkLoss()`, `onTick()` logic

This allows **swapping pipe puzzles ↔ candy crush ↔ slots** without touching core grid code.

### Tile Connections (Bidirectional)

Tile A pointing to B (`'right'`) means B must point back to A (`'left'`). Connections are stored as `Direction[]` (`'up'|'down'|'left'|'right'`). Rotating shifts each direction one step clockwise through `['up','right','down','left']`.

Pipe shapes never change class: `['up','down']` (straight) rotates to `['right','left']` (still straight, just horizontal).

### Solution Caching

The level solver (BFS) runs on-demand the first time `getSolution(levelId)` is called. Result is cached in a module-level `Map<number, SolutionPath | null>`. Null means no solution found. Subsequent calls return instantly.

### Particle System (Imperative API)

`ParticleLayer` is isolated with a `forwardRef`. It's driven by `requestAnimationFrame`, never by React re-renders. Parent calls `particleRef.current.burst(x, y, color)` imperatively. This keeps 60fps particle updates from blocking the game board.

### Timer System (Atomic Cleanup)

All timers are tracked in a `Set` inside `TimerSystem`. On level load or app destroy, `clearAllTimers()` wipes them all atomically. This prevents "stale timer callbacks" bugs where a timer fires after the level changed.

### Persistence Backends

Three backends available:
- **localStorage** (default, offline-first) — stores in browser storage
- **MySQLBackend** (online-only) — sync-on-action to backend
- **SyncingBackend** (offline-first with sync) — stores locally, background sync to backend

Configured in `GameEngineProvider` via `VITE_PERSISTENCE_BACKEND` env var.

### Responsive Tile Sizing

`useViewport()` hook runs on resize/orientation-change and recomputes tile size. `tileSize = min(screenWidth, screenHeight) / (gridSize + gapFactor)`. This is called on every layout recalculation.

---

## Types & Interfaces (Key Exports)

| Type | File | Use |
|------|------|-----|
| `GameState` | `types.ts` | Store state shape |
| `GameActions` | `types.ts` | Store action methods |
| `Tile` | `types.ts` | Single tile with connections, position, type |
| `Level` | `types.ts` | Level definition with tiles, goals, compression, time limit |
| `GameModeConfig` | `modes/types.ts` | Mode plugin contract |
| `TapResult` | `modes/types.ts` | Return from `mode.onTileTap()` |
| `WinResult`, `LossResult` | `modes/types.ts` | Return from `mode.checkWin/Loss()` |
| `ModeColorContext` | `modes/types.ts` | Mode colors (UI, tiles, states) |
| `TileRenderer` | `types.ts` | Custom tile render function |
| `Achievement` | `achievements/types.ts` | Achievement definition |
| `GameEndEvent` | `stats/types.ts` | Event emitted on level completion |
| `StatsBackend` | `stats/types.ts` | Stats persistence interface |
| `PersistedState` | `engine/types.ts` | Data persisted to localStorage |

---

## API Endpoints & Backends

All endpoints are relative to `VITE_API_URL` (e.g., `http://localhost:8000`):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/highscore?userId={id}&mode={mode}&levelId={id}` | POST | Save/update best score for a level |
| `/leaderboard?mode={mode}&levelId={id}` | GET | Fetch top scores for level |
| `/profile?userId={id}` | GET | Fetch user profile + achievements |
| `/unlockAchievement` | POST | Mark achievement as earned |
| `/updateUserStats` | POST | Update aggregate stats |
| `/replay` | POST | Save move replay |

Uses `robustFetch()` with exponential backoff retry (3 attempts, 1s/2s/4s delays).

---

## Config & Build

### Vite Build Chunks

Code is split by mode group:
- `react-vendor.js` — React/React-DOM
- `zustand.js` — Zustand store
- `modes-pressure.js` — Classic, Blitz, Zen
- `modes-arcade.js` — Candy, Shopping Spree
- `modes-strategy.js` — Quantum Chain, Outbreak
- `modes-brain.js` — Memory Match
- `modes-arcade-plus.js` — Gravity Drop, Mirror Forge
- `modes-experimental.js` — Laser Relay, Voltage, Fuse

### Environment Variables

| Variable | Use |
|----------|-----|
| `VITE_API_URL` | Backend URL (e.g., `http://localhost:8000/api.php`) |
| `VITE_PERSISTENCE_BACKEND` | `'localStorage'` (default), `'database'`, or `'syncing'` |

### Build Commands

```bash
npm run dev           # Start Vite dev server (port 3000)
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

---

## Quick Navigation

### Find a Game Mode
- List all: `src/game/modes/index.ts` → `GAME_MODES`
- Specific mode: `src/game/modes/{modeId}/index.ts`
- Levels for mode: `src/game/modes/{modeId}/levels.ts`
- Tutorial steps: `src/game/modes/{modeId}/tutorial.ts`

### Find a Component
- Screen/route handler: `apps/web/components/screens/` or routing in `GameBoard.tsx`
- Game UI element: `apps/web/components/game/`
- Modal/overlay: `apps/web/components/modals/` or `overlays/`

### Find Game Logic
- Win/loss detection: `src/game/store.ts` or `src/game/engine/index.ts`
- Tile rotation: `src/game/modes/utils.ts` → `rotateConnections()`
- Goal connectivity: `src/game/levels.ts` → `isConnected()`
- Wall compression: `src/game/engine/compression.ts`
- Mode plugin contract: `src/game/modes/types.ts` → `GameModeConfig`

### Find Persistence/API
- Store data to localStorage: `src/game/engine/persistence.ts`
- Backend communication: `src/game/api/leaderboards.ts`
- User ID management: `src/game/utils/userId.ts`
- Achievement unlocking: `src/game/achievements/engine.ts`

### Find Styling
- Theme colors: `src/utils/themeColors.ts`
- Mode colors: `src/utils/modeColors.ts` or `src/game/modes/modeColorFactory.ts`
- Global constants: `src/utils/constants.ts` → `RGBA_COLORS`
- Component styles: Inline `React.CSSProperties` in component files (no CSS library)

---

## Testing

### Unit Tests (Vitest)
Test files: `**/*.test.ts` in `src/` and `apps/web/`

Key test suites:
- `src/game/levels.test.ts` — Solution solver, verification
- `src/game/api/leaderboards.test.ts` — API client mocking

### E2E Tests (Playwright)
Test files: `apps/web/tests/e2e/`

### Manual Testing
Use TestHarness: `http://localhost:3000/?levelId=1&modeId=classic`
Access game store via `window.__GAME_STORE__`.

---

## Cross-Reference

- For deep engine internals → `docs/core-agent.md`
- For mobile app → `docs/mobile-agent.md`
- For agent coordination rules → `docs/AGENTS.md`
