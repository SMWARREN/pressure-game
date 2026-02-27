// CANDY MODE — Level Definitions
// Levels are procedurally generated from a seed, so every play starts the same
// but refills are random (like real Candy Crush).

import { Level, Tile } from '../../types';

export const CANDY_SYMBOLS = ['🍎', '🍊', '🍋', '🫐', '🍓'];

export const CANDY_WORLDS = [
  { id: 1, name: 'Sweet', tagline: 'Match & clear groups', color: '#f472b6', icon: '🍬' },
  { id: 2, name: 'Sour', tagline: 'Bigger combos needed', color: '#a78bfa', icon: '🍭' },
  { id: 3, name: 'Spicy', tagline: 'Expert color juggling', color: '#f97316', icon: '🍫' },
  {
    id: 4,
    name: 'Frozen',
    tagline: 'Race the clock — tiles freeze as time runs out',
    color: '#60a5fa',
    icon: '❄️',
  },
  {
    id: 5,
    name: 'Unlimited',
    tagline: 'Big combos unfreeze tiles & add time!',
    color: '#22c55e',
    icon: '♾️',
  },
  {
    id: 6,
    name: 'Tropical',
    tagline: 'Wildcards, bombs & combo chaos!',
    color: '#f59e0b',
    icon: '🌴',
  },
];

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────

export function seededRandom(seed: number): () => number {
  let s = seed;
  return (): number => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Grid generation ───────────────────────────────────────────────────────────

function makeTile(x: number, y: number, symbol: string, activeSymbols: string[]): Tile {
  return {
    id: `c${x}-${y}`,
    type: 'path',
    x,
    y,
    connections: [],
    canRotate: true,
    isGoalNode: false,
    displayData: { symbol, activeSymbols },
  };
}

function generateGrid(
  gridCols: number,
  numSymbols: number,
  seed: number,
  gridRows?: number
): Tile[] {
  const rows = gridRows ?? gridCols;
  const rng = seededRandom(seed);
  const activeSymbols = CANDY_SYMBOLS.slice(0, numSymbols);
  const tiles: Tile[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < gridCols; x++) {
      const symbol = activeSymbols[Math.floor(rng() * numSymbols)];
      tiles.push(makeTile(x, y, symbol, activeSymbols));
    }
  }
  return tiles;
}

// ── Level configs ─────────────────────────────────────────────────────────────

interface CandyLevelConfig {
  id: number;
  name: string;
  world: number;
  gridSize: number;
  numSymbols: number;
  targetScore: number;
  maxMoves: number;
  seed: number;
  timeLimit?: number;
  isUnlimited?: boolean;
  features?: {
    wildcards?: boolean;
    bombs?: boolean;
    comboChain?: boolean;
    rain?: boolean;
    ice?: boolean;
  };
  gridCols?: number;
  gridRows?: number;
}

