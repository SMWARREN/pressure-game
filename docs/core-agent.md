# Pressure Game — Core Engine Reference

**Purpose**: Single source of truth for the game engine. Future Claude sessions answer any engine question from this file without re-exploring.

**Last Updated**: 2026-03-22
**Scope**: `src/game/` — store, engine, modes, tiles, levels, achievements, persistence

---

## State Machine

All game flow follows strict status transitions:

```
                 ┌──────────────┐
                 │    menu      │
                 └──────┬───────┘
                        │
               ┌────────┴────────┐
               │                 │
       ┌───────▼──────┐  ┌──────▼──────┐
       │   tutorial   │  │    idle     │
       └───────┬──────┘  └──────┬──────┘
               │ complete        │ startGame()
               └────────┬────────┘
                        │
                 ┌──────▼───────┐
                 │   playing    ├──────────┐
                 └──┬───────┬───┘          │
                    │       │              │
            ┌───────▼┐  ┌───▼────┐  ┌─────▼──┐
            │  won   │  │  lost  │  │ paused │
            └───┬────┘  └───┬────┘  └────┬───┘
                └─────┬─────┘            │ resume
                      │                  │
                 ┌────▼──────────────────┘
                 │    menu (or reload)
                 └─────────────────────
```

**Status Values** (`GameStatus`):
- `'menu'` — main menu, no level loaded
- `'tutorial'` — onboarding for first-time mode play
- `'idle'` — level loaded, not yet playing
- `'playing'` — active gameplay
- `'won'` — victory (brief, then back to menu)
- `'lost'` — defeat
- `'paused'` — gameplay paused

**Reentrancy Guard**: `_winCheckPending: boolean` in store prevents win-check loops. Resets on `loadLevel()`.

---

## Store Architecture

**File**: `src/game/store.ts` (~1017 lines)
**Framework**: Zustand v5 (`useGameStore`)

### State Fields

