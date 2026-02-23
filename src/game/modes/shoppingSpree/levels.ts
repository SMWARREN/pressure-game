// SHOPPING SPREE MODE — Levels
// Match items to earn money and reach your shopping goal!

import { Level, Tile } from '../../types';

// ── Shopping item symbols with values ─────────────────────────────────────────

export const SHOPPING_ITEMS = ['👗', '👠', '👜', '💄', '💎'] as const;

// Each item has a different dollar value
export const ITEM_VALUES: Record<string, number> = {
  '👗': 15, // Dress
  '👠': 20, // Heels
  '👜': 25, // Handbag
  '💄': 10, // Lipstick
  '💎': 50, // Diamond (rare, high value)
};

// ── Seeded random for reproducible grids ──────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrid(gridSize: number, symbols: readonly string[], seed: number): Tile[] {
  const rng = seededRandom(seed);
  const tiles: Tile[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // 💎 is rare (10% chance), other items are more common
      let symbol: string;
      if (rng() < 0.1) {
        symbol = '💎';
      } else {
        const commonSymbols = symbols.filter((s) => s !== '💎');
        symbol = commonSymbols[Math.floor(rng() * commonSymbols.length)];
      }
      tiles.push({
        id: `s${x}-${y}`,
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

// ── Worlds ────────────────────────────────────────────────────────────────────

export const SHOPPING_WORLDS = [
  {
    id: 1,
    name: 'Boutique',
    tagline: 'Start your shopping journey',
    color: '#ec4899',
    icon: '🛍️',
  },
  {
    id: 2,
    name: 'Mall',
    tagline: 'Bigger stores, bigger goals',
    color: '#a855f7',
    icon: '🏬',
  },
  {
    id: 3,
    name: 'Luxury',
    tagline: 'High-end fashion awaits',
    color: '#f59e0b',
    icon: '👑',
  },
];

// ── Levels ────────────────────────────────────────────────────────────────────

export const SHOPPING_LEVELS: Level[] = [
  // World 1: Boutique (easier levels)
  {
    id: 301,
    name: 'Window Shopping',
    world: 1,
    gridSize: 5,
    tiles: makeGrid(5, SHOPPING_ITEMS, 301),
    goalNodes: [],
    maxMoves: 20,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 300,
  },
  {
    id: 302,
    name: 'First Purchase',
    world: 1,
    gridSize: 5,
    tiles: makeGrid(5, SHOPPING_ITEMS, 302),
    goalNodes: [],
    maxMoves: 18,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 400,
  },
  {
    id: 303,
    name: 'Sale Alert',
    world: 1,
    gridSize: 6,
    tiles: makeGrid(6, SHOPPING_ITEMS, 303),
    goalNodes: [],
    maxMoves: 22,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 500,
  },
  {
    id: 304,
    name: 'Fashion Find',
    world: 1,
    gridSize: 6,
    tiles: makeGrid(6, SHOPPING_ITEMS, 304),
    goalNodes: [],
    maxMoves: 20,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 600,
  },

  // World 2: Mall (medium difficulty)
  {
    id: 305,
    name: 'Mall Entrance',
    world: 2,
    gridSize: 6,
    tiles: makeGrid(6, SHOPPING_ITEMS, 305),
    goalNodes: [],
    maxMoves: 25,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 800,
  },
  {
    id: 306,
    name: 'Shoe Store',
    world: 2,
    gridSize: 7,
    tiles: makeGrid(7, SHOPPING_ITEMS, 306),
    goalNodes: [],
    maxMoves: 25,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 1000,
  },
  {
    id: 307,
    name: 'Accessory Shop',
    world: 2,
    gridSize: 7,
    tiles: makeGrid(7, SHOPPING_ITEMS, 307),
    goalNodes: [],
    maxMoves: 22,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 900,
  },
  {
    id: 308,
    name: 'Food Court Break',
    world: 2,
    gridSize: 7,
    tiles: makeGrid(7, SHOPPING_ITEMS, 308),
    goalNodes: [],
    maxMoves: 28,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 1200,
  },

  // World 3: Luxury (hard levels)
  {
    id: 309,
    name: 'VIP Section',
    world: 3,
    gridSize: 7,
    tiles: makeGrid(7, SHOPPING_ITEMS, 309),
    goalNodes: [],
    maxMoves: 25,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 1500,
  },
  {
    id: 310,
    name: 'Designer Boutique',
    world: 3,
    gridSize: 8,
    tiles: makeGrid(8, SHOPPING_ITEMS, 310),
    goalNodes: [],
    maxMoves: 30,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 2000,
  },
  {
    id: 311,
    name: 'Diamond Gallery',
    world: 3,
    gridSize: 8,
    tiles: makeGrid(8, SHOPPING_ITEMS, 311),
    goalNodes: [],
    maxMoves: 28,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 2500,
  },
  {
    id: 312,
    name: 'Shopping Spree!',
    world: 3,
    gridSize: 8,
    tiles: makeGrid(8, SHOPPING_ITEMS, 312),
    goalNodes: [],
    maxMoves: 35,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: 3000,
  },
];
