# Adding a New Game Mode

Every mode lives in its own folder under `src/game/modes/` and exports a single
`GameModeConfig` object.  The store and UI automatically pick it up once it is
registered in `src/game/modes/index.ts`.

---

## 1. Folder structure

```
src/game/modes/
  yourmode/
    index.ts      ← GameModeConfig lives here
    levels.ts     ← level array (required by getLevels)
    tutorial.ts   ← tutorial steps for this mode
    demo.tsx      ← demo visuals for tutorial screen
```

Each mode is self-contained with its own tutorial and demo files.

---

## 2. Register the mode

Open `src/game/modes/index.ts` and add one line:

```ts
import { YourMode } from './yourmode';

export const GAME_MODES: GameModeConfig[] = [
  ClassicMode,
  ZenMode,
  BlitzMode,
  CandyMode,
  YourMode,   // ← add here
];
```

That's it — the mode selector, menu, tutorial system, and stats bar all react
automatically.

---

## 3. Minimum viable config

```ts
// src/game/modes/yourmode/index.ts
import { GameModeConfig, TapResult, WinResult } from '../types';

export const YourMode: GameModeConfig = {
  id: 'yourmode',
  name: 'Your Mode',
  description: 'One sentence shown in the mode picker.',
  icon: '🎯',
  color: '#6366f1',          // accent colour used throughout the UI
  wallCompression: 'never',  // 'always' | 'never' | 'optional'
  getLevels: () => YOUR_LEVELS,
  worlds: [
    { id: 1, name: 'World 1', tagline: 'A short tagline', color: '#6366f1', icon: '🎯' },
  ],

  onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
    // Return null  → invalid tap (no move counted, red flash shown)
    // Return object → valid tap
    return { tiles, valid: true, scoreDelta: 0 };
  },

  checkWin(tiles, goalNodes, moves, maxMoves, modeState): WinResult {
    return { won: false };
  },
};
```

---

## 4. All config fields

### Identity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | ✓ | Unique key, saved in localStorage |
| `name` | `string` | ✓ | Shown in mode picker and header |
| `description` | `string` | ✓ | One-liner in mode picker |
| `icon` | `string` | ✓ | Emoji shown in button |
| `color` | `string` | ✓ | CSS hex — accent colour |

### Behaviour flags

| Field | Default | Notes |
|-------|---------|-------|
| `wallCompression` | — | `'always'` closes walls on timer · `'never'` disables walls · `'optional'` lets player toggle |
| `supportsUndo` | `true` | Set `false` if gravity / random refill makes undo nonsensical (Candy does this) |
| `useMoveLimit` | `true` | If `false`, the move counter never triggers a loss |
| `supportsWorkshop` | `false` | Show the Workshop (level generator) tab in the menu |

### Level system

```ts
getLevels: () => CANDY_LEVELS,   // returns Level[]
worlds: [
  { id: 1, name: 'Sweet',  tagline: 'Match & clear groups', color: '#f472b6', icon: '🍬' },
  { id: 2, name: 'Sour',   tagline: 'Bigger combos needed', color: '#a78bfa', icon: '🍭' },
  { id: 3, name: 'Frozen', tagline: 'Race the clock',       color: '#60a5fa', icon: '❄️' },
],
```

Levels are assigned to worlds by their `level.world` number.

### Core game hooks

#### `onTileTap`

Called when the player taps a tile.  Return `null` to reject the tap (invalid
move — shows red flash + small red particles, no move counted).

```ts
onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
  const tile = tiles.find(t => t.x === x && t.y === y);
  if (!tile?.canRotate) return null;   // guard

  // ... your game logic ...

  return {
    tiles: newTiles,    // full tile array after the tap
    valid: true,
    scoreDelta: 125,    // added to store.score (omit or 0 for no score)
  };
},
```

#### `checkWin`

Called after every accepted tap.  Return `{ won: true }` to trigger the win
sequence (confetti + overlay).