| Field | Type | Purpose |
|-------|------|---------|
| `status` | `GameStatus` | Current state machine status |
| `currentLevel` | `Level \| null` | Active level or null |
| `tiles` | `Tile[]` | Current grid (after rotations) |
| `currentModeId` | `string` | Active mode ID (e.g. `'classic'`) |
| `modeState` | `Record<string, unknown>` | Arbitrary per-mode transient data |
| `moves` | `number` | Tap count (undo doesn't decrement) |
| `score` | `number` | Score for score-based modes |
| `elapsedSeconds` | `number` | Timer (increments each tick) |
| `wallOffset` | `number` | Compression progress (cells crushed) |
| `compressionActive` | `boolean` | Whether walls are closing |
| `compressionDelay` | `number` | ms between wall advances |
| `timeUntilCompression` | `number` | ms until next advance |
| `history` | `Tile[][]` | Undo stack |
| `completedLevels` | `number[]` | Level IDs beaten |
| `bestMoves` | `Record<string, number>` | `"${modeId}:${levelId}"` → best moves |
| `bestTimes` | `Record<string, number>` | `"${modeId}:${levelId}"` → best seconds |
| `lastRotatedPos` | `Position \| null` | Animation flag; cleared after ~200ms |
| `connectedTiles` | `Set<string>` | `"x,y"` keys glowing on win |
| `showingWin` | `boolean` | Win animation in progress |
| `wallsJustAdvanced` | `boolean` | Trigger wall crush animation |
| `screenShake` | `boolean` | Screen shake on crush |
| `lossReason` | `string \| null` | Why player lost (for overlay) |
| `showTutorial` | `boolean` | Render tutorial screen |
| `seenTutorials` | `string[]` | Mode IDs with completed tutorials |
| `generatedLevels` | `Level[]` | Workshop levels |
| `animationsEnabled` | `boolean` | Toggle all animations |
| `theme` | `'dark' \| 'light'` | UI theme |
| `isPaused` | `boolean` | Paused by user |
| `lastPlayedLevelId` | `Record<string, number>` | Last level per mode |
| `selectedWorld` | `number` | Current world tab (1-based) |
| `featuredLevel` | `Level \| null` | Featured level from hub |
| `showArcadeHub` | `boolean` | Arcade mode selector open |
| `showPressureHub` | `boolean` | Featured levels modal open |
| `_winCheckPending` | `boolean` | Reentrancy guard |
| `_replayWalkthrough` | `number \| undefined` | Timestamp to trigger walkthrough |
| `editor` | `EditorState` | Level editor state |

### EditorState Fields

| Field | Type | Purpose |
|-------|------|---------|
| `enabled` | `boolean` | Editor mode active |
| `tool` | `EditorTool \| null` | `'select' \| 'move' \| 'node' \| 'path' \| 'wall' \| 'eraser' \| 'rotate' \| 'decoy'` |
| `selectedTile` | `Position \| null` | Currently selected tile |
| `gridSize` | `number \| null` | Custom grid override |
| `compressionDirection` | `CompressionDirection` | Which sides walls come from |
| `savedState` | `SavedEditorState \| null` | Snapshot before entering editor |

### Store Actions (Grouped)

#### Game Flow
| Action | Effect |
|--------|--------|
| `setGameMode(modeId)` | Switch mode; reset to tutorial or menu |
| `loadLevel(level)` | Load level; clear timers; status → `'idle'` |
| `startGame()` | status → `'playing'`; start timer |
| `restartLevel()` | Reset to idle; reload current level |
| `goToMenu()` | Exit to menu; clear timers |
| `completeTutorial()` | Mark mode seen; transition to menu |
| `pauseGame()` / `resumeGame()` | Toggle pause |

#### Gameplay
| Action | Effect |
|--------|--------|
| `tapTile(x, y)` | Rotate tile; push undo history; call `checkWin()` |
| `checkWin()` | Call `mode.checkWin()`; if won, call `engine.handleWin()` |
| `undoMove()` | Pop history; decrement moves (if mode supports) |
| `clearJustRotated()` | Reset rotation animation flag |
| `advanceWalls()` | Delegate to engine's `CompressionSystem` |
| `tickTimer()` | Called 1×/second; delegate to `engine.onTick()` |
| `triggerShake()` | Set `screenShake=true` for 600ms |

#### Settings
| Action | Effect |
|--------|--------|
| `toggleAnimations()` | Toggle `animationsEnabled` |
| `toggleTheme()` | Toggle `theme` |
| `setCompressionOverride(enabled)` | Force compression on/off |

#### Editor
- `toggleEditor()`, `editorEnterMode()`, `editorExitMode()`
- `editorUpdateTile(x, y)` → routes to tool handlers:
  - `editorHandleSelectTool`, `editorHandleMoveTool`, `editorHandleRotateTool`
  - `editorHandleNodeTool`, `editorHandleWallTool`, `editorHandlePathTool`
  - `editorHandleEraserTool`, `editorHandleDecoyTool`
- `editorResizeGrid(delta)`, `exportLevel()`

#### Hub Navigation
- `openArcadeHub()` / `closeArcadeHub()`
- `openPressureHub()` / `closePressureHub()`
- `setSelectedWorld(world)`

---

## Types & Interfaces

**File**: `src/game/types.ts`

### Core Primitives

```typescript
type Direction = 'up' | 'down' | 'left' | 'right';

type GameStatus = 'menu' | 'idle' | 'playing' | 'won' | 'lost' | 'tutorial' | 'paused';

type TileType = 'path' | 'node' | 'wall' | 'crushed' | 'empty'
              | 'number' | 'operator' | 'quantumFlux' | 'target';

type CompressionDirection = 'all' | 'top' | 'bottom' | 'left' | 'right'
                          | 'top-bottom' | 'left-right' | 'none' | ...;
```

### Tile

```typescript
interface Tile {
  id: string;                          // Unique key
  x: number;                           // Grid column (0-indexed)
  y: number;                           // Grid row (0-indexed)
  type: TileType;
  connections: Direction[];            // Pipe exits (rotate to change)
  canRotate: boolean;                  // User can tap to rotate
  isGoalNode: boolean;                 // Part of win condition
  isDecoy?: boolean;                   // Cosmetic (not in solution)
  justRotated?: boolean;               // Animation flag (~200ms)
  justCrushed?: boolean;               // Animation flag
  displayData?: Record<string, unknown>;  // Mode-specific (candy color, slot symbol, etc.)
}
```

### Level

```typescript
interface Level {
  id: number;
  name: string;
  world: number;
  gridSize: number;                    // Square grid (gridSize × gridSize)
  gridCols?: number;                   // Non-square column override
  gridRows?: number;                   // Non-square row override
  tiles: Tile[];
  goalNodes: Position[];               // Positions that must be connected
  maxMoves: number;
  compressionDelay: number;            // ms between wall advances
  compressionEnabled?: boolean;
  compressionDirection?: CompressionDirection;
  targetScore?: number;                // Win condition for score modes
  timeLimit?: number;                  // Seconds before game over
  isUnlimited?: boolean;
  isGenerated?: boolean;               // Workshop level
  solution?: Array<{ x: number; y: number; rotations: number }>;  // BFS cache
  features?: {
    wildcards?: boolean;
    bombs?: boolean;
    comboChain?: boolean;
    rain?: boolean;
    ice?: boolean;
    thieves?: boolean;
    blockerIntensity?: 0 | 1 | 2;
    minGroupForTime?: number;
  };
}
```

---

## Mode Plugin System

**Files**: `src/game/modes/types.ts`, `src/game/modes/index.ts`

### GameModeConfig Interface (Plugin Contract)

```typescript
interface GameModeConfig {
  // Identity
  id: string;
  name: string;
  description: string;
  icon: string;          // Emoji
  color: string;         // Hex accent

  // Rules
  wallCompression: 'always' | 'never' | 'optional';
  supportsUndo?: boolean;
  useMoveLimit?: boolean;

  // Rendering
  tileRenderer?: TileRenderer;

  // Core Logic (all called by store/engine)
  onTileTap(x, y, tiles, gridSize, modeState?): TapResult | null;
  checkWin(tiles, goalNodes, moves, maxMoves, modeState?): WinResult;
  checkLoss?(tiles, wallOffset, moves, maxMoves, modeState?): LossResult;
  getWinTiles?(tiles, goalNodes): Set<string>;
  getHintTiles?(tiles, goalNodes, modeState?): Set<string>;
  onTick?(state, modeState?): Partial<GameState> | null;
  initialState?(state): Record<string, unknown>;
  initTiles?(tiles, level): Tile[];

  // UI
  tutorialSteps?: TutorialStep[];
  renderDemo?(type, modeColor): React.ReactNode | null;
  statsDisplay?: StatComponentConfig[];
  statsLabels?: { moves?; timer?; compression? };
  overlayText?: { win?; loss? };
  getNotification?(tiles, moves, modeState?): string | null;

  // Data
  getColorContext(): ModeColorContext;
  getLevels(): Level[];
  worlds: Array<{ id; name; tagline; color; icon }>;

  // Optional Features
  supportsWorkshop?: boolean;
  walkthrough?: WalkthroughConfig;
}
```

### TapResult

```typescript
interface TapResult {
  tiles: Tile[];                      // New tile state
  valid: boolean;                     // Was tap valid?
  scoreDelta?: number;                // Points earned
  customState?: Record<string, unknown>;  // modeState updates
  timeBonus?: number;                 // Seconds added to timer
}
```

### WinResult / LossResult

```typescript
interface WinResult { won: boolean; reason?: string; }
interface LossResult { lost: boolean; reason?: string; }
```

### TileRenderer (Custom Visuals)

```typescript
interface TileRenderer {
  type: string;                        // 'pipe', 'slots', 'candy', etc.
  getColors?(tile, ctx): TileColors;   // Background, border, shadow
  getSymbol?(tile, ctx): string | null; // Emoji/text inside tile
  hidePipes?: boolean;                 // Hide connection lines
  symbolSize?: string;
}
```

### Mode Registry

```typescript
// src/game/modes/index.ts
export const GAME_MODES: GameModeConfig[];       // Enabled modes only
export function getModeById(id: string): GameModeConfig;  // Falls back to Classic

// Enable/disable via src/config/features.ts
export const ENABLED_MODE_IDS = ['classic', 'zen', 'blitz', 'candy', ...];
```

### Built-in Modes

| ID | Name | Compression | Undo | Move Limit | Notes |
|----|------|-------------|------|-----------|-------|
| `classic` | Classic | Always | ✓ | ✓ | Original pipe puzzle |
| `zen` | Zen | Never | ✓ | ✓ | No time pressure |
| `blitz` | Blitz | Always | ✗ | ✗ | Fast; goal crush = instant loss |
| `candy` | Candy | Optional | ✓ | ✓ | Match-3, cascades, wildcards, bombs |
| `shopping_spree` | Shopping Spree | Optional | ✓ | ✓ | Thieves steal items |
| `quantum_chain` | Quantum Chain | Optional | ✓ | ✓ | Math chains; experimental |
| `outbreak` | Outbreak | Optional | ✓ | ✓ | Disease spread strategy |
| `memory_match` | Memory Match | Optional | ✓ | ✓ | Brain: match pairs |
| `gravity_drop` | Gravity Drop | Optional | ✓ | ✓ | Arcade+: gravity mechanics |
| `mirror_forge` | Mirror Forge | Optional | ✓ | ✓ | Arcade+: light/mirror |
| `laser_relay` | Laser Relay | Optional | ✓ | ✓ | Experimental |
| `voltage` | Voltage | Optional | ✓ | ✓ | Experimental: charge/discharge |
| `fuse` | Fuse | Optional | ✓ | ✓ | Experimental |
| `gem_blast` | Gem Blast | Optional | ✓ | ✓ | Explode entire colors |

**Each mode folder** (`src/game/modes/{id}/`) contains:
- `index.ts` — `GameModeConfig` export + color palette
- `levels.ts` — static `LEVELS` array
- `tutorial.ts` — `TUTORIAL_STEPS`
- `demo.tsx` — tutorial demo renderer
- `walkthrough.ts` — optional first-level guidance

---

## Tile System

### Rotation Mechanics

Directions rotate clockwise through `['up', 'right', 'down', 'left']`:

```
['up', 'right'] → ['right', 'down'] → ['down', 'left'] → ['left', 'up']  (L-shape)
['up', 'down']  → ['right', 'left'] → ['up', 'down']  → ['right', 'left'] (straight)
```

Shapes **never change class** — straight stays straight, L stays L.

### Bidirectional Connections

If tile A has `'right'`, the tile to its right must have `'left'`. Always bidirectional.

### Connectivity Checking

**File**: `src/game/modes/utils.ts`

```typescript
// O(n·α(n)) — Union-Find + path compression
function checkConnected(tiles: Tile[], goals: Position[]): boolean

// BFS from goals[0] — returns tiles to glow on win
function getConnectedTiles(tiles: Tile[], goals: Position[]): Set<string>  // "x,y" keys

// Other utils
function rotateConnections(connections: Direction[]): Direction[]
function createTileMap(tiles: Tile[]): Map<string, Tile>  // "x,y" → Tile
function directionToOffset(dir: Direction): { dx, dy }
function deltaToDirection(dx, dy): Direction | null
```

---

## Level System & BFS Solver

### Level Sources

| Source | Path | Notes |
|--------|------|-------|
| Shared pressure levels | `src/game/modes/shared/levels.ts` | Used by Classic/Blitz/Zen |
| Mode-specific | `src/game/modes/{id}/levels.ts` | Each mode's own levels |
| Procedural | `src/game/modes/shared/generatedLevels.ts` | Auto-generated |
| Workshop | `generatedLevels` in store | User-created, persisted |

### BFS Solution Solver

**File**: `src/game/levels.ts`

```typescript
// Lazy: computed on first call, cached forever in module-level Map
function getSolution(level: Level): Array<{ x, y, rotations }> | null

// Returns true if level is solvable (reuses getSolution cache)
function verifyLevel(level: Level): boolean

// Check if all goal nodes form one connected component
function isConnected(tiles: Tile[], goals: Position[]): boolean
```

Procedural level generation (`generateLevel()`):
1. Places goal nodes
2. Routes L-shaped/straight pipes via Manhattan routing
3. Scrambles rotations
4. Verifies solvability with BFS
5. Optionally adds decoy tiles

---

## Engine Architecture

**File**: `src/game/engine/index.ts`
**Class**: `PressureEngine`

### Subsystems

| Subsystem | File | Responsibility |
|-----------|------|---------------|
| `TimerSystem` | `engine/timer.ts` | Track/cancel all timers atomically |
| `AudioSystem` | `engine/audio.ts` | Synthesized tones via Web Audio API |
| `PersistenceSystem` | `engine/persistence.ts` | Load/save via pluggable backends |
| `CompressionSystem` | `engine/compression.ts` | Wall movement & crush logic |

### Key Engine Methods

| Method | Purpose |
|--------|---------|
| `init(getState, setState)` | Connect to Zustand store |
| `getInitialState()` | Load persisted state, build initial `GameState` |
| `getInitialLevelState(level)` | Reset for new level (clear timers, init mode) |
| `onTick()` | Called 1×/second: increment timer, check time limit, advance walls |
| `handleWin(tiles, goalNodes)` | Stop timer, animate, update bests, persist, check achievements |
| `advanceWalls()` | Crush tiles; if goal crushed → game over |
| `playSound(name)` | Play `'rotate' \| 'undo' \| 'crush' \| 'win' \| 'lose' \| 'start'` |
| `persist(state)` | Write `PersistedState` slice to backend |
| `resolveCompressionEnabled(level, modeId, override)` | Determine if walls active |

### Engine Initialization (in GameEngineProvider)

```typescript
const engine = createPressureEngine({
  storageKey: 'pressure_save_v3',
  audioEnabled: true,
  defaultCompressionDelay: 10000,
  tickInterval: 1000,
});
engine.init(
  () => useGameStore.getState(),
  (partial) => useGameStore.setState(partial)
);
engine.setAchievementEngine(achievementEngine);
```

**StrictMode-safe**: `GameEngineProvider` uses module-level tracking to prevent double-instantiation.

---

## Timer Management

**File**: `src/game/engine/timer.ts`

All `setTimeout`/`setInterval` calls are tracked in a `Set`:

```typescript
class TimerSystem {
  setTimeout(fn, delay): id   // Track + return
  clearTimeout(id)            // Cancel + remove
  clearAll()                  // Wipe all timers atomically
  startTimer(callback)        // Begin 1s interval
  stopTimer()                 // Halt interval
}
```

**Why**: Prevents stale callbacks after level load/restart. `loadLevel()` calls `clearTimers()` atomically.

### Timing Constants (`src/game/constants/timings.ts`)

| Constant | Value | Use |
|----------|-------|-----|
| `UNDO_DELAY_MS` | 200ms | Clear `justRotated` after animation |
| `HISTORY_TRIM_DELAY_MS` | 300ms | Clear new-tile glow |
| `SCREEN_SHAKE_DURATION_MS` | 600ms | Wall crush shake |
| `WIN_ANIMATION_DELAY` | 600ms | Delay before `status='won'` |
| `TICK_INTERVAL` | 1000ms | Timer tick frequency |
| `COMPRESSION_DELAY` (default) | 10000ms | Wall advance interval |

---

## Persistence System

**File**: `src/game/engine/persistence.ts`

### What Gets Persisted (PersistedState)

Only a minimal slice — tiles, moves, elapsedSeconds are **never** persisted:

```typescript
interface PersistedState {
  completedLevels: number[];
  bestMoves: Record<string, number>;     // "modeId:levelId" → moves
  bestTimes: Record<string, number>;     // "modeId:levelId" → seconds
  showTutorial: boolean;
  generatedLevels: Level[];
  currentModeId: string;
  seenTutorials: string[];
  animationsEnabled: boolean;
  theme: 'dark' | 'light';
  lastPlayedLevelId: Record<string, number>;
  editorEnabled: boolean;
}
```

**Storage key**: `pressure_save_v3`

### Persistence Backends (`src/game/engine/backends.ts`)

All implement `PersistenceBackend { getItem, setItem, removeItem }`:

| Backend | Notes |
|---------|-------|
| `LocalStorageBackend` | Default; synchronous; 5-10MB |
| `SyncingBackend` | Offline-first: save locally, sync to API in background |
| `MySQLBackend` | Online-only; direct API calls |
| `CookieBackend` | Fallback when localStorage unavailable |

Configured via `VITE_PERSISTENCE_BACKEND` env var.

---

## Achievement System

**Files**: `src/game/achievements/engine.ts`, `src/game/achievements/types.ts`

### Achievement Shape

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  category: 'progression' | 'skill' | 'dedication' | 'special';
  points: number;
  hidden?: boolean;
  condition: AchievementCondition;
}

