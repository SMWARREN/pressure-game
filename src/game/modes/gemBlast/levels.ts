// GEM BLAST MODE — Level Definitions
// 5 worlds × 4 levels (IDs 401–420)
// Gems: 💎💍🔮🟣🔵  Blast gem: 💥 (rare, 3-8% spawn in higher worlds)

import type { Level, Tile } from '../../types';

export const GEM_SYMBOLS = ['💎', '💍', '🔮', '🟣', '🔵'];
export const BLAST_GEM = '💥';

// ── Worlds ────────────────────────────────────────────────────────────────────

export const GEM_WORLDS = [
  { id: 1, name: 'Crystal Cave', tagline: 'Learn the cascade', color: '#06b6d4', icon: '💎' },
  {
    id: 2,
    name: 'Gemstone Valley',
    tagline: 'Blast gems detonate chains',
    color: '#8b5cf6',
    icon: '💍',
  },
  {
    id: 3,
    name: 'Jewel Throne',
    tagline: 'Tight budget, big chains',
    color: '#ec4899',
    icon: '🔮',
  },
  { id: 4, name: 'Diamond Peak', tagline: 'Race the clock', color: '#f59e0b', icon: '🟣' },
  {
    id: 5,
    name: 'Gem Rush',
    tagline: 'Massive grid, unlimited taps',
    color: '#10b981',
    icon: '🔵',
  },
];

// ── Seeded PRNG ───────────────────────────────────────────────────────────────

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

export function generateGrid(
  gridCols: number,
  symbols: string[],
  seed: number,
  blastChance = 0,
  gridRows?: number
): Tile[] {
  const rows = gridRows ?? gridCols;
  const rng = seededRandom(seed);
  const tiles: Tile[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < gridCols; x++) {
      let symbol: string;
      if (blastChance > 0 && rng() < blastChance) {
        symbol = BLAST_GEM;
      } else {
        symbol = symbols[Math.floor(rng() * symbols.length)];
      }
      tiles.push({
        id: `g${x}-${y}`,
        type: 'path',
        x,
        y,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        displayData: { symbol, activeSymbols: [...symbols] },
      });
    }
  }
  return tiles;
}

// ── Level configs ─────────────────────────────────────────────────────────────

interface GemLevelConfig {
  id: number;
  name: string;
  world: number;
  gridSize: number;
  gridCols?: number;
  gridRows?: number;
  targetScore: number;
  maxMoves: number;
  seed: number;
  blastChance?: number;
  timeLimit?: number;
  isUnlimited?: boolean;
  numColors?: number; // defaults to 5; fewer = more natural cascades in early worlds
}

