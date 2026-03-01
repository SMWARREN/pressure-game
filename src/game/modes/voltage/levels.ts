// VOLTAGE MODE — Level Definitions
// Each level is a grid of charge cells. Cells with chargeRate > 1 charge faster.
// Time your discharge perfectly for maximum score.

import { Level, Tile } from '../../types';
import { seededRandom } from '../seedUtils';

export const VOLTAGE_WORLDS = [
  { id: 1, name: 'Circuit', tagline: 'Learn to time your discharge', color: '#eab308', icon: '⚡' },
  {
    id: 2,
    name: 'Power Grid',
    tagline: 'Hot cells charge twice as fast',
    color: '#f97316',
    icon: '🔋',
  },
  {
    id: 3,
    name: 'Overload',
    tagline: 'Maximum voltage, minimum margin',
    color: '#ef4444',
    icon: '💥',
  },
];

/**
 * Get charge rate based on tile type (replaces nested ternary)
 */
function getChargeRate(isHot: boolean, isCold: boolean): number {
  if (isHot) return 2;
  if (isCold) return 0;
  return 1; // normal = charges every 1 tick
}

/**
 * Get cell kind based on tile type (replaces nested ternary)
 */
function getCellKind(isHot: boolean, isCold: boolean): 'hot' | 'cold' | 'cell' {
  if (isHot) return 'hot';
  if (isCold) return 'cold';
  return 'cell';
}

// ── Grid builder ──────────────────────────────────────────────────────────────

function buildVoltageGrid(
  gridSize: number,
  hotCount: number,
  coldCount: number,
  seed: number
): Tile[] {
  const rng = seededRandom(seed);
  const positions: { x: number; y: number }[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      positions.push({ x, y });
    }
  }

  // Shuffle and pick hot/cold positions
  const shuffled = [...positions].sort(() => rng() - 0.5);
  const hotSet = new Set(shuffled.slice(0, hotCount).map((p) => `${p.x},${p.y}`));
  const coldSet = new Set(
    shuffled.slice(hotCount, hotCount + coldCount).map((p) => `${p.x},${p.y}`)
  );

  return positions.map(({ x, y }) => {
    const key = `${x},${y}`;
    const isHot = hotSet.has(key);
    const isCold = coldSet.has(key);
    const chargeRate = getChargeRate(isHot, isCold);
    const kind = getCellKind(isHot, isCold);
    return {
      id: `v${seed}-${x}-${y}`,
      type: 'path' as const,
      x,
      y,
      connections: [],
      canRotate: true, // any tile tap = discharge
      isGoalNode: false,
      displayData: {
        charge: 0,
        chargeRate,
        kind,
      },
    };
  });
}

interface MakeLevelParams {
  readonly id: number;
  readonly name: string;
  readonly world: number;
  readonly gridSize: number;
  readonly targetScore: number;
  readonly maxMoves: number;
  readonly hotCount: number;
  readonly coldCount: number;
  readonly seed: number;
}

function makeLevel({
  id,
  name,
  world,
  gridSize,
  targetScore,
  maxMoves,
  hotCount,
  coldCount,
  seed,
}: MakeLevelParams): Level {
  return {
    id,
    name,
    world,
    gridSize,
    tiles: buildVoltageGrid(gridSize, hotCount, coldCount, seed),
    goalNodes: [],
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
    targetScore,
  };
}

// ── Level catalog ─────────────────────────────────────────────────────────────
// Scoring math: at max charge 7, a 5×5 grid (25 tiles) = 175 pts per discharge.
// Hot tiles charge at 2×, reaching overload (8) in 4 ticks. Time carefully!
// Cold tiles stay flat (0 charge). They don't score.

export const VOLTAGE_LEVELS: Level[] = [
  // World 1: Circuit — uniform grid, learn the timing rhythm
  makeLevel({
    id: 901,
    name: 'First Charge',
    world: 1,
    gridSize: 5,
    targetScore: 150,
    maxMoves: 3,
    hotCount: 0,
    coldCount: 0,
    seed: 901,
  }), // 3 discharges needed around charge 2
  makeLevel({
    id: 902,
    name: 'Building Up',
    world: 1,
    gridSize: 5,
    targetScore: 300,
    maxMoves: 3,
    hotCount: 0,
    coldCount: 0,
    seed: 902,
  }), // must discharge at charge 4+
  makeLevel({
    id: 903,
    name: 'Peak Timing',
    world: 1,
    gridSize: 5,
    targetScore: 450,
    maxMoves: 4,
    hotCount: 0,
    coldCount: 0,
    seed: 903,
  }), // 4 discharges at charge ~5
  makeLevel({
    id: 904,
    name: 'Max Voltage',
    world: 1,
    gridSize: 5,
    targetScore: 600,
    maxMoves: 4,
    hotCount: 0,
    coldCount: 0,
    seed: 904,
  }), // must approach charge 7

  // World 2: Power Grid — hot cells spike faster, forcing earlier partial discharges
  makeLevel({
    id: 905,
    name: 'Hot Spots',
    world: 2,
    gridSize: 6,
    targetScore: 700,
    maxMoves: 3,
    hotCount: 4,
    coldCount: 0,
    seed: 905,
  }), // 4 hot tiles (2× charge)
  makeLevel({
    id: 906,
    name: 'Surge Zone',
    world: 2,
    gridSize: 6,
    targetScore: 900,
    maxMoves: 4,
    hotCount: 5,
    coldCount: 3,
    seed: 906,
  }), // mix of hot and cold
  makeLevel({
    id: 907,
    name: 'Reactor',
    world: 2,
    gridSize: 6,
    targetScore: 1200,
    maxMoves: 4,
    hotCount: 6,
    coldCount: 0,
    seed: 907,
  }), // many hot tiles, tight timing
  makeLevel({
    id: 908,
    name: 'Meltdown',
    world: 2,
    gridSize: 7,
    targetScore: 1500,
    maxMoves: 4,
    hotCount: 8,
    coldCount: 4,
    seed: 908,
  }), // 7×7 with hot/cold mix

  // World 3: Overload — maximum pressure, minimal margin for error
  makeLevel({
    id: 909,
    name: 'Critical Mass',
    world: 3,
    gridSize: 7,
    targetScore: 2000,
    maxMoves: 5,
    hotCount: 10,
    coldCount: 0,
    seed: 909,
  }), // mostly hot tiles
  makeLevel({
    id: 910,
    name: 'Live Wire',
    world: 3,
    gridSize: 7,
    targetScore: 2500,
    maxMoves: 5,
    hotCount: 12,
    coldCount: 3,
    seed: 910,
  }),
  makeLevel({
    id: 911,
    name: 'Zero Margin',
    world: 3,
    gridSize: 8,
    targetScore: 3500,
    maxMoves: 6,
    hotCount: 15,
    coldCount: 5,
    seed: 911,
  }),
  makeLevel({
    id: 912,
    name: 'Total Overload',
    world: 3,
    gridSize: 8,
    targetScore: 5000,
    maxMoves: 6,
    hotCount: 18,
    coldCount: 0,
    seed: 912,
  }),
];
