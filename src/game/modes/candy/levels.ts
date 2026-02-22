// CANDY MODE - Level Definitions
// Levels are independent of the pipe system.
// Each tile cycles through SYMBOLS on tap — win by matching all targets.

import { Level, Tile } from '../../types'

export const CANDY_SYMBOLS = ['🍬', '🍭', '🍫', '🍰']

export const CANDY_WORLDS = [
  { id: 1, name: 'Sweet',  tagline: 'Match the candies', color: '#f472b6', icon: '🍬' },
  { id: 2, name: 'Sour',   tagline: 'Tricky combos',    color: '#a78bfa', icon: '🍭' },
  { id: 3, name: 'Spicy',  tagline: 'Expert patterns',  color: '#f97316', icon: '🍫' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function wall(x: number, y: number): Tile {
  return { id: `wall-${x}-${y}`, type: 'wall', x, y, connections: [], isGoalNode: false, canRotate: false }
}

function wallBorder(size: number): Tile[] {
  const tiles: Tile[] = []
  for (let i = 0; i < size; i++) {
    tiles.push(wall(i, 0))
    tiles.push(wall(i, size - 1))
    if (i > 0 && i < size - 1) {
      tiles.push(wall(0, i))
      tiles.push(wall(size - 1, i))
    }
  }
  return tiles
}

/** Create a candy tile at (x,y) with a starting symbol and target symbol. */
function ct(x: number, y: number, symbol: string, target: string): Tile {
  return {
    id: `candy-${x}-${y}`,
    type: 'path',
    x, y,
    connections: [],
    isGoalNode: false,
    canRotate: true,
    displayData: { symbol, target },
  }
}

// ── World 1: Sweet (easy) — all tiles need 1–2 taps ──────────────────────────

const level101: Level = {
  id: 101, name: 'Cherry Drop', world: 1, gridSize: 5,
  compressionDelay: 99999, maxMoves: 5, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(2, 1, '🍬', '🍭'),  // 1 tap
    ct(1, 2, '🍭', '🍫'),  // 1 tap
    ct(3, 2, '🍫', '🍰'),  // 1 tap
  ],
}

const level102: Level = {
  id: 102, name: 'Sugar Snap', world: 1, gridSize: 5,
  compressionDelay: 99999, maxMoves: 7, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(1, 1, '🍬', '🍭'),  // 1 tap
    ct(3, 1, '🍭', '🍰'),  // 2 taps
    ct(1, 3, '🍫', '🍰'),  // 1 tap
    ct(3, 3, '🍰', '🍬'),  // 1 tap: (0-3+4)%4=1
  ],
}

const level103: Level = {
  id: 103, name: 'Gummy Star', world: 1, gridSize: 5,
  compressionDelay: 99999, maxMoves: 11, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(1, 1, '🍰', '🍬'),  // 1 tap
    ct(3, 1, '🍬', '🍫'),  // 2 taps
    ct(2, 2, '🍭', '🍰'),  // 2 taps
    ct(1, 3, '🍫', '🍬'),  // 2 taps: (0-2+4)%4=2
    ct(3, 3, '🍰', '🍭'),  // 2 taps: (1-3+4)%4=2
  ],
}

// ── World 2: Sour (medium) — 2–3 taps per tile ───────────────────────────────

const level104: Level = {
  id: 104, name: 'Lemon Twist', world: 2, gridSize: 5,
  compressionDelay: 99999, maxMoves: 13, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(1, 1, '🍬', '🍰'),  // 3 taps
    ct(3, 1, '🍭', '🍬'),  // 3 taps: (0-1+4)%4=3
    ct(2, 2, '🍫', '🍭'),  // 3 taps: (1-2+4)%4=3
    ct(1, 3, '🍰', '🍫'),  // 3 taps: (2-3+4)%4=3
  ],
}

