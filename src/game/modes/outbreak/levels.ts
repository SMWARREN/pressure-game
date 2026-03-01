// OUTBREAK MODE — Level Definitions + Frontier Pre-computation
//
// All grids are procedurally generated from a seed so every play of a given
// level starts identical.
//
// Difficulty scales by:
//   • Grid size     5×5 → 6×6 → 7×7 (→ 10×10 infinite)
//   • Color count   3 → 4 → 5
//   • Move budget   generous → moderate → tight
//
// IDs start at 501 to avoid collisions with all other modes.

import { Level, Tile } from '../../types';
import { seededRandom } from '../seedUtils';

// ── Color palette ──────────────────────────────────────────────────────────────

/** Vivid neon foreground — borders, symbols, owned tile accents */
export const OUTBREAK_COLORS = [
  '#ff6b6b', // 0  Coral Red
  '#51cf66', // 1  Vivid Green
  '#74c0fc', // 2  Sky Blue
  '#ffd43b', // 3  Bright Yellow
  '#da77f2', // 4  Pink Violet
];

/**
 * Zombie strain icons — each color has a unique undead character.
 * Shown on interior (unreachable) tiles so players can plan ahead.
 * On FRONTIER tiles the group-size number takes priority.
 */
export const OUTBREAK_ICONS = [
  '🧟', // 0  Coral Red   — classic zombie
  '🧟‍♂️', // 1  Vivid Green  — zombie man
  '🧟‍♀️', // 2  Sky Blue    — zombie woman
  '💀', // 3  Bright Yellow — skull
  '🫀', // 4  Pink Violet  — beating heart (infected organ)
];

/**
 * Owned-tile icons — shown inside YOUR territory to reinforce the "you absorbed it" feel.
 * Smaller, so they don't compete with the vivid color fill.
 */
export const OUTBREAK_OWNED_ICONS = [
  '☣️', // 0  biohazard
  '🦠', // 1  microbe
  '💉', // 2  syringe
  '🔬', // 3  microscope
  '⚗️', // 4  alembic
];

/** Deep saturated backgrounds for owned tiles — pairs with OUTBREAK_COLORS */
export const OUTBREAK_DARK = [
  '#7d1a1a', // 0
  '#1a4d25', // 1
  '#173a5e', // 2
  '#6b5a10', // 3
  '#4a1a6e', // 4
];

// ── World definitions ──────────────────────────────────────────────────────────

export const OUTBREAK_WORLDS = [
  {
    id: 1,
    name: 'Spore',
    tagline: 'First contact — learn the spread',
    color: '#51cf66',
    icon: '🦠',
  },
  { id: 2, name: 'Colony', tagline: 'Growing stronger — 4 strains', color: '#74c0fc', icon: '🧫' },
  {
    id: 3,
    name: 'Plague',
    tagline: 'Expert spread — 5 strains, tight moves',
    color: '#da77f2',
    icon: '⚗️',
  },
  {
    id: 4,
    name: 'Viral',
    tagline: 'Infinite infestation — 10×10 forever',
    color: '#ffd43b',
    icon: '🔬',
  },
];

// ── Frontier pre-computation ───────────────────────────────────────────────────
//
// Called on every tile set (initial grid + after every tap) so:
//   • Frontier tiles always show their group-size number
//   • The first render already has correct frontier state, no tap needed first

const F_DIRS: [number, number][] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

interface OBData extends Record<string, unknown> {
  colorIndex: number;
  owned: boolean;
  isNew: boolean;
  isFrontier?: boolean;
  groupSize?: number;
}

/** DFS flood-fill over unowned same-color tiles starting from (sx, sy). */
function dfsGroup(sx: number, sy: number, colorIndex: number, map: Map<string, Tile>): string[] {
  const visited = new Set<string>();
  const stack: string[] = [`${sx},${sy}`];
  const result: string[] = [];
  while (stack.length) {
    const key = stack.pop()!;
    if (visited.has(key)) continue;
    visited.add(key);
    const t = map.get(key);
    if (!t) continue;
    const d = t.displayData as OBData;
    if (d.owned || d.colorIndex !== colorIndex) continue;
    result.push(key);
    for (const [dx, dy] of F_DIRS) {
      const nk = `${t.x + dx},${t.y + dy}`;
      if (!visited.has(nk)) stack.push(nk);
    }
  }
  return result;
}

/**
 * Annotates every tile with `isFrontier` and `groupSize`:
 *   isFrontier  — tile is unowned AND directly adjacent to owned territory
 *   groupSize   — size of the connected same-color group this tile belongs to
 *                 (only set on tiles whose group touches the frontier)
 *
 * Re-run this after every tap to keep the data fresh.
 */