```ts
// Candy: win when score reaches target
checkWin(_tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
  const score  = (modeState?.score  as number) ?? 0;
  const target = (modeState?.targetScore as number) ?? Infinity;
  return { won: score >= target, reason: 'Target reached!' };
},

// Pipe modes: win when all goal nodes are connected
checkWin(tiles, goalNodes) {
  const won = checkConnected(tiles, goalNodes);
  return { won };
},
```

#### `checkLoss` (optional)

Extra loss conditions beyond wall crushing.  Called after every tap and after
walls advance.

```ts
// Candy: out of taps
checkLoss(_tiles, _wallOffset, moves, maxMoves, modeState): LossResult {
  const score  = (modeState?.score  as number) ?? 0;
  const target = (modeState?.targetScore as number) ?? Infinity;
  if (moves >= maxMoves && score < target)
    return { lost: true, reason: 'Out of moves!' };
  return { lost: false };
},
```

The `reason` string becomes the loss overlay title (uppercased automatically).

#### `onTick` (optional)

Called once per second while the game is in `'playing'` state.  Return a
partial `GameState` update to mutate tiles, or `null` for no change.

`modeState` always includes `{ score, targetScore, timeLeft }` — `timeLeft` is
only set when `level.timeLimit` is defined.

```ts
// Candy Frozen world: freeze tiles when time is low
onTick(state, modeState) {
  const timeLeft = modeState?.timeLeft as number | undefined;
  if (timeLeft === undefined) return null;  // not a timed level

  const freezeCount = timeLeft <= 8 ? 2 : timeLeft <= 15 ? 1 : 0;
  if (freezeCount === 0) return null;

  const candidates = state.tiles.filter(t => t.canRotate && !t.displayData?.frozen);
  if (!candidates.length) return null;

  const toFreeze = new Set(
    [...candidates].sort(() => Math.random() - 0.5)
      .slice(0, freezeCount)
      .map(t => `${t.x},${t.y}`)
  );

  return {
    tiles: state.tiles.map(t =>
      toFreeze.has(`${t.x},${t.y}`)
        ? { ...t, canRotate: false, displayData: { ...t.displayData, frozen: true } }
        : t
    ),
  };
},
```

#### `getWinTiles` (optional)

Controls which tiles glow on win.  Default is the pipe-connectivity BFS from
goal nodes — override this for modes where "connected" means something else.

```ts
// Candy: light up every candy tile on win
getWinTiles(tiles): Set<string> {
  return new Set(tiles.filter(t => t.canRotate).map(t => `${t.x},${t.y}`));
},
```

#### `getNotification` (optional)

Return a string to flash above the board after any valid tap, or `null` for no
message.  Receives `modeState.scoreDelta` so you can base it on points earned.
Plain `+N` is shown automatically when you return `null` and `scoreDelta > 0`.

```ts
// Candy: combo text for big groups
getNotification(_tiles, _moves, modeState) {
  const delta = (modeState?.scoreDelta as number) ?? 0;
  if (delta <= 0) return null;
  const n = Math.round(Math.sqrt(delta / 5));  // reverse n²×5 formula
  if (n >= 9) return `+${delta} 💥 MEGA COMBO!`;
  if (n >= 6) return `+${delta} 🔥 GREAT!`;
  if (n >= 4) return `+${delta} ✨ NICE!`;
  return null;
},
```

### Visual customisation

#### `tileRenderer` — custom tile visuals

Omit entirely to use the default pipe renderer.  Set `type` to anything other
than `'pipe'` to enable the custom branch in `GameTile`.