const level105: Level = {
  id: 105, name: 'Bitter Drop', world: 2, gridSize: 5,
  compressionDelay: 99999, maxMoves: 15, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(1, 1, '🍬', '🍫'),  // 2 taps
    ct(2, 1, '🍭', '🍰'),  // 2 taps
    ct(3, 1, '🍫', '🍬'),  // 2 taps: (0-2+4)%4=2
    ct(1, 3, '🍰', '🍭'),  // 2 taps: (1-3+4)%4=2
    ct(2, 3, '🍬', '🍰'),  // 3 taps
    ct(3, 3, '🍭', '🍫'),  // 1 tap  -- total min=11, max=15
  ],
}

const level106: Level = {
  id: 106, name: 'Sour Spiral', world: 2, gridSize: 5,
  compressionDelay: 99999, maxMoves: 18, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(1, 1, '🍭', '🍰'),  // 2 taps
    ct(2, 1, '🍫', '🍬'),  // 2 taps
    ct(3, 1, '🍰', '🍫'),  // 3 taps
    ct(1, 2, '🍬', '🍭'),  // 1 tap
    ct(3, 2, '🍰', '🍭'),  // 2 taps: (1-3+4)%4=2
    ct(1, 3, '🍫', '🍰'),  // 1 tap
    ct(3, 3, '🍭', '🍰'),  // 2 taps  -- total min=13, max=18
  ],
}

// ── World 3: Spicy (hard) — many tiles, tight budget ─────────────────────────

const level107: Level = {
  id: 107, name: 'Chili Crunch', world: 3, gridSize: 5,
  compressionDelay: 99999, maxMoves: 22, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(1, 1, '🍬', '🍰'),  // 3 taps
    ct(2, 1, '🍭', '🍬'),  // 3 taps: (0-1+4)%4=3
    ct(3, 1, '🍫', '🍭'),  // 3 taps: (1-2+4)%4=3
    ct(1, 2, '🍰', '🍫'),  // 3 taps: (2-3+4)%4=3
    ct(2, 2, '🍬', '🍰'),  // 3 taps
    ct(3, 2, '🍭', '🍬'),  // 3 taps
    ct(1, 3, '🍫', '🍭'),  // 3 taps
  ],
}

const level108: Level = {
  id: 108, name: 'Fire Storm', world: 3, gridSize: 5,
  compressionDelay: 99999, maxMoves: 23, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    ct(1, 1, '🍰', '🍬'),  // 1 tap
    ct(2, 1, '🍬', '🍰'),  // 3 taps
    ct(3, 1, '🍰', '🍭'),  // 2 taps: (1-3+4)%4=2
    ct(1, 2, '🍭', '🍬'),  // 3 taps: (0-1+4)%4=3
    ct(3, 2, '🍫', '🍰'),  // 1 tap
    ct(1, 3, '🍬', '🍫'),  // 2 taps
    ct(2, 3, '🍭', '🍰'),  // 2 taps
    ct(3, 3, '🍰', '🍫'),  // 3 taps  -- total min=17, max=23
  ],
}

const level109: Level = {
  id: 109, name: 'Inferno', world: 3, gridSize: 5,
  compressionDelay: 99999, maxMoves: 24, goalNodes: [],
  tiles: [
    ...wallBorder(5),
    // Full 3×3 interior — all 9 cells
    ct(1, 1, '🍭', '🍰'),  // 2 taps
    ct(2, 1, '🍫', '🍬'),  // 2 taps
    ct(3, 1, '🍰', '🍫'),  // 3 taps
    ct(1, 2, '🍬', '🍭'),  // 1 tap
    ct(2, 2, '🍰', '🍬'),  // 1 tap
    ct(3, 2, '🍭', '🍰'),  // 2 taps
    ct(1, 3, '🍫', '🍭'),  // 3 taps: (1-2+4)%4=3
    ct(2, 3, '🍰', '🍭'),  // 2 taps: (1-3+4)%4=2
    ct(3, 3, '🍬', '🍰'),  // 3 taps  -- total min=19, max=24
  ],
}

export const CANDY_LEVELS: Level[] = [
  level101, level102, level103,
  level104, level105, level106,
  level107, level108, level109,
]
