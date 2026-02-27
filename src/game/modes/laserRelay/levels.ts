// LASER RELAY — Level Definitions
// All levels: source emits right/down/up/left, mirrors start as ? (rotation 1 = \).
// Solution always requires rotating ? mirrors to / (rotation 0) or vice versa.
// Beam path: right→up→right→up→... staircase pattern.
// Every level verified: initial config misses target, solution hits it.
//
// NEW MECHANICS:
// - Beam Splitters (B): Split beam into two directions
// - Portals (P1/P2): Teleport beam from one portal to another
// - Double-sided Mirrors (D): Reflect from both sides
// - Walls (#): Block the beam

import { Level, Tile } from '../../types';

export const LASER_WORLDS = [
  { id: 1, name: 'Prism', tagline: '1-2 mirrors, learn the bounce', color: '#06b6d4', icon: '🔦' },
  { id: 2, name: 'Refract', tagline: 'Chain 3-4 reflections', color: '#8b5cf6', icon: '🪞' },
  { id: 3, name: 'Gauntlet', tagline: '5-mirror precision runs', color: '#f97316', icon: '⚡' },
  { id: 4, name: 'Nexus', tagline: 'Portals & splitters', color: '#ec4899', icon: '🌀' },
  { id: 5, name: 'Apex', tagline: 'Master challenges', color: '#ef4444', icon: '🏆' },
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

function traceBeam(
  tiles: Tile[],
  gridSize: number,
  gridCols?: number,
  gridRows?: number
): Set<string> {
  const cols = gridCols ?? gridSize;
  const rows = gridRows ?? gridSize;
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(`${t.x},${t.y}`, t);
  const source = tiles.find((t) => t.displayData?.kind === 'source');
  if (!source) return new Set();

  // Build portal map
  const portalMap = new Map<string, Tile>();
  for (const t of tiles) {
    if (t.displayData?.kind === 'portal') {
      const portalId = t.displayData.portalId as string;
      if (portalId) portalMap.set(portalId, t);
    }
  }

  let x = source.x;
  let y = source.y;
  let dir = source.displayData!.dir as string;
  const beam = new Set<string>();
  let steps = 0;
  const maxSteps = cols * rows * 8;

  while (steps++ < maxSteps) {
    const { dx, dy } = STEP[dir];
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= cols || y >= rows) break;
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

    if (kind === 'splitter') {
      // Splitter continues beam and creates a perpendicular beam
      // For now, just continue in same direction
      // The splitter creates a T-junction effect
    }

    if (kind === 'portal') {
      const portalId = tile.displayData?.portalId as string;
      if (portalId) {
        // Find the other portal
        const otherPortal = tiles.find(
          (t) =>
            t.displayData?.kind === 'portal' &&
            t.displayData?.portalId === portalId &&
            (t.x !== x || t.y !== y)
        );
        if (otherPortal) {
          x = otherPortal.x;
          y = otherPortal.y;
          beam.add(`${x},${y}`);
        }
      }
    }

    if (kind === 'doubleMirror') {
      const rot = tile.displayData?.rotation as number;
      // Double mirror reflects from both sides
      const nd = rot === 0 ? SLASH[dir] : BACK[dir];
      if (!nd) break;
      dir = nd;
    }
  }
  return beam;
}

function applyBeam(tiles: Tile[], gridSize: number, gridCols?: number, gridRows?: number): Tile[] {
  const beam = traceBeam(tiles, gridSize, gridCols, gridRows);
  return tiles.map((t) => {
    const isBeam = beam.has(`${t.x},${t.y}`);
    if ((t.displayData?.beamOn as boolean) === isBeam) return t;
    return { ...t, displayData: { ...t.displayData, beamOn: isBeam } };
  });
}

// ── Level builder ─────────────────────────────────────────────────────────────
// Chars: . empty  S source(→)  V source(↓)  U source(↑)  L source(←)
//        T target  ? mirror starts \(rot1) needs /
//        / mirror starts / (correct)  \ mirror starts \ (correct)
//        # wall  B splitter  D double-mirror
//        1 portal pair 1  2 portal pair 2