export function computeFrontierData(tiles: Tile[]): Tile[] {
  const map = new Map<string, Tile>(tiles.map((t) => [`${t.x},${t.y}`, t]));

  // 1. Identify every frontier tile (unowned, adjacent to at least one owned tile)
  const frontierSet = new Set<string>();
  for (const t of tiles) {
    const d = t.displayData as OBData;
    if (!d || d.owned) continue;
    for (const [dx, dy] of F_DIRS) {
      const nb = map.get(`${t.x + dx},${t.y + dy}`);
      if (nb && (nb.displayData as unknown as OBData)?.owned) {
        frontierSet.add(`${t.x},${t.y}`);
        break;
      }
    }
  }

  // 2. DFS each unique color-group that touches the frontier; record its size
  const groupSizeByKey = new Map<string, number>();
  const processed = new Set<string>();
  for (const startKey of frontierSet) {
    if (processed.has(startKey)) continue;
    const st = map.get(startKey)!;
    const group = dfsGroup(st.x, st.y, (st.displayData as unknown as OBData).colorIndex, map);
    for (const k of group) {
      groupSizeByKey.set(k, group.length);
      processed.add(k);
    }
  }

  // 3. Patch tile displayData (skip tiles that are already correct to avoid churn)
  return tiles.map((t) => {
    const d = t.displayData as OBData;
    if (!d) return t;

    // Clear stale frontier data from owned tiles
    if (d.owned) {
      if (d.isFrontier || d.groupSize != null)
        return { ...t, displayData: { ...d, isFrontier: false, groupSize: undefined } };
      return t;
    }

    const key = `${t.x},${t.y}`;
    const isFrontier = frontierSet.has(key);
    const groupSize = groupSizeByKey.get(key);

    if (d.isFrontier === isFrontier && d.groupSize === groupSize) return t;
    return { ...t, displayData: { ...d, isFrontier, groupSize } };
  });
}

// ── Grid generation ───────────────────────────────────────────────────────────

function makeTile(x: number, y: number, colorIndex: number): Tile {
  return {
    id: `ob-${x}-${y}`,
    type: 'path',
    x,
    y,
    connections: [],
    canRotate: true,
    isGoalNode: false,
    displayData: {
      colorIndex,
      owned: x === 0 && y === 0,
      isNew: false,
    } as unknown as OBData,
  };
}

function generateGrid(gridSize: number, numColors: number, seed: number): Tile[] {
  const rng = seededRandom(seed);
  const raw: Tile[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      raw.push(makeTile(x, y, Math.floor(rng() * numColors)));
    }
  }
  // Pre-compute frontier so the very first render shows group sizes
  return computeFrontierData(raw);
}

function makeLevel(
  id: number,
  world: number,
  name: string,
  gridSize: number,
  numColors: number,
  maxMoves: number,
  seed: number
): Level {
  return {
    id,
    name,
    world,
    gridSize,
    tiles: generateGrid(gridSize, numColors, seed),
    goalNodes: [],
    maxMoves,
    compressionDelay: 0,
    compressionEnabled: false,
    targetScore: (gridSize * gridSize - 1) * 10,
  };
}

// ── Level definitions ─────────────────────────────────────────────────────────

const DEFS: {
  world: number;
  gridSize: number;
  numColors: number;
  maxMoves: number;
  seed: number;
}[] = [
  // World 1 : Spore  (5×5, 3 colors, ~2× headroom)
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 18, seed: 0x1a2b3c4d },
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 17, seed: 0x2b3c4d5e },
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 16, seed: 0x3c4d5e6f },
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 15, seed: 0x4d5e6f7a },
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 15, seed: 0x5e6f7a8b },
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 14, seed: 0x6f7a8b9c },
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 14, seed: 0x7a8b9cad },
  { world: 1, gridSize: 5, numColors: 3, maxMoves: 13, seed: 0x8b9cadbe },

  // World 2 : Colony  (6×6, 4 colors, ~1.4× headroom)
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 22, seed: 0x9cadbe0f },
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 21, seed: 0xadbe0f1a },
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 20, seed: 0xbe0f1a2b },
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 19, seed: 0xcf102b3c },
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 18, seed: 0xd0213c4d },
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 18, seed: 0xe1324d5e },
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 17, seed: 0xf2435e6f },
  { world: 2, gridSize: 6, numColors: 4, maxMoves: 16, seed: 0x03546f7a },

  // World 3 : Plague  (7×7, 5 colors, ~1.2× headroom)
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 26, seed: 0x14657a8b },
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 25, seed: 0x25768b9c },
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 24, seed: 0x36879cad },
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 23, seed: 0x4798adbe },
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 22, seed: 0x58a9becf },
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 21, seed: 0x69bacfd0 },
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 21, seed: 0x7acbd0e1 },
  { world: 3, gridSize: 7, numColors: 5, maxMoves: 20, seed: 0x8bdce1f2 },
];

export const OUTBREAK_LEVELS: Level[] = [
  ...DEFS.map((d, i) =>
    makeLevel(501 + i, d.world, `Level ${i + 1}`, d.gridSize, d.numColors, d.maxMoves, d.seed)
  ),
  // ── Bonus levels — one per world, custom names, new seeds ──────────────────
  // World 1: Spore — tighter cluster, seed produces a trickier color split
  makeLevel(525, 1, 'Static Surge', 5, 3, 12, 0xdeadbeef),
  // World 2: Colony — 4 colors, move budget squeezed by one vs. the last W2 level
  makeLevel(526, 2, 'Colony Creep', 6, 4, 15, 0xcafebabe),
  // World 3: Plague — 5 colors on a 7×7, demands precise frontier reads
  makeLevel(527, 3, 'Viral Tide', 7, 5, 19, 0xf00dbabe),
];

// ── Infinite World 4 generator ────────────────────────────────────────────────

export function generateOutbreakLevel(index: number): Level {
  const seed = 0xdead0000 + index * 0x13370001;
  const maxMoves = Math.max(28, 38 - Math.floor(index / 5));
  return makeLevel(600 + index, 4, `Viral ${index + 1}`, 10, 5, maxMoves, seed);
}
