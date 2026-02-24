// MEMORY MATCH MODE — Level Definitions
//
// Levels are grids of face-down tiles. Each tile has a hidden symbol.
// Symbols appear in matched pairs. Tap to flip; match pairs to lock them in.
// Win when all pairs are matched within the move limit.

import { Level, Tile } from '../../types';

export const MEMORY_WORLDS = [
  {
    id: 1,
    name: 'Recall',
    tagline: 'Basic pairs — train your memory',
    color: '#818cf8',
    icon: '🧠',
  },
  {
    id: 2,
    name: 'Sharp',
    tagline: 'Bigger grids, faster recall needed',
    color: '#34d399',
    icon: '⚡',
  },
  {
    id: 3,
    name: 'Genius',
    tagline: 'Expert grids — one wrong flip hurts hard',
    color: '#f472b6',
    icon: '💡',
  },
];

// Symbol sets per world
const WORLD_1_SYMBOLS = ['🌟', '🎵', '🎯', '🌈', '🔥', '💎', '🍀', '🎪'];
const WORLD_2_SYMBOLS = ['🦋', '🌺', '🦁', '🐬', '🌙', '⚡', '🎸', '🏆', '🌊', '🦄', '🎭', '🍄'];
const WORLD_3_SYMBOLS = [
  '🔮',
  '🎲',
  '🧩',
  '🌋',
  '🦅',
  '💫',
  '🎪',
  '🌠',
  '🦊',
  '🎯',
  '💡',
  '🌍',
  '🎨',
  '🏔️',
  '🦋',
  '🌺',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface MemoryTileData extends Record<string, unknown> {
  symbol: string; // The hidden emoji
  flipped: boolean; // Currently showing face-up (during peek)
  matched: boolean; // Permanently revealed (pair found)
  isNew: boolean; // Animation flag
  pairId: string; // Groups the two tiles of a pair together
}

function makeMemoryGrid(gridSize: number, symbols: string[], seed: number): Tile[] {
  const rng = seededRandom(seed);
  const numPairs = (gridSize * gridSize) / 2;

  // Pick symbols for this grid
  const chosen = shuffle(symbols, rng).slice(0, numPairs);

  // Each symbol appears exactly twice
  const symbolList = shuffle([...chosen, ...chosen], rng);

  const tiles: Tile[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const idx = y * gridSize + x;
      const symbol = symbolList[idx];
      const data: MemoryTileData = {
        symbol,
        flipped: false,
        matched: false,
        isNew: false,
        pairId: symbol + (chosen.indexOf(symbol) >= 0 ? '-A' : '-B'),
      };
      // Use actual pairId based on position
      // Count how many of this symbol we've already placed
      const alreadyPlaced = tiles.filter(
        (t) => (t.displayData as MemoryTileData)?.symbol === symbol
      ).length;
      data.pairId = `${symbol}-${alreadyPlaced === 0 ? 'A' : 'B'}`;

      tiles.push({
        id: `m${x}-${y}`,
        type: 'path',
        x,
        y,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        displayData: data,
      });
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
  symbols: string[],
  seed: number
): Level {
  return {
    id,
    name,
    world,
    gridSize,
    tiles: makeMemoryGrid(gridSize, symbols, seed),
    goalNodes: [],
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore: ((gridSize * gridSize) / 2) * 100, // 100 pts per pair
  };
}

export const MEMORY_LEVELS: Level[] = [
  // World 1 – Recall (4×4, 8 pairs)
  makeLevel(501, 'First Glance', 1, 4, 18, WORLD_1_SYMBOLS, 1001),
  makeLevel(502, 'Double Take', 1, 4, 16, WORLD_1_SYMBOLS, 1002),
  makeLevel(503, 'Focus', 1, 4, 14, WORLD_1_SYMBOLS, 1003),
  makeLevel(504, 'Sharp Eyes', 1, 4, 13, WORLD_1_SYMBOLS, 1004),
  makeLevel(505, 'Photographic', 1, 4, 12, WORLD_1_SYMBOLS, 1005),

  // World 2 – Sharp (6×6, 18 pairs)
  makeLevel(511, 'Grid Walker', 2, 6, 40, WORLD_2_SYMBOLS, 2001),
  makeLevel(512, 'Pattern Seeker', 2, 6, 36, WORLD_2_SYMBOLS, 2002),
  makeLevel(513, 'Quick Scan', 2, 6, 32, WORLD_2_SYMBOLS, 2003),
  makeLevel(514, 'Memory Lane', 2, 6, 30, WORLD_2_SYMBOLS, 2004),
  makeLevel(515, 'Recall Pro', 2, 6, 28, WORLD_2_SYMBOLS, 2005),

  // World 3 – Genius (8×8, 32 pairs)
  makeLevel(521, 'The Vault', 3, 8, 72, WORLD_3_SYMBOLS, 3001),
  makeLevel(522, 'Mind Palace', 3, 8, 68, WORLD_3_SYMBOLS, 3002),
  makeLevel(523, 'Total Recall', 3, 8, 64, WORLD_3_SYMBOLS, 3003),
  makeLevel(524, 'Eidetic', 3, 8, 60, WORLD_3_SYMBOLS, 3004),
  makeLevel(525, 'Perfect Memory', 3, 8, 56, WORLD_3_SYMBOLS, 3005),
];