const LEVEL_CONFIGS: CandyLevelConfig[] = [
  // World 1: Sweet — 5×5 grid, 3 colors, learn the mechanic
  {
    id: 101,
    name: 'Cherry Drop',
    world: 1,
    gridSize: 5,
    numSymbols: 3,
    targetScore: 150,
    maxMoves: 12,
    seed: 42,
  },
  {
    id: 102,
    name: 'Sugar Snap',
    world: 1,
    gridSize: 5,
    numSymbols: 3,
    targetScore: 200,
    maxMoves: 12,
    seed: 73,
  },
  {
    id: 103,
    name: 'Gummy Star',
    world: 1,
    gridSize: 5,
    numSymbols: 4,
    targetScore: 220,
    maxMoves: 15,
    seed: 99,
  },
  // Bonus World 1 level — tight budget, cluster hunting
  {
    id: 116,
    name: 'Jelly Roll',
    world: 1,
    gridSize: 5,
    numSymbols: 3,
    targetScore: 180,
    maxMoves: 10,
    seed: 11111,
  },
  // World 2: Sour — 6×6 grid, 4-5 colors, need deliberate group targeting
  {
    id: 104,
    name: 'Lemon Twist',
    world: 2,
    gridSize: 6,
    numSymbols: 4,
    targetScore: 350,
    maxMoves: 18,
    seed: 123,
  },
  {
    id: 105,
    name: 'Bitter Drop',
    world: 2,
    gridSize: 6,
    numSymbols: 4,
    targetScore: 450,
    maxMoves: 18,
    seed: 456,
  },
  {
    id: 106,
    name: 'Sour Spiral',
    world: 2,
    gridSize: 6,
    numSymbols: 5,
    targetScore: 400,
    maxMoves: 22,
    seed: 789,
  },
  // Bonus World 2 level — 5-color chaos, requires deliberate sweeps
  {
    id: 117,
    name: 'Violet Swirl',
    world: 2,
    gridSize: 6,
    numSymbols: 4,
    targetScore: 480,
    maxMoves: 20,
    seed: 55555,
  },
  // World 3: Spicy — 6×6 grid, 5 colors, tight budgets, chain planning required
  {
    id: 107,
    name: 'Chili Crunch',
    world: 3,
    gridSize: 6,
    numSymbols: 5,
    targetScore: 550,
    maxMoves: 22,
    seed: 1337,
  },
  {
    id: 108,
    name: 'Fire Storm',
    world: 3,
    gridSize: 6,
    numSymbols: 5,
    targetScore: 700,
    maxMoves: 25,
    seed: 2023,
  },
  {
    id: 109,
    name: 'Inferno',
    world: 3,
    gridSize: 6,
    numSymbols: 5,
    targetScore: 850,
    maxMoves: 28,
    seed: 9999,
  },
  // Bonus World 3 level — high target, 5 colors, demands chain planning
  {
    id: 118,
    name: 'Ember Burst',
    world: 3,
    gridSize: 6,
    numSymbols: 5,
    targetScore: 750,
    maxMoves: 24,
    seed: 12345,
  },
  // World 4: Frozen — 7×7 grid, 5 colors, race the clock; tiles freeze in the last 15 seconds
  {
    id: 110,
    name: 'First Frost',
    world: 4,
    gridSize: 7,
    numSymbols: 5,
    targetScore: 1200,
    maxMoves: 999,
    seed: 3141,
    timeLimit: 60,
  },
  {
    id: 111,
    name: 'Deep Freeze',
    world: 4,
    gridSize: 7,
    numSymbols: 5,
    targetScore: 1500,
    maxMoves: 999,
    seed: 2718,
    timeLimit: 50,
  },
  {
    id: 112,
    name: 'Absolute Zero',
    world: 4,
    gridSize: 7,
    numSymbols: 5,
    targetScore: 1800,
    maxMoves: 999,
    seed: 1618,
    timeLimit: 45,
  },
  // Bonus World 4 level — between Deep Freeze and Absolute Zero in severity
  {
    id: 119,
    name: 'Ice Veil',
    world: 4,
    gridSize: 7,
    numSymbols: 5,
    targetScore: 1650,
    maxMoves: 999,
    seed: 5432,
    timeLimit: 48,
  },
  // World 5: Unlimited — Combos add time! Survive as long as you can!
  // Ordered from easiest to hardest - time limits get tighter!
  // Level 113: PEACEFUL MODE! No ice cubes, just pure combo fun!
  {
    id: 113,
    name: 'Peaceful Candy',
    world: 5,
    gridSize: 10,
    numSymbols: 5,
    targetScore: 99999,
    maxMoves: 999,
    seed: 7777,
    timeLimit: 25, // Still generous but not too easy
    isUnlimited: true,
    features: { wildcards: true },
  },
  // Levels 114-115: Ice cubes appear - big combos unfreeze them!
  {
    id: 114,
    name: 'Endless Candy',
    world: 5,
    gridSize: 10,
    numSymbols: 5,
    targetScore: 99999,
    maxMoves: 999,
    seed: 8888,
    timeLimit: 18, // Reduced from 20
    isUnlimited: true,
    features: { wildcards: true, bombs: true },
  },
  {
    id: 115,
    name: 'Sugar Rush',
    world: 5,
    gridSize: 10,
    numSymbols: 5,
    targetScore: 99999,
    maxMoves: 999,
    seed: 9999,
    timeLimit: 12, // Reduced from 15 - now challenging!
    isUnlimited: true,
    features: { wildcards: true, bombs: true, comboChain: true },
  },
  // ── World 6: Tropical — wildcards, bombs, combo chains & rain chaos ─────────
  {
    id: 121,
    name: 'Island Welcome',
    world: 6,
    gridSize: 8,
    gridCols: 7,
    gridRows: 9,
    numSymbols: 5,
    targetScore: 5500,
    maxMoves: 30,
    seed: 1210,
    features: { wildcards: true, ice: true },
  },
  {
    id: 122,
    name: 'Coconut Drop',
    world: 6,
    gridSize: 9,
    gridCols: 8,
    gridRows: 10,
    numSymbols: 5,
    targetScore: 10000,
    maxMoves: 28,
    seed: 1220,
    features: { wildcards: true, bombs: true, ice: true },
  },
  {
    id: 123,
    name: 'Storm Season',
    world: 6,
    gridSize: 10,
    gridCols: 9,
    gridRows: 11,
    numSymbols: 5,
    targetScore: 17000,
    maxMoves: 26,
    seed: 1230,
    features: { wildcards: true, bombs: true, comboChain: true, ice: true },
  },
  {
    id: 124,
    name: 'Tropical Chaos',
    world: 6,
    gridSize: 12,
    gridCols: 10,
    gridRows: 12,
    numSymbols: 5,
    targetScore: 28000,
    maxMoves: 24,
    seed: 1240,
    features: { wildcards: true, bombs: true, comboChain: true, rain: true, ice: true },
  },
  // Bonus World 5 level — hardest unlimited level!
  {
    id: 120,
    name: 'Storm Surge',
    world: 5,
    gridSize: 10,
    numSymbols: 5,
    targetScore: 99999,
    maxMoves: 999,
    seed: 6543,
    timeLimit: 8, // Reduced from 12 - extreme challenge!
    isUnlimited: true,
    features: { wildcards: true, bombs: true, comboChain: true, rain: true },
  },
];

export const CANDY_LEVELS: Level[] = LEVEL_CONFIGS.map((cfg) => ({
  id: cfg.id,
  name: cfg.name,
  world: cfg.world,
  gridSize: cfg.gridSize,
  gridCols: cfg.gridCols,
  gridRows: cfg.gridRows,
  tiles: generateGrid(cfg.gridCols ?? cfg.gridSize, cfg.numSymbols, cfg.seed, cfg.gridRows),
  goalNodes: [],
  maxMoves: cfg.maxMoves,
  compressionDelay: 999999,
  compressionEnabled: false,
  targetScore: cfg.targetScore,
  timeLimit: cfg.timeLimit,
  isUnlimited: cfg.isUnlimited,
  features: cfg.features,
}));