interface AchievementCondition {
  type: 'levels_completed' | 'speedrun' | 'survive_walls' | 'perfect_level' | ...;
  target?: number;
  levelId?: number;
  modeId?: string;
  worldId?: number;
}
```

### Trigger Flow

1. **On Win**: `engine.handleWin()` → `achievementEngine.checkAchievements(sessionStats)` → returns newly earned IDs → toast queue
2. **On Wall Advance**: `engine.advanceWalls()` → `trackWallsSurvived()` → increments 'survivor' progress
3. **Secret**: Level 998 (PRESSURE_LOGO_SECRET_LEVEL) completion → unlocks `secret_designer` achievement (Legendary, 200pts) → auto-shows About screen

### AchievementEngine API

```typescript
class AchievementEngine {
  checkAchievements(stats: SessionStats): string[]    // Returns newly earned IDs
  unlock(id: string): void
  subscribe(callback): unsubscribe
  getEarnedAchievements(): Achievement[]
  getTotalPoints(): number
  getProgress(id): AchievementProgress | undefined
}
```

---

## API & Leaderboards

**File**: `src/game/api/leaderboards.ts`

All endpoints relative to `VITE_API_URL`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/highscore?userId={id}&mode={m}&levelId={id}` | POST | Save best score |
| `/leaderboard?mode={m}&levelId={id}` | GET | Fetch top scores |
| `/profile?userId={id}` | GET | Fetch user profile |
| `/unlockAchievement` | POST | Mark achievement earned |
| `/updateUserStats` | POST | Update aggregate stats |
| `/replay` | POST | Save move replay |