```ts
tileRenderer: {
  type: 'candy',          // any string except 'pipe'
  hidePipes: true,        // hide connection lines (use your own symbols)
  symbolSize: '1.5rem',   // CSS font-size for the symbol span

  // Return background / border / shadow for each tile
  getColors(tile, ctx): TileColors {
    if (tile.displayData?.frozen) {
      return {
        background: 'linear-gradient(145deg, #0f1f3d, #091529)',
        border: '2px solid #60a5fa',
        boxShadow: '0 0 14px rgba(96,165,250,0.45)',
      };
    }
    if (!tile.canRotate) {
      return { background: 'rgba(10,10,20,0)', border: '1px solid transparent' };
    }
    const c = CANDY_COLORS[tile.displayData?.symbol as string];
    return {
      background: `linear-gradient(145deg, ${c.bg}, ${c.bg}bb)`,
      border: `2px solid ${c.border}`,
      boxShadow: `0 0 8px ${c.glow}`,
    };
  },

  // Return the emoji / character to render in the center of the tile
  getSymbol(tile, ctx): string | null {
    if (tile.displayData?.frozen) return '🧊';
    if (!tile.canRotate) return null;
    return (tile.displayData?.symbol as string) ?? null;
  },
},
```

`ctx` (TileRenderContext) gives you: `isHint`, `inDanger`, `justRotated`,
`compressionActive`, `tileSize`.

#### `overlayText` — win/loss screen titles

```ts
overlayText: {
  win: 'GOAL REACHED!',   // replaces 'CONNECTED'
  loss: 'NO MORE TAPS',   // replaces 'CRUSHED' (dynamic lossReason takes priority)
},
```

#### `statsDisplay` — which stats to show

```ts
// Candy: score bar + tap counter
statsDisplay: [{ type: 'score' }, { type: 'moves' }],

// Frozen world levels override this in GameBoard when level.timeLimit is set:
// [{ type: 'score' }, { type: 'timeleft' }]

// Available types:
// 'moves'          — current taps / max moves counter
// 'compressionBar' — wall-closing progress bar
// 'countdown'      — seconds until next wall advance
// 'score'          — score + progress bar toward targetScore
// 'timeleft'       — countdown from level.timeLimit (auto-used when timeLimit set)
```

#### `statsLabels` — rename "MOVES" in the display

```ts
statsLabels: { moves: 'TAPS' },   // candy renames the counter
```

### Tutorial

Each mode defines its own tutorial steps and demo visuals in separate files:

#### `tutorial.ts` — Tutorial steps

```ts
// src/game/modes/yourmode/tutorial.ts
import { TutorialStep } from '../../types';

export const YOUR_MODE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🍎',
    iconColor: '#ef4444',
    title: 'Tap a Group',
    subtitle: 'YOUR MOVE',
    demo: 'candy-group',   // demo type passed to renderDemo
    body: 'Tap any candy to clear its connected group...',
  },
  // up to as many steps as you need
];
```

#### `demo.tsx` — Demo visuals

```tsx
// src/game/modes/yourmode/demo.tsx
import { ReactNode } from 'react';
import { TutorialDemoType } from '../../types';

export function renderYourModeDemo(type: TutorialDemoType, modeColor: string): ReactNode | null {
  switch (type) {
    case 'candy-group':
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Render your demo tiles here */}
          <div style={{ fontSize: 24 }}>🍎</div>
          <div style={{ fontSize: 24 }}>🍎</div>
          <div style={{ fontSize: 24 }}>🍎</div>
        </div>
      );
    // Add more demo cases as needed
    default:
      return null;
  }
}
```

#### Register in `index.ts`

```ts
// src/game/modes/yourmode/index.ts
import { YOUR_MODE_TUTORIAL_STEPS } from './tutorial';
import { renderYourModeDemo } from './demo';

export const YourMode: GameModeConfig = {
  // ... other config
  tutorialSteps: YOUR_MODE_TUTORIAL_STEPS,
  renderDemo: renderYourModeDemo,
};
```

The `TutorialScreen` component will automatically use your mode's `renderDemo` function to display visuals for each tutorial step.

---

## 5. Level format