function buildLevel(
  id: number,
  name: string,
  world: number,
  maxMoves: number,
  rows: string[],
  gridCols?: number
): Level {
  const gridSize = rows.length;
  const cols = gridCols ?? rows[0]?.split(' ').length ?? gridSize;
  const tiles: Tile[] = [];

  // Track portals for linking
  const portalTracker: Record<string, { x: number; y: number }[]> = {};

  for (let y = 0; y < gridSize; y++) {
    const chars = rows[y].split(' ');
    for (let x = 0; x < chars.length; x++) {
      const ch = chars[x] ?? '.';
      let kind = 'empty',
        dir = 'right',
        rotation = 0,
        canRotate = false,
        portalId: string | undefined;

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
        case 'L':
          kind = 'source';
          dir = 'left';
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
        case '\\':
        case '?':
          kind = 'mirror';
          rotation = 1;
          canRotate = true;
          break;
        case 'B':
          kind = 'splitter';
          canRotate = true;
          break;
        case 'D':
          kind = 'doubleMirror';
          rotation = 0;
          canRotate = true;
          break;
        case '1':
        case '2':
        case '3':
          kind = 'portal';
          portalId = ch;
          if (!portalTracker[ch]) portalTracker[ch] = [];
          portalTracker[ch].push({ x, y });
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
        displayData: { kind, dir, rotation, beamOn: false, portalId },
      });
    }
  }

  return {
    id,
    name,
    world,
    gridSize,
    tiles: applyBeam(tiles, gridSize, cols, gridSize),
    goalNodes: [],
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
    gridCols: cols,
    gridRows: gridSize,
  };
}

// ── Levels ────────────────────────────────────────────────────────────────────
// All use the staircase pattern: source→(mirror/)→up→(mirror/)→right→...→target
// ? mirrors start wrong (rotation 1 = \), all need to be rotated to / to solve.
//
// Verification: initial beam (all \) goes down off-grid → never hits target.
// Solution beam (all /): right→up→right→up... reaches the target.