Uses `robustFetch()` with exponential backoff: 3 attempts, 1s/2s/4s delays.

### User ID (`src/game/utils/userId.ts`)

```typescript
export function getUserId(): string
// 1. Check VITE_USER_ID env var (testing)
// 2. Check localStorage for existing ID
// 3. Generate new: "user_${randomString}"
// 4. Save to localStorage
// Uses globalThis (React Native compatible)
```

---

## Utilities

### Storage Abstraction (`src/game/utils/storage.ts`)

```typescript
export const nativeStorage = {
  getItem(key): string | null,
  setItem(key, value): void,
  removeItem(key): void,
};
// All wrapped in try-catch for React Native compatibility
```

**React Native override**: `src/game/utils/storage.native.ts` — in-memory Map implementation.

### Mode Colors (`src/game/modes/modeColorFactory.ts`)

```typescript
function getModeColorPalette(modeId: string): ModeColorContext
// Returns: primary, secondary, background, border, tileDefault, tileActive,
//          success, danger, nodeGlow, pathActive, wallColor, crushed,
//          transparent.{white01, white02, black30, black50}
```

---

## GameEngineProvider

**File**: `src/game/contexts/GameEngineProvider.tsx`

### Initialization Sequence

```
1. GameEngineProvider mounts
2. getOrCreateEngines() (module-level singleton, StrictMode-safe)
3. Detect environment (React Native vs web)
4. Create PressureEngine with backend config
5. Create StatsEngine and AchievementEngine
6. Load initial state from persistence
7. Initialize store
8. Wire callbacks (replay saving, achievement tracking)
9. Expose via context
```