```ts
// src/game/modes/yourmode/levels.ts
import { Level, Tile } from '../../types';

const tile = (x: number, y: number, extra?: Partial<Tile>): Tile => ({
  id: `t${x}-${y}`,
  type: 'path',
  x, y,
  connections: [],
  canRotate: true,
  isGoalNode: false,
  ...extra,
});

export const YOUR_LEVELS: Level[] = [
  {
    id: 201,              // use IDs that don't clash with other modes
    name: 'First Steps',
    world: 1,
    gridSize: 5,
    tiles: [/* ... */],
    goalNodes: [],        // pipe modes set these; leave empty for score-only modes
    maxMoves: 20,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 300,     // omit for pipe modes
    timeLimit: 60,        // omit for non-timed levels (seconds)
  },
];
```

### Seeded random grids (like Candy)

```ts
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrid(gridSize: number, symbols: string[], seed: number): Tile[] {
  const rng = seededRandom(seed);
  const tiles: Tile[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const symbol = symbols[Math.floor(rng() * symbols.length)];
      tiles.push({
        id: `c${x}-${y}`,
        type: 'path', x, y,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        displayData: { symbol, activeSymbols: symbols },
      });
    }
  }
  return tiles;
}
```

---

## 6. Per-tile arbitrary data

Every tile has `displayData?: Record<string, unknown>` — use it freely without
changing the core `Tile` type.

```ts
// Candy symbols
displayData: { symbol: '🍎', activeSymbols: ['🍎','🍊','🍋'] }

// Candy frozen state
displayData: { symbol: '🍋', frozen: true }

// Drop-in animation flag (cleared after 1.5 s by the store)
displayData: { symbol: '🍓', isNew: true }

// Your own mode — anything goes
displayData: { value: 7, locked: false, color: 'red' }
```

Access it in `getColors` / `getSymbol` / `onTileTap` as:

```ts
const val = tile.displayData?.value as number | undefined;
```

---

## 7. Gravity / refill pattern (reference)

The Candy implementation is the reference for modes that need tiles to fall and
refill after a clear:

```ts
// Collect surviving tiles (canRotate OR special flag like frozen)
const survivors = tiles.filter(t => t.canRotate || t.displayData?.frozen);

for (let col = 0; col < gridSize; col++) {
  const colTiles = survivors
    .filter(t => t.x === col)
    .sort((a, b) => b.y - a.y);   // bottom first

  // Pack to bottom
  colTiles.forEach((t, i) => {
    result.push({ ...t, y: gridSize - 1 - i, displayData: { ...t.displayData, isNew: false } });
  });

  // Fill top with new tiles (marked isNew: true for drop-in animation)
  for (let row = 0; row < gridSize - colTiles.length; row++) {
    result.push({
      id: `new-${col}-${row}-${Math.random().toString(36).slice(2,6)}`,
      type: 'path', x: col, y: row,
      connections: [], canRotate: true, isGoalNode: false,
      displayData: { symbol: pick(symbols), activeSymbols: symbols, isNew: true },
    });
  }
}
```

`isNew: true` triggers the `candyDrop` CSS animation (slide in + indigo glow).
The store automatically clears it after 1.5 s.

---

## 8. Checklist for a new mode

- [ ] `src/game/modes/yourmode/index.ts` — exports `GameModeConfig`
- [ ] `src/game/modes/yourmode/levels.ts` — exports `Level[]`
- [ ] `src/game/modes/yourmode/tutorial.ts` — exports tutorial steps
- [ ] `src/game/modes/yourmode/demo.tsx` — exports `renderDemo` function
- [ ] Registered in `src/game/modes/index.ts`
- [ ] Level IDs don't collide with other modes (classic 1-10, candy 101-112, pick 200+)
- [ ] `wallCompression` set correctly (`'never'` for score/time modes)
- [ ] `supportsUndo: false` if tap results are non-reversible (gravity, random)
- [ ] `tileRenderer` defined if you need custom visuals (not pipes)
- [ ] `overlayText` set so win/loss screen text makes sense
- [ ] `statsDisplay` configured so the right stats show during play
- [ ] `tutorialSteps` and `renderDemo` added to config