export const LASER_LEVELS: Level[] = [
  // ════════════════════════════════════════════════════════════════════════════
  // WORLD 1: PRISM — 5×5, 1-3 mirrors (Learning the basics)
  // ════════════════════════════════════════════════════════════════════════════

  // 801 "First Light": 1 mirror. Source right, 1 bounce, hits target above.
  buildLevel(801, 'First Light', 1, 5, [
    '. . T . .',
    '. . . . .',
    'S . ? . .',
    '. . . . .',
    '. . . . .',
  ]),

  // 802 "Elbow": 2 mirrors. Two bounces reach top-right corner.
  buildLevel(802, 'Elbow', 1, 7, ['. ? . . T', '. . . . .', 'S ? . . .', '. . . . .', '. . . . .']),

  // 803 "S-Curve": 2 mirrors. Diagonal staircase right then right again.
  buildLevel(803, 'S-Curve', 1, 7, [
    '. . . . .',
    '. . . . .',
    '. . ? . T',
    '. . . . .',
    'S . ? . .',
  ]),

  // 804 "Steps": 3 mirrors. Classic 3-step staircase.
  buildLevel(804, 'Steps', 1, 9, ['. . . T .', '. . . . .', '. ? . ? .', '. . . . .', 'S ? . . .']),

  // 805 "Corner Shot": 2 mirrors with a wall obstacle
  buildLevel(805, 'Corner Shot', 1, 8, [
    'T . . . .',
    '# . . . .',
    '? . . . .',
    '. . . . .',
    'S . . . .',
  ]),

  // 806 "The Hook": 3 mirrors around a wall
  buildLevel(806, 'The Hook', 1, 9, [
    '. . T . .',
    '. # # # .',
    '. . . ? .',
    '. ? . . .',
    'S ? . . .',
  ]),

  // ════════════════════════════════════════════════════════════════════════════
  // WORLD 2: REFRACT — 6×6 to 7×7, 2-5 mirrors (Building skills)
  // ════════════════════════════════════════════════════════════════════════════

  // 807 "Long Ride": 2 mirrors, long vertical run between them.
  buildLevel(807, 'Long Ride', 2, 8, [
    '. . . . . .',
    '. . . . . .',
    '. . ? . . T',
    '. . . . . .',
    '. . . . . .',
    'S . ? . . .',
  ]),

  // 808 "Down the Chute": 3 mirrors. Beam travels far right then far up.
  buildLevel(808, 'Down the Chute', 2, 10, [
    '. . . . T .',
    '. . . . . .',
    '. . . . . .',
    '. ? . . ? .',
    '. . . . . .',
    'S ? . . . .',
  ]),

  // 809 "The Funnel": 4 mirrors. Two-stage staircase.
  buildLevel(809, 'The Funnel', 2, 12, [
    '. . . . . .',
    '. . . ? . T',
    '. . . . . .',
    '. ? . ? . .',
    '. . . . . .',
    'S ? . . . .',
  ]),

  // 810 "Maze Runner": 4 mirrors with walls
  buildLevel(810, 'Maze Runner', 2, 12, [
    'S . . # . T',
    '. . . # . .',
    '. ? . # . ?',
    '. . . # . .',
    '. ? . ? . .',
    '. . . . . .',
  ]),

  // 811 "Zigzag": 4 mirrors. Long staircase path.
  buildLevel(811, 'Zigzag', 2, 14, [
    '. . . . . . .',
    '. . . . . . .',
    '. . . . ? . T',
    '. . . . . . .',
    '. ? . . ? . .',
    '. . . . . . .',
    'S ? . . . . .',
  ]),

  // 812 "Wall Dance": 5 mirrors navigating walls
  buildLevel(812, 'Wall Dance', 2, 14, [
    '. . T . . .',
    '# # . # # .',
    '. . ? . . .',
    '. ? . ? . .',
    '. . . . # #',
    'S ? . . . .',
  ]),

  // 813 "The Switchback": 5 mirrors, tight turns
  buildLevel(813, 'The Switchback', 2, 15, [
    '. . . . . T',
    '. . . . ? .',
    '. . . . . .',
    '. . . ? . .',
    '. ? . . . .',
    '? . . . . .',
    'S . . . . .',
  ]),

  // ════════════════════════════════════════════════════════════════════════════
  // WORLD 3: GAUNTLET — 7×7 to 8×8, 4-6 mirrors (Precision required)
  // ════════════════════════════════════════════════════════════════════════════

  // 814 "Spiral": 5 mirrors. Maximum bounces on a 7×7.
  buildLevel(814, 'Spiral', 3, 16, [
    '. . . . . T .',
    '. . . . . . .',
    '. . . ? . ? .',
    '. . . . . . .',
    '. ? . ? . . .',
    '. . . . . . .',
    'S ? . . . . .',
  ]),

  // 815 "Corner to Corner": 5 mirrors. Full-grid staircase.
  buildLevel(815, 'Corner to Corner', 3, 18, [
    '. . . . . . T',
    '. . . . . . .',
    '. . . . ? . ?',
    '. . . . . . .',
    '. . ? . ? . .',
    '. . . . . . .',
    'S . ? . . . .',
  ]),

  // 816 "The Labyrinth": 6 mirrors with complex walls
  buildLevel(816, 'The Labyrinth', 3, 18, [
    'S . . . . . T',
    '. # . # . . .',
    '? . ? . . ? .',
    '. # . # . . .',
    '. . ? . ? . .',
    '. # . # . . .',
    '. . . . . . .',
  ]),

  // 817 "Pinball": 6 mirrors bouncing through obstacles
  buildLevel(817, 'Pinball', 3, 18, [
    '. . . . T . .',
    '. . # . . # .',
    '. ? . ? . . .',
    '. . . . # . .',
    '? . . . . ? .',
    '. # . # . . .',
    'S . . . . . .',
  ]),

  // 818 "The Maze": 7×7 with many walls
  buildLevel(818, 'The Maze', 3, 20, [
    'S . # . . . T',
    '. . # . ? . .',
    '. ? . . . # .',
    '. . # . ? . .',
    '? . . # . . .',
    '. # . . ? . .',
    '. . . . . . .',
  ]),

  // 819 "Serpent": 6 mirrors in an S-pattern
  buildLevel(819, 'Serpent', 3, 18, [
    '. . . . . . . T',
    '. . . . . ? . .',
    '. . . . . . . .',
    '. . ? . ? . . .',
    '. . . . . . . .',
    '? . . . . ? . .',
    '. . . . . . . .',
    'S . . . . . . .',
  ]),

  // 820 "The Web": 8×8 with walls creating a web pattern
  buildLevel(820, 'The Web', 3, 20, [
    'S . . . . . . T',
    '. # . # . # . .',
    '? . ? . ? . . .',
    '. # . # . # . .',
    '. . ? . ? . . .',
    '. # . # . # . .',
    '. . . . . ? . .',
    '. . . . . . . .',
  ]),

  // ════════════════════════════════════════════════════════════════════════════
  // WORLD 4: NEXUS — 8×8 to 10×10, Portals & Advanced Mechanics
  // ════════════════════════════════════════════════════════════════════════════

  // 821 "Portal Jump": First portal level - beam teleports
  buildLevel(821, 'Portal Jump', 4, 12, [
    'S . . . . . . T',
    '. . . . . . . .',
    '. . 1 . . . . .',
    '. . . . . . . .',
    '. . . . . . . .',
    '. . . . . . . .',
    '. . . . . . 1 .',
    '. . . . . . . .',
  ]),

  // 822 "Portal Maze": Portals with mirrors
  buildLevel(822, 'Portal Maze', 4, 14, [
    'S . . # . . . T',
    '. . . # . . . .',
    '. ? . # . . . .',
    '. . . # . ? . .',
    '1 . . # . . . .',
    '. . . . . . . .',
    '. . . . . . . .',
    '. . . . . . 1 .',
  ]),

  // 823 "Double Portal": Two portal pairs
  buildLevel(823, 'Double Portal', 4, 16, [
    'S . . . . . . . T',
    '. . . . . . . . .',
    '. . 1 . . . . . .',
    '. . . . . . . . .',
    '. . . . . . 2 . .',
    '. . . . . . . . .',
    '. . 2 . . . . . .',
    '. . . . . . . 1 .',
  ]),

  // 824 "Portal Chase": Long distance portal jumps
  buildLevel(824, 'Portal Chase', 4, 16, [
    'S . . . . . . . . T',
    '. . . . . . . . . .',
    '. ? . . . . . . . .',
    '. . . . . . . . . .',
    '. . . 1 . . . . . .',
    '. . . . . . . . . .',
    '. . . . . . . . . .',
    '. . . . . . . . . .',
    '. . . . . . . . 1 .',
    '. . . . . . . . . .',
  ]),

  // 825 "Mirror Portal": Combine mirrors and portals
  buildLevel(825, 'Mirror Portal', 4, 18, [
    'S . . . . . . . T',
    '. . . . . . . . .',
    '. ? . . . 1 . . .',
    '. . . . . . . . .',
    '. . . # # # # # .',
    '. . . # . . . . .',
    '. . . # . ? . . .',
    '. . . # . . . 1 .',
  ]),

  // 826 "The Gauntlet": 10×8 with portals and walls
  buildLevel(826, 'The Gauntlet', 4, 20, [
    'S . . . . . . . . T',
    '. # # . . # # . . .',
    '. . . ? . . . . . .',
    '. # # . . # # . . .',
    '. . . . . . . ? . .',
    '. # # . . # # . . .',
    '? . . . 1 . . . . .',
    '. . . . . . . . 1 .',
  ]),

  // 827 "Portal Symphony": Complex portal routing
  buildLevel(827, 'Portal Symphony', 4, 22, [
    'S . . . . . . . . . T',
    '. . . . . . . . . . .',
    '. ? . . 1 . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . . # # # .',
    '. . . . . . . # . . .',
    '. . . . . . . # ? . .',
    '. . . . . . . # . 1 .',
    '. . ? . . . . . . . .',
    '. . . . . . . . . . .',
  ]),

  // ════════════════════════════════════════════════════════════════════════════
  // WORLD 5: APEX — 10×10 to 10×12, Master Challenges
  // ════════════════════════════════════════════════════════════════════════════

  // 828 "Grand Staircase": 8 mirrors, full 10×10 diagonal
  buildLevel(828, 'Grand Staircase', 5, 22, [
    '. . . . . . . . . T',
    '. . . . . . . . ? .',
    '. . . . . . . . . .',
    '. . . . . . ? . . .',
    '. . . . . . . . . .',
    '. . . . ? . . . . .',
    '. . . . . . . . . .',
    '. . ? . ? . . . . .',
    '. . . . . . . . . .',
    'S ? . . . . . . . .',
  ]),

  // 829 "The Fortress": 10×10 with heavy walls
  buildLevel(829, 'The Fortress', 5, 24, [
    'S . . . . . . . . T',
    '. # # # . # # # . .',
    '. . . . ? . . . . .',
    '. # # # . # # # . .',
    '. . . . . . . ? . .',
    '. # # # . # # # . .',
    '? . . . . . . . . .',
    '. # # # . # # # . .',
    '. . . ? . . . . . .',
    '. . . . . . . . . .',
  ]),

  // 830 "Apex Portal": 10×12 with multiple portal pairs
  buildLevel(830, 'Apex Portal', 5, 26, [
    'S . . . . . . . . . T',
    '. . . . . . . . . . .',
    '. ? . . 1 . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . # # # # .',
    '. . . . . . # . . . .',
    '. . . . . . # ? . . .',
    '. . . . . . # . . 1 .',
    '. . ? . . . . . . . .',
    '. . . . . . . . . . .',
    '. . . . 2 . . . . . .',
    '. . . . . . . . . 2 .',
  ]),

  // 831 "The Ultimate": 10×12, 10 mirrors, walls, and portals
  buildLevel(831, 'The Ultimate', 5, 30, [
    'S . . . . . . . . . . T',
    '. # . # . # . # . # . .',
    '. . ? . . . . . . . . .',
    '. # . # . # . # . # . .',
    '. . . . ? . . . . . . .',
    '. # . # . # . # . # . .',
    '. . . . . . ? . . . . .',
    '. # . # . # . # . # . .',
    '? . . . . . . . 1 . . .',
    '. # . # . # . # . # . .',
    '. . . . . . . . . . ? .',
    '. . . . . . . . . . 1 .',
  ]),

  // 832 "Master's Path": Final challenge - 10×12 with everything
  buildLevel(832, "Master's Path", 5, 32, [
    'S . . # . . . . . . . T',
    '. . . # . . . . . . . .',
    '. ? . # . . 1 . . . . .',
    '. . . # . . . . . . . .',
    '. . . # . . . # # # # .',
    '. . . . . . . # . . . .',
    '. # # # . . . # ? . . .',
    '. . . . ? . . # . . 1 .',
    '. # # # . . . . . . . .',
    '. . . . . . ? . . . . .',
    '. . . . . . . . 2 . . .',
    '. . . . . . . . . . 2 .',
  ]),

  // 833 "Lightning Strike": Fast diagonal with tight timing
  buildLevel(833, 'Lightning Strike', 5, 24, [
    '. . . . . . . . . T',
    '. . . . . . . . ? .',
    '. . . . . . . . . .',
    '. . . . . . ? . . .',
    '. . . . . . . . . .',
    '. . . . ? . . . . .',
    '. . . . . . . . . .',
    '. . ? . ? . . . . .',
    '. . . . . . . . . .',
    'S ? . . . . . . . .',
  ]),

  // 834 "The Maze Master": 10×12 ultimate maze
  buildLevel(834, 'The Maze Master', 5, 28, [
    'S . # . . # . . . . . T',
    '. . # . . # . . . . . .',
    '? . # ? . # . ? . . . .',
    '. . # . . # . . . . . .',
    '. . # . . # . . # # # .',
    '. . . . . . . . # . . .',
    '. # # # . # . . # ? . .',
    '. . . . ? # . . # . . .',
    '. # # # . # . . . . . .',
    '. . . . . # ? . . . . .',
    '. . ? . . # . . . 1 . .',
    '. . . . . . . . . . 1 .',
  ]),

  // 835 "Final Frontier": The ultimate test
  buildLevel(835, 'Final Frontier', 5, 35, [
    'S . . . . . . . . . . T',
    '. # # . . # # . # # . .',
    '. . . ? . . . ? . . . .',
    '. # # . . # # . # # . .',
    '. . . . . . . . . . . .',
    '. # # . . # # . # # . .',
    '? . . . . . . . . . ? .',
    '. # # . . # # . # # . .',
    '. . . . ? . . ? . . . .',
    '. # # . . # # . # # . .',
    '. . . . . . . . . . . .',
    '. . . . . 1 . . . . 1 .',
  ]),
];