### Exported Hooks

```typescript
export function useEngine(): PressureEngine
export function useAchievements(): AchievementEngine
export function useStatsEngine(): StatsEngine
```

---

## Stats Engine

**Files**: `src/game/stats/engine.ts`, `src/game/stats/types.ts`

```typescript
class StatsEngine {
  // Tracks per-level: moves, time, score
  // Emits GameEndEvent on level completion
}

interface GameEndEvent {
  levelId: number;
  modeId: string;
  outcome: 'won' | 'lost';
  moves: number;
  elapsedSeconds: number;
  score: number;
  perfect: boolean;
}
```

**Backends**: `LocalStorageStatsBackend` (web) | `MemoryStatsBackend` (testing)

**Replay**: `src/game/stats/replay.ts` — `ReplayEngine` captures/plays back move sequences.

---

## Performance

| Operation | Complexity | Note |
|-----------|------------|------|
| Goal connectivity check | O(n·α(n)) | Union-Find |
| Win glow tiles (BFS) | O(n) | Single traversal |
| Tile tap | O(n) | Scan + update |
| Wall advance | O(n) | Check crush zone |
| Undo | O(1) | Pop stack |
| Solution lookup | O(1) | Cached Map |

---

## Common Patterns

```typescript
// ✅ Correct: all timers through engine
engine.setTimeout(() => { ... }, 100);

// ❌ Wrong: untracked timer
setTimeout(() => { ... }, 100);

// ✅ Correct: tap flow
const result = mode.onTileTap(x, y, tiles, gridSize, modeState);
if (!result?.valid) return;
set({ tiles: result.tiles, moves: moves + 1 });
checkWin();

// ✅ Correct: only persist minimal state
engine.persist({ completedLevels, bestMoves, theme, ... });
// Never persist: tiles, moves, elapsedSeconds, history
```

---

## Adding a New Mode

1. Create `src/game/modes/{id}/index.ts` implementing `GameModeConfig`
2. Create `src/game/modes/{id}/levels.ts` with `LEVELS` array
3. Register in `src/game/modes/index.ts`
4. Add to `ENABLED_MODE_IDS` in `src/config/features.ts`
5. Mode auto-appears in UI, tutorial, mode selector

---

## Quick Navigation

| Question | Where to Look |
|----------|---------------|
| What's in GameState? | This doc § State Fields |
| How does onTileTap work? | `src/game/modes/types.ts` + `src/game/store.ts` |
| How do walls crush tiles? | `src/game/engine/compression.ts` |
| How is a level solved? | `src/game/levels.ts` → `getSolution()` |
| How do achievements trigger? | This doc § Achievement System |
| What persists to localStorage? | This doc § Persistence → PersistedState |
| How is audio played? | `src/game/engine/audio.ts` → `playSound()` |
| How does undo work? | Store: `history` stack + `undoMove()` action |
| How to add a mode? | This doc § Adding a New Mode |

---

## Cross-Reference

- Web app components → `docs/web-agent.md`
- Mobile app → `docs/mobile-agent.md`
- Agent coordination → `docs/AGENTS.md`
