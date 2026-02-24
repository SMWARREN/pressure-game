// GRAVITY DROP MODE — Level Definitions
//
// Tiles bearing numbers 1–6 fall from the top each turn.
// Tap a tile to start a chain; tap adjacent tiles to add their values.
// Commit a chain that sums to exactly TARGET (10 by default) to clear those tiles.
// Gravity refills the column from the top.
//
// Special tiles:
//   💣  Bomb    — clears its whole column instantly (but wastes a move)
//   ⭐  Star    — wildcard, counts as any value needed to reach target
//   🔒  Lock    — immovable; must be cleared by a chain passing through it
//
// Win:  clear enough tiles to reach targetScore.
// Lose: board fills to the top (any column has a tile at y=0 when a new row drops).

import { Level, Tile } from '../../types';

export const GRAVITY_WORLDS = [
  { id: 1, name: 'Freefall', tagline: 'Learn to chain numbers', color: '#38bdf8', icon: '🔢' },
  {
    id: 2,
    name: 'Cascade',
    tagline: 'Bigger grids, tighter margins',
    color: '#818cf8',
    icon: '🌊',
  },
  { id: 3, name: 'Abyss', tagline: 'Chain or be swallowed', color: '#f472b6', icon: '🌑' },
];

export const GRAVITY_TARGET = 10; // chains must sum to exactly this

// ── Seeded PRNG ──────────────────────────────────────────────────────────────
export function seededRandom(seed: number): () => number {
  let s = seed;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GravityTileData extends Record<string, unknown> {
  value: number; // 1–6, or special: -1=bomb, 0=star
  inChain: boolean; // currently selected in active chain
  chainIndex: number; // position in chain (for display)
  chainSum: number; // running sum up to this tile
  locked: boolean; // lock tile — must pass through
  isNew: boolean; // drop animation
  special: 'none' | 'bomb' | 'star' | 'lock';
}

export function makeNumberTile(
  x: number,
  y: number,
  value: number,
  isNew = false,
  special: GravityTileData['special'] = 'none'
): Tile {
  return {
    id: `g${x}-${y}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'path',
    x,
    y,
    connections: [],
    canRotate: true,
    isGoalNode: false,
    displayData: {
      value,
      inChain: false,
      chainIndex: -1,
      chainSum: 0,
      locked: special === 'lock',
      isNew,
      special,
    } as GravityTileData,
  };
}

const NUM_SYMBOLS = ['①', '②', '③', '④', '⑤', '⑥'];
export function valueToSymbol(v: number, special: GravityTileData['special']): string {
  if (special === 'bomb') return '💣';
  if (special === 'star') return '⭐';
  if (special === 'lock') return '🔒';
  return NUM_SYMBOLS[v - 1] ?? String(v);
}

// Generate a seeded starting grid (bottom half filled)
function generateGrid(gridSize: number, seed: number, density = 0.6): Tile[] {
  const rng = seededRandom(seed);
  const tiles: Tile[] = [];
  const startY = Math.floor(gridSize * (1 - density));

  for (let y = startY; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const r = rng();
      let special: GravityTileData['special'] = 'none';
      if (r < 0.04) special = 'bomb';
      else if (r < 0.08) special = 'star';
      const value = special !== 'none' ? 0 : Math.floor(rng() * 6) + 1;
      tiles.push(makeNumberTile(x, y, value, false, special));
    }
  }
  return tiles;
}

function makeLevel(
  id: number,
  name: string,
  world: number,
  gridSize: number,
  maxMoves: number,
  targetScore: number,
  seed: number,
  density = 0.55
): Level {
  return {
    id,
    name,
    world,
    gridSize,
    tiles: generateGrid(gridSize, seed, density),
    goalNodes: [],
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore,
  };
}

export const GRAVITY_LEVELS: Level[] = [
  // World 1 — Freefall (5×5)
  makeLevel(601, 'First Drop', 1, 5, 20, 200, 6001, 0.5),
  makeLevel(602, 'Chain Basics', 1, 5, 18, 300, 6002, 0.5),
  makeLevel(603, 'Stack Attack', 1, 5, 16, 400, 6003, 0.55),
  makeLevel(604, 'Combo Rising', 1, 5, 16, 500, 6004, 0.55),
  makeLevel(605, 'Freefall Pro', 1, 5, 14, 600, 6005, 0.6),

  // World 2 — Cascade (6×6)
  makeLevel(611, 'Wide Open', 2, 6, 28, 600, 6011, 0.5),
  makeLevel(612, 'Current Pull', 2, 6, 26, 800, 6012, 0.55),
  makeLevel(613, 'Deep Cascade', 2, 6, 24, 1000, 6013, 0.55),
  makeLevel(614, 'Undercurrent', 2, 6, 22, 1200, 6014, 0.6),
  makeLevel(615, 'The Waterfall', 2, 6, 20, 1400, 6015, 0.6),

  // World 3 — Abyss (7×7)
  makeLevel(621, 'Descending', 3, 7, 36, 1200, 6021, 0.5),
  makeLevel(622, 'Dark Matter', 3, 7, 34, 1500, 6022, 0.55),
  makeLevel(623, 'Void Walker', 3, 7, 32, 1800, 6023, 0.55),
  makeLevel(624, 'Event Horizon', 3, 7, 30, 2100, 6024, 0.6),
  makeLevel(625, 'Singularity', 3, 7, 28, 2500, 6025, 0.65),

  // ── Bonus levels — one per world, pushing the upper limit of each tier ────
  // World 1: Freefall — densest 5×5, fewest moves, highest score target
  makeLevel(606, 'Turbo Drop', 1, 5, 12, 700, 6006, 0.65),
  // World 2: Cascade — 6×6, one move below The Waterfall, more score pressure
  makeLevel(616, 'Rapid Cascade', 2, 6, 18, 1600, 6016, 0.65),
  // World 3: Abyss — 7×7 filled to the brim, chain or perish
  makeLevel(626, 'Black Hole', 3, 7, 25, 3000, 6026, 0.72),
];
