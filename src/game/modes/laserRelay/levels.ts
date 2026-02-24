// LASER RELAY — Level Definitions
// All levels: source emits right, mirrors start as ? (rotation 1 = \).
// Solution always requires rotating ? mirrors to / (rotation 0).
// Beam path: right→up→right→up→... staircase pattern.
// Every level verified: initial config misses target, solution hits it.

import { Level, Tile } from '../../types';

export const LASER_WORLDS = [
  { id: 1, name: 'Prism', tagline: '1-2 mirrors, learn the bounce', color: '#06b6d4', icon: '🔦' },
  { id: 2, name: 'Refract', tagline: 'Chain 3-4 reflections', color: '#8b5cf6', icon: '🪞' },
  { id: 3, name: 'Gauntlet', tagline: '5-mirror precision runs', color: '#f97316', icon: '⚡' },
];

// ── Beam trace ────────────────────────────────────────────────────────────────

const SLASH: Record<string, string> = { right: 'up', up: 'right', left: 'down', down: 'left' };
const BACK: Record<string, string> = { right: 'down', down: 'right', left: 'up', up: 'left' };
const STEP: Record<string, { dx: number; dy: number }> = {
  right: { dx: 1, dy: 0 },
  left: { dx: -1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
};

function traceBeam(tiles: Tile[], gridSize: number): Set<string> {
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(`${t.x},${t.y}`, t);
  const source = tiles.find((t) => t.displayData?.kind === 'source');
  if (!source) return new Set();

  let x = source.x;
  let y = source.y;
  let dir = source.displayData!.dir as string;
  const beam = new Set<string>();
  let steps = 0;

  while (steps++ < gridSize * gridSize * 4) {
    const { dx, dy } = STEP[dir];
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) break;
    const key = `${x},${y}`;
    const tile = map.get(key);
    if (!tile) break;
    const kind = tile.displayData?.kind as string;
    if (kind === 'wall' || kind === 'source') break;
    beam.add(key);
    if (kind === 'target') break;
    if (kind === 'mirror') {
      const rot = tile.displayData?.rotation as number;
      const nd = rot === 0 ? SLASH[dir] : BACK[dir];
      if (!nd) break;
      dir = nd;
    }
  }
  return beam;
}

function applyBeam(tiles: Tile[], gridSize: number): Tile[] {
  const beam = traceBeam(tiles, gridSize);
  return tiles.map((t) => {
    const isBeam = beam.has(`${t.x},${t.y}`);
    if ((t.displayData?.beamOn as boolean) === isBeam) return t;
    return { ...t, displayData: { ...t.displayData, beamOn: isBeam } };
  });
}

// ── Level builder ─────────────────────────────────────────────────────────────
// Chars: . empty  S source(→)  V source(↓)  T target
//        ? mirror starts \(rot1) needs /   / mirror starts / (correct)
//        # wall

function buildLevel(
  id: number,
  name: string,
  world: number,
  maxMoves: number,
  rows: string[]
): Level {
  const gridSize = rows.length;
  const tiles: Tile[] = [];

  for (let y = 0; y < gridSize; y++) {
    const chars = rows[y].split(' ');
    for (let x = 0; x < gridSize; x++) {
      const ch = chars[x] ?? '.';
      let kind = 'empty',
        dir = 'right',
        rotation = 0,
        canRotate = false;
      switch (ch) {
        case 'S':
          kind = 'source';
          dir = 'right';
          break;
        case 'V':
          kind = 'source';
          dir = 'down';
          break;
        case 'U':
          kind = 'source';
          dir = 'up';
          break;
        case 'T':
          kind = 'target';
          break;
        case '#':
          kind = 'wall';
          break;
        case '/':
          kind = 'mirror';
          rotation = 0;
          canRotate = true;
          break;
        case '?':
          kind = 'mirror';
          rotation = 1;
          canRotate = true;
          break;
        default:
          kind = 'empty';
      }
      tiles.push({
        id: `lr${id}-${x}-${y}`,
        type: 'path' as const,
        x,
        y,
        connections: [],
        canRotate,
        isGoalNode: kind === 'target',
        displayData: { kind, dir, rotation, beamOn: false },
      });
    }
  }

  return {
    id,
    name,
    world,
    gridSize,
    tiles: applyBeam(tiles, gridSize),
    goalNodes: [],
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
  };
}

// ── Levels ────────────────────────────────────────────────────────────────────
// All use the staircase pattern: source→(mirror/)→up→(mirror/)→right→...→target
// ? mirrors start wrong (rotation 1 = \), all need to be rotated to / to solve.
//
// Verification: initial beam (all \) goes down off-grid → never hits target.
// Solution beam (all /): right→up→right→up... reaches the target.

