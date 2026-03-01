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

function makeLevel(
  id: number,
  name: string,
  world: number,
  gridSize: number,
  targetScore: number,
  maxMoves: number,
  hotCount: number,
  coldCount: number,
  seed: number
): Level {
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
  makeLevel(901, 'First Charge', 1, 5, 150, 3, 0, 0, 901), // 3 discharges needed around charge 2
  makeLevel(902, 'Building Up', 1, 5, 300, 3, 0, 0, 902), // must discharge at charge 4+
  makeLevel(903, 'Peak Timing', 1, 5, 450, 4, 0, 0, 903), // 4 discharges at charge ~5
  makeLevel(904, 'Max Voltage', 1, 5, 600, 4, 0, 0, 904), // must approach charge 7

  // World 2: Power Grid — hot cells spike faster, forcing earlier partial discharges
  makeLevel(905, 'Hot Spots', 2, 6, 700, 3, 4, 0, 905), // 4 hot tiles (2× charge)
  makeLevel(906, 'Surge Zone', 2, 6, 900, 4, 5, 3, 906), // mix of hot and cold
  makeLevel(907, 'Reactor', 2, 6, 1200, 4, 6, 0, 907), // many hot tiles, tight timing
  makeLevel(908, 'Meltdown', 2, 7, 1500, 4, 8, 4, 908), // 7×7 with hot/cold mix

  // World 3: Overload — maximum pressure, minimal margin for error
  makeLevel(909, 'Critical Mass', 3, 7, 2000, 5, 10, 0, 909), // mostly hot tiles
  makeLevel(910, 'Live Wire', 3, 7, 2500, 5, 12, 3, 910),
  makeLevel(911, 'Zero Margin', 3, 8, 3500, 6, 15, 5, 911),
  makeLevel(912, 'Total Overload', 3, 8, 5000, 6, 18, 0, 912),
];