const GEM_LEVEL_CONFIGS: GemLevelConfig[] = [
  // World 1: Crystal Cave — 5×6, 3 colors. Few colors = big groups + natural cascades.
  // Teaches cascade mechanics viscerally before blast gems appear.
  {
    id: 401,
    name: 'First Crystal',
    world: 1,
    gridSize: 6,
    gridCols: 5,
    gridRows: 6,
    targetScore: 5000,
    maxMoves: 22,
    seed: 4010,
    numColors: 3,
  },
  {
    id: 402,
    name: 'Sparkling Vein',
    world: 1,
    gridSize: 6,
    gridCols: 5,
    gridRows: 6,
    targetScore: 9000,
    maxMoves: 24,
    seed: 4020,
    numColors: 3,
  },
  {
    id: 403,
    name: 'Deep Glimmer',
    world: 1,
    gridSize: 6,
    gridCols: 5,
    gridRows: 6,
    targetScore: 14000,
    maxMoves: 26,
    seed: 4030,
    numColors: 3,
  },
  {
    id: 404,
    name: 'Cave Exit',
    world: 1,
    gridSize: 6,
    gridCols: 5,
    gridRows: 6,
    targetScore: 20000,
    maxMoves: 28,
    seed: 4040,
    numColors: 3,
  },

  // World 2: Gemstone Valley — 6×7, 4 colors, blast gems 3-5%.
  // Stepping stone: more colors require blast gems to trigger cascades.
  {
    id: 405,
    name: 'Valley Entrance',
    world: 2,
    gridSize: 7,
    gridCols: 6,
    gridRows: 7,
    targetScore: 12000,
    maxMoves: 28,
    seed: 4050,
    blastChance: 0.03,
    numColors: 4,
  },
  {
    id: 406,
    name: 'Gem Seam',
    world: 2,
    gridSize: 7,
    gridCols: 6,
    gridRows: 7,
    targetScore: 18000,
    maxMoves: 28,
    seed: 4060,
    blastChance: 0.04,
    numColors: 4,
  },
  {
    id: 407,
    name: 'Facet Field',
    world: 2,
    gridSize: 7,
    gridCols: 6,
    gridRows: 7,
    targetScore: 26000,
    maxMoves: 30,
    seed: 4070,
    blastChance: 0.04,
    numColors: 4,
  },
  {
    id: 408,
    name: 'Blast Basin',
    world: 2,
    gridSize: 7,
    gridCols: 6,
    gridRows: 7,
    targetScore: 36000,
    maxMoves: 32,
    seed: 4080,
    blastChance: 0.05,
    numColors: 4,
  },

  // World 3: Jewel Throne — 7×9, 5 colors, timed 90–70s. Score before time runs out.
  {
    id: 409,
    name: 'Throne Approach',
    world: 3,
    gridSize: 9,
    gridCols: 7,
    gridRows: 9,
    targetScore: 20000,
    maxMoves: 999,
    seed: 4090,
    blastChance: 0.04,
    timeLimit: 90,
  },
  {
    id: 410,
    name: 'Royal Chamber',
    world: 3,
    gridSize: 9,
    gridCols: 7,
    gridRows: 9,
    targetScore: 32000,
    maxMoves: 999,
    seed: 4100,
    blastChance: 0.05,
    timeLimit: 80,
  },
  {
    id: 411,
    name: 'Crown Jewels',
    world: 3,
    gridSize: 9,
    gridCols: 7,
    gridRows: 9,
    targetScore: 48000,
    maxMoves: 999,
    seed: 4110,
    blastChance: 0.05,
    timeLimit: 75,
  },
  {
    id: 412,
    name: 'The Vault',
    world: 3,
    gridSize: 9,
    gridCols: 7,
    gridRows: 9,
    targetScore: 65000,
    maxMoves: 999,
    seed: 4120,
    blastChance: 0.06,
    timeLimit: 70,
  },

  // World 4: Diamond Peak — 8×10, tighter time, blast gems more common.
  {
    id: 413,
    name: 'Mountain Base',
    world: 4,
    gridSize: 10,
    gridCols: 8,
    gridRows: 10,
    targetScore: 35000,
    maxMoves: 999,
    seed: 4130,
    blastChance: 0.06,
    timeLimit: 80,
  },
  {
    id: 414,
    name: 'Icy Ledge',
    world: 4,
    gridSize: 10,
    gridCols: 8,
    gridRows: 10,
    targetScore: 55000,
    maxMoves: 999,
    seed: 4140,
    blastChance: 0.06,
    timeLimit: 70,
  },
  {
    id: 415,
    name: 'Summit Storm',
    world: 4,
    gridSize: 10,
    gridCols: 8,
    gridRows: 10,
    targetScore: 80000,
    maxMoves: 999,
    seed: 4150,
    blastChance: 0.07,
    timeLimit: 60,
  },
  {
    id: 416,
    name: 'Diamond Tip',
    world: 4,
    gridSize: 10,
    gridCols: 8,
    gridRows: 10,
    targetScore: 110000,
    maxMoves: 999,
    seed: 4160,
    blastChance: 0.07,
    timeLimit: 55,
  },

  // World 5: Gem Rush — 10×12. Three unlimited warm-ups + one fixed final boss.
  {
    id: 417,
    name: 'Avalanche',
    world: 5,
    gridSize: 12,
    gridCols: 10,
    gridRows: 12,
    targetScore: 99999,
    maxMoves: 999,
    seed: 4170,
    blastChance: 0.05,
    timeLimit: 40,
    isUnlimited: true,
  },
  {
    id: 418,
    name: 'Cascade Falls',
    world: 5,
    gridSize: 12,
    gridCols: 10,
    gridRows: 12,
    targetScore: 99999,
    maxMoves: 999,
    seed: 4180,
    blastChance: 0.06,
    timeLimit: 30,
    isUnlimited: true,
  },
  {
    id: 419,
    name: 'Gem Torrent',
    world: 5,
    gridSize: 12,
    gridCols: 10,
    gridRows: 12,
    targetScore: 99999,
    maxMoves: 999,
    seed: 4190,
    blastChance: 0.07,
    timeLimit: 20,
    isUnlimited: true,
  },
  // The final boss — fixed level, NOT unlimited. Requires mastering cascades + blast gems.
  {
    id: 420,
    name: 'Diamond Rain',
    world: 5,
    gridSize: 12,
    gridCols: 10,
    gridRows: 12,
    targetScore: 150000,
    maxMoves: 999,
    seed: 4200,
    blastChance: 0.09,
    timeLimit: 120,
  },
];

export const GEM_LEVELS: Level[] = GEM_LEVEL_CONFIGS.map((cfg) => ({
  id: cfg.id,
  name: cfg.name,
  world: cfg.world,
  gridSize: cfg.gridSize,
  gridCols: cfg.gridCols,
  gridRows: cfg.gridRows,
  tiles: generateGrid(
    cfg.gridCols ?? cfg.gridSize,
    GEM_SYMBOLS.slice(0, cfg.numColors ?? 5),
    cfg.seed,
    cfg.blastChance ?? 0,
    cfg.gridRows
  ),
  goalNodes: [],
  maxMoves: cfg.maxMoves,
  compressionDelay: 999999,
  compressionEnabled: false,
  targetScore: cfg.targetScore,
  timeLimit: cfg.timeLimit,
  isUnlimited: cfg.isUnlimited,
}));