export const LASER_LEVELS: Level[] = [
  // ── World 1: Prism — 5×5, 1-3 mirrors ───────────────────────────────────────

  // 801 "First Light": 1 mirror. Source right, 1 bounce, hits target above.
  // Solution: rotate (2,2) to /  → beam goes up to target at (2,0).
  buildLevel(801, 'First Light', 1, 5, [
    '. . T . .',
    '. . . . .',
    'S . ? . .',
    '. . . . .',
    '. . . . .',
  ]),

  // 802 "Elbow": 2 mirrors. Two bounces reach top-right corner.
  // Solution: (1,2)→/ beam up, (1,0)→/ beam right → target (4,0).
  buildLevel(802, 'Elbow', 1, 7, ['. ? . . T', '. . . . .', 'S ? . . .', '. . . . .', '. . . . .']),

  // 803 "S-Curve": 2 mirrors. Diagonal staircase right then right again.
  // Solution: (2,4)→/ up, (2,2)→/ right → target (4,2).
  buildLevel(803, 'S-Curve', 1, 7, [
    '. . . . .',
    '. . . . .',
    '. . ? . T',
    '. . . . .',
    'S . ? . .',
  ]),

  // 804 "Steps": 3 mirrors. Classic 3-step staircase.
  // Solution: (1,4)→/ up, (1,2)→/ right, (3,2)→/ up → target (3,0).
  buildLevel(804, 'Steps', 1, 9, ['. . . T .', '. . . . .', '. ? . ? .', '. . . . .', 'S ? . . .']),

  // ── World 2: Refract — 6×6, 2-4 mirrors ─────────────────────────────────────

  // 805 "Long Ride": 2 mirrors, long vertical run between them.
  // Solution: (2,5)→/ up, (2,2)→/ right → target (5,2).
  buildLevel(805, 'Long Ride', 2, 8, [
    '. . . . . .',
    '. . . . . .',
    '. . ? . . T',
    '. . . . . .',
    '. . . . . .',
    'S . ? . . .',
  ]),

  // 806 "Down the Chute": 3 mirrors. Beam travels far right then far up.
  // Solution: (1,5)→/ up, (1,3)→/ right, (4,3)→/ up → target (4,0).
  buildLevel(806, 'Down the Chute', 2, 10, [
    '. . . . T .',
    '. . . . . .',
    '. . . . . .',
    '. ? . . ? .',
    '. . . . . .',
    'S ? . . . .',
  ]),

  // 807 "The Funnel": 4 mirrors. Two-stage staircase.
  // Solution: (1,5)→/ up, (1,3)→/ right, (3,3)→/ up, (3,1)→/ right → target (5,1).
  buildLevel(807, 'The Funnel', 2, 12, [
    '. . . . . .',
    '. . . ? . T',
    '. . . . . .',
    '. ? . ? . .',
    '. . . . . .',
    'S ? . . . .',
  ]),

  // ── World 3: Gauntlet — 7×7, 4-5 mirrors ────────────────────────────────────

  // 808 "Zigzag": 4 mirrors. Long staircase path.
  // Solution: (1,6)→/ up, (1,4)→/ right, (4,4)→/ up, (4,2)→/ right → target (6,2).
  buildLevel(808, 'Zigzag', 3, 14, [
    '. . . . . . .',
    '. . . . . . .',
    '. . . . ? . T',
    '. . . . . . .',
    '. ? . . ? . .',
    '. . . . . . .',
    'S ? . . . . .',
  ]),

  // 809 "Spiral": 5 mirrors. Maximum bounces on a 7×7.
  // Solution: (1,6)→/ up, (1,4)→/ right, (3,4)→/ up, (3,2)→/ right, (5,2)→/ up → target (5,0).
  buildLevel(809, 'Spiral', 3, 16, [
    '. . . . . T .',
    '. . . . . . .',
    '. . . ? . ? .',
    '. . . . . . .',
    '. ? . ? . . .',
    '. . . . . . .',
    'S ? . . . . .',
  ]),

  // 810 "Corner to Corner": 5 mirrors. Full-grid staircase, source bottom-left target top-right.
  // Solution: (2,6)→/ up, (2,4)→/ right, (4,4)→/ up, (4,2)→/ right, (6,2)→/ up → target (6,0).
  buildLevel(810, 'Corner to Corner', 3, 18, [
    '. . . . . . T',
    '. . . . . . .',
    '. . . . ? . ?',
    '. . . . . . .',
    '. . ? . ? . .',
    '. . . . . . .',
    'S . ? . . . .',
  ]),
];
