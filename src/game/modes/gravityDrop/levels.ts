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
import { seededRandom } from '../seedUtils';

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
      const value = special === 'none' ? Math.floor(rng() * 6) + 1 : 0;
      tiles.push(makeNumberTile(x, y, value, false, special));
    }
  }
  return tiles;
}

interface MakeLevelParams {
  readonly id: number;
  readonly name: string;
  readonly world: number;
  readonly gridSize: number;
  readonly maxMoves: number;
  readonly targetScore: number;
  readonly seed: number;
  readonly density?: number;
}

function makeLevel({
  id,
  name,
  world,
  gridSize,
  maxMoves,
  targetScore,
  seed,
  density = 0.55,
}: MakeLevelParams): Level {
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
  makeLevel({
    id: 601,
    name: 'First Drop',
    world: 1,
    gridSize: 5,
    maxMoves: 20,
    targetScore: 200,
    seed: 6001,
    density: 0.5,
  }),
  makeLevel({
    id: 602,
    name: 'Chain Basics',
    world: 1,
    gridSize: 5,
    maxMoves: 18,
    targetScore: 300,
    seed: 6002,
    density: 0.5,
  }),
  makeLevel({
    id: 603,
    name: 'Stack Attack',
    world: 1,
    gridSize: 5,
    maxMoves: 16,
    targetScore: 400,
    seed: 6003,
    density: 0.55,
  }),
  makeLevel({
    id: 604,
    name: 'Combo Rising',
    world: 1,
    gridSize: 5,
    maxMoves: 16,
    targetScore: 500,
    seed: 6004,
    density: 0.55,
  }),
  makeLevel({
    id: 605,
    name: 'Freefall Pro',
    world: 1,
    gridSize: 5,
    maxMoves: 14,
    targetScore: 600,
    seed: 6005,
    density: 0.6,
  }),

  // World 2 — Cascade (6×6)
  makeLevel({
    id: 611,
    name: 'Wide Open',
    world: 2,
    gridSize: 6,
    maxMoves: 28,
    targetScore: 600,
    seed: 6011,
    density: 0.5,
  }),
  makeLevel({
    id: 612,
    name: 'Current Pull',
    world: 2,
    gridSize: 6,
    maxMoves: 26,
    targetScore: 800,
    seed: 6012,
    density: 0.55,
  }),
  makeLevel({
    id: 613,
    name: 'Deep Cascade',
    world: 2,
    gridSize: 6,
    maxMoves: 24,
    targetScore: 1000,
    seed: 6013,
    density: 0.55,
  }),
  makeLevel({
    id: 614,
    name: 'Undercurrent',
    world: 2,
    gridSize: 6,
    maxMoves: 22,
    targetScore: 1200,
    seed: 6014,
    density: 0.6,
  }),
  makeLevel({
    id: 615,
    name: 'The Waterfall',
    world: 2,
    gridSize: 6,
    maxMoves: 20,
    targetScore: 1400,
    seed: 6015,
    density: 0.6,
  }),

  // World 3 — Abyss (7×7)
  makeLevel({
    id: 621,
    name: 'Descending',
    world: 3,
    gridSize: 7,
    maxMoves: 36,
    targetScore: 1200,
    seed: 6021,
    density: 0.5,
  }),
  makeLevel({
    id: 622,
    name: 'Dark Matter',
    world: 3,
    gridSize: 7,
    maxMoves: 34,
    targetScore: 1500,
    seed: 6022,
    density: 0.55,
  }),
  makeLevel({
    id: 623,
    name: 'Void Walker',
    world: 3,
    gridSize: 7,
    maxMoves: 32,
    targetScore: 1800,
    seed: 6023,
    density: 0.55,
  }),
  makeLevel({
    id: 624,
    name: 'Event Horizon',
    world: 3,
    gridSize: 7,
    maxMoves: 30,
    targetScore: 2100,
    seed: 6024,
    density: 0.6,
  }),
  makeLevel({
    id: 625,
    name: 'Singularity',
    world: 3,
    gridSize: 7,
    maxMoves: 28,
    targetScore: 2500,
    seed: 6025,
    density: 0.65,
  }),

  // ── Bonus levels — one per world, pushing the upper limit of each tier ────
  // World 1: Freefall — densest 5×5, fewest moves, highest score target
  makeLevel({
    id: 606,
    name: 'Turbo Drop',
    world: 1,
    gridSize: 5,
    maxMoves: 12,
    targetScore: 700,
    seed: 6006,
    density: 0.65,
  }),
  // World 2: Cascade — 6×6, one move below The Waterfall, more score pressure
  makeLevel({
    id: 616,
    name: 'Rapid Cascade',
    world: 2,
    gridSize: 6,
    maxMoves: 18,
    targetScore: 1600,
    seed: 6016,
    density: 0.65,
  }),
  // World 3: Abyss — 7×7 filled to the brim, chain or perish
  makeLevel({
    id: 626,
    name: 'Black Hole',
    world: 3,
    gridSize: 7,
    maxMoves: 25,
    targetScore: 3000,
    seed: 6026,
    density: 0.72,
  }),
];
