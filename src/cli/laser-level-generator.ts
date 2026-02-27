// LASER RELAY - Level Generator CLI
// Generates diverse, fun laser relay levels with multiple required moves
// Run with: npx tsx src/cli/laser-level-generator.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Types ────────────────────────────────────────────────────────────────────
interface Tile {
  id: string;
  type: 'path' | 'wall';
  x: number;
  y: number;
  connections: string[];
  canRotate: boolean;
  isGoalNode: boolean;
  displayData?: {
    kind: string;
    dir: string;
    rotation: number;
    beamOn: boolean;
    portalId?: string;
  };
}

interface Level {
  id: number;
  name: string;
  world: number;
  gridSize: number;
  tiles: Tile[];
  goalNodes: { x: number; y: number }[];
  maxMoves: number;
  compressionDelay: number;
  compressionEnabled: boolean;
  gridCols?: number;
  gridRows?: number;
}

// ── Mirror Reflection Tables ──────────────────────────────────────────────────
const SLASH: Record<string, string> = { right: 'up', up: 'right', left: 'down', down: 'left' };
const BACK: Record<string, string> = { right: 'down', down: 'right', left: 'up', up: 'left' };
const STEP: Record<string, { dx: number; dy: number }> = {
  right: { dx: 1, dy: 0 },
  left: { dx: -1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
};

// ── Beam Tracing Logic ────────────────────────────────────────────────────────
function traceBeam(
  tiles: Tile[],
  gridSize: number,
  gridCols?: number,
  gridRows?: number
): { beam: Set<string>; hitsTarget: boolean } {
  const cols = gridCols ?? gridSize;
  const rows = gridRows ?? gridSize;
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(`${t.x},${t.y}`, t);
  const source = tiles.find((t) => t.displayData?.kind === 'source');

  if (!source) return { beam: new Set(), hitsTarget: false };

  const portalMap = new Map<string, Tile[]>();
  for (const t of tiles) {
    if (t.displayData?.kind === 'portal') {
      const portalId = t.displayData?.portalId as string;
      if (portalId) {
        if (!portalMap.has(portalId)) portalMap.set(portalId, []);
        portalMap.get(portalId)!.push(t);
      }
    }
  }

  let x = source.x;
  let y = source.y;
  let dir = source.displayData!.dir as string;
  const beam = new Set<string>();
  let steps = 0;
  const maxSteps = cols * rows * 8;
  let hitsTarget = false;
  const visitedPortals = new Set<string>();

  while (steps++ < maxSteps) {
    const { dx, dy } = STEP[dir];
    x += dx;
    y += dy;

    if (x < 0 || y < 0 || x >= cols || y >= rows) break;

    const key = `${x},${y}`;
    const tile = map.get(key);

    if (!tile) continue;

    const kind = tile.displayData?.kind as string;

    if (kind === 'wall' || kind === 'source') break;

    beam.add(key);

    if (kind === 'target') {
      hitsTarget = true;
      break;
    }

    if (kind === 'mirror') {
      const rot = tile.displayData?.rotation as number;
      const nd = rot === 0 ? SLASH[dir] : BACK[dir];
      if (!nd) break;
      dir = nd;
    }

    if (kind === 'portal') {
      const portalId = tile.displayData?.portalId as string;
      const portalKey = `${portalId}-${x}-${y}`;
      if (portalId && !visitedPortals.has(portalKey)) {
        visitedPortals.add(portalKey);
        const portals = portalMap.get(portalId) || [];
        const otherPortal = portals.find((t) => t.x !== x || t.y !== y);
        if (otherPortal) {
          x = otherPortal.x;
          y = otherPortal.y;
          beam.add(`${x},${y}`);
        }
      }
    }
  }

  return { beam, hitsTarget };
}

// ── Level Builder ─────────────────────────────────────────────────────────────
function buildLevel(
  id: number,
  name: string,
  world: number,
  maxMoves: number,
  tiles: Tile[],
  gridCols: number,
  gridRows: number
): Level {
  return {
    id,
    name,
    world,
    gridSize: Math.max(gridCols, gridRows),
    tiles,
    goalNodes: [],
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
    gridCols,
    gridRows,
  };
}

function createTile(
  id: string,
  x: number,
  y: number,
  kind: string,
  dir: string = 'right',
  rotation: number = 0,
  portalId?: string
): Tile {
  return {
    id,
    type: kind === 'wall' ? 'wall' : 'path',
    x,
    y,
    connections: [],
    canRotate: kind === 'mirror',
    isGoalNode: kind === 'target',
    displayData: { kind, dir, rotation, beamOn: false, portalId },
  };
}

// ── Level Verification with brute force ───────────────────────────────────────
function verifyLevel(level: Level): {
  valid: boolean;
  error: string;
  mirrorCount: number;
  minMoves: number;
  solution?: number[];
} {
  const mirrors = level.tiles.filter((t) => t.displayData?.kind === 'mirror');
  const mirrorCount = mirrors.length;

  if (mirrorCount === 0)
    return { valid: false, error: 'No mirrors found', mirrorCount, minMoves: 0 };

  const initialResult = traceBeam(level.tiles, level.gridSize, level.gridCols, level.gridRows);
  if (initialResult.hitsTarget)
    return { valid: false, error: 'Already solved', mirrorCount, minMoves: 0 };

  // Brute force: try all 2^mirrorCount combinations
  const totalCombos = Math.pow(2, mirrorCount);
  let minMoves = Infinity;
  let bestSolution: number[] | undefined;

  for (let combo = 0; combo < totalCombos; combo++) {
    const solution: number[] = [];
    const solvedTiles = level.tiles.map((t) => {
      if (t.displayData?.kind === 'mirror') {
        const mirrorIdx = mirrors.indexOf(t);
        const rot = (combo >> mirrorIdx) & 1;
        solution.push(rot);
        return { ...t, displayData: { ...t.displayData, rotation: rot } };
      }
      return t;
    });

    if (traceBeam(solvedTiles, level.gridSize, level.gridCols, level.gridRows).hitsTarget) {
      // Count how many mirrors need to be flipped from initial state
      const moves = mirrors.filter((m, i) => {
        const initialRot = m.displayData?.rotation ?? 0;
        return initialRot !== solution[i];
      }).length;

      if (moves < minMoves) {
        minMoves = moves;
        bestSolution = solution;
      }
    }
  }

  if (bestSolution) {
    return { valid: true, error: '', mirrorCount, minMoves, solution: bestSolution };
  }

  return { valid: false, error: 'No valid solution found', mirrorCount, minMoves: 0 };
}

// ── Level Pattern Generators ──────────────────────────────────────────────────

/**
 * Simple L-shape: source -> mirror -> target
 * Can require 1 move if mirror starts wrong
 */
function generateSimpleL(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 1
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  const mirrorX = Math.floor(cols * 0.6);
  const targetY = sourceY - 2;

  // If requireMoves is 1, start with wrong rotation
  // / (rotation 0) reflects right->up
  // \ (rotation 1) reflects right->down
  const initialRot = requireMoves >= 1 ? 1 : 0;
  tiles.push(createTile(`lr${id}-m0`, mirrorX, sourceY, 'mirror', 'right', initialRot));
  tiles.push(createTile(`lr${id}-tgt`, mirrorX, targetY, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Double mirror: two mirrors in sequence
 * Path: right -> up -> right to target
 */
function generateDoubleMirror(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 2
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  const m1x = 2;
  // First mirror: right->up (solution: / = rotation 0)
  // Start wrong if required
  const m1rot = requireMoves >= 1 ? 1 : 0;
  tiles.push(createTile(`lr${id}-m0`, m1x, sourceY, 'mirror', 'right', m1rot));

  const m2y = 2;
  // Second mirror: up->right (solution: \ = rotation 1)
  // Start wrong if required
  const m2rot = requireMoves >= 2 ? 0 : 1;
  tiles.push(createTile(`lr${id}-m1`, m1x, m2y, 'mirror', 'up', m2rot));

  tiles.push(createTile(`lr${id}-tgt`, m1x + 2, m2y, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Triple mirror staircase
 * Path: right -> up -> right -> up -> target
 */
function generateTripleStair(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 3
): Level {
  const tiles: Tile[] = [];
  const sourceY = rows - 2;
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Mirror 1 at (2, sourceY): right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, 2, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // Mirror 2 at (2, sourceY-2): up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, 2, sourceY - 2, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Mirror 3 at (4, sourceY-2): right->up (solution: / = 0)
  tiles.push(
    createTile(`lr${id}-m2`, 4, sourceY - 2, 'mirror', 'right', requireMoves >= 3 ? 1 : 0)
  );

  tiles.push(createTile(`lr${id}-tgt`, 4, sourceY - 4, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * U-turn pattern
 */
function generateUTurn(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 3
): Level {
  const tiles: Tile[] = [];
  const sourceY = rows - 2;
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(
    createTile(`lr${id}-m0`, cols - 3, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0)
  );

  // Mirror 2: up->left (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, cols - 3, 2, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Mirror 3: left->down (solution: / = 0)
  tiles.push(createTile(`lr${id}-m2`, 2, 2, 'mirror', 'left', requireMoves >= 3 ? 1 : 0));

  tiles.push(createTile(`lr${id}-tgt`, 2, 4, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * With walls obstacle
 */
function generateWithWalls(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 3
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Wall in the middle with gap at top
  const wallX = Math.floor(cols / 2);
  for (let wy = 2; wy < rows; wy++) {
    tiles.push(createTile(`lr${id}-w${wy}`, wallX, wy, 'wall'));
  }

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, 2, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // Mirror 2: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, 2, 1, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Mirror 3: right->down (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m2`, wallX + 2, 1, 'mirror', 'right', requireMoves >= 3 ? 0 : 1));

  tiles.push(createTile(`lr${id}-tgt`, wallX + 2, 3, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Portal pattern
 */
function generatePortal(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 2
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, 2, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // Portal entrance
  tiles.push(createTile(`lr${id}-p1a`, 2, 2, 'portal', 'up', 0, 'A'));

  // Portal exit
  tiles.push(createTile(`lr${id}-p1b`, cols - 3, 2, 'portal', 'up', 0, 'A'));

  // Mirror 2: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, cols - 3, 1, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  tiles.push(createTile(`lr${id}-tgt`, cols - 1, 1, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Long shot with single mirror
 */
function generateLongShot(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 1
): Level {
  const tiles: Tile[] = [];
  tiles.push(createTile(`lr${id}-src`, 0, rows - 1, 'source', 'right'));

  // Single mirror at far right: right->up (solution: / = 0)
  tiles.push(
    createTile(`lr${id}-m0`, cols - 2, rows - 1, 'mirror', 'right', requireMoves >= 1 ? 1 : 0)
  );

  tiles.push(createTile(`lr${id}-tgt`, cols - 2, 1, 'target'));

  // Decorative walls
  for (let i = 3; i < cols - 4; i += 3) {
    tiles.push(createTile(`lr${id}-w${i}`, i, rows - 2, 'wall'));
  }

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Cross pattern
 */
function generateCross(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 1
): Level {
  const tiles: Tile[] = [];
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);

  tiles.push(createTile(`lr${id}-src`, 0, cy, 'source', 'right'));

  // Mirror at center: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, cx, cy, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  tiles.push(createTile(`lr${id}-tgt`, cx, 1, 'target'));

  // Walls around
  tiles.push(createTile(`lr${id}-w0`, cx - 1, cy - 1, 'wall'));
  tiles.push(createTile(`lr${id}-w1`, cx + 1, cy - 1, 'wall'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Zigzag pattern with 4 mirrors
 */
function generateZigzag(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 4
): Level {
  const tiles: Tile[] = [];
  const sourceY = rows - 2;
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, 2, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // Mirror 2: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, 2, sourceY - 2, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Mirror 3: right->up (solution: / = 0)
  tiles.push(
    createTile(`lr${id}-m2`, 4, sourceY - 2, 'mirror', 'right', requireMoves >= 3 ? 1 : 0)
  );

  // Mirror 4: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m3`, 4, sourceY - 4, 'mirror', 'up', requireMoves >= 4 ? 0 : 1));

  tiles.push(createTile(`lr${id}-tgt`, 6, sourceY - 4, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Spiral pattern
 */
function generateSpiral(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 4
): Level {
  const tiles: Tile[] = [];
  tiles.push(createTile(`lr${id}-src`, 0, 0, 'source', 'right'));

  // Mirror 1: right->down (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m0`, cols - 2, 0, 'mirror', 'right', requireMoves >= 1 ? 0 : 1));

  // Mirror 2: down->left (solution: / = 0)
  tiles.push(
    createTile(`lr${id}-m1`, cols - 2, rows - 2, 'mirror', 'down', requireMoves >= 2 ? 1 : 0)
  );

  // Mirror 3: left->up (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m2`, 1, rows - 2, 'mirror', 'left', requireMoves >= 3 ? 0 : 1));

  // Mirror 4: up->right (solution: / = 0)
  tiles.push(createTile(`lr${id}-m3`, 1, 2, 'mirror', 'up', requireMoves >= 4 ? 1 : 0));

  tiles.push(createTile(`lr${id}-tgt`, 3, 2, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Double back pattern
 */
function generateDoubleBack(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 3
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(
    createTile(
      `lr${id}-m0`,
      Math.floor(cols / 2),
      sourceY,
      'mirror',
      'right',
      requireMoves >= 1 ? 1 : 0
    )
  );

  // Mirror 2: up->left (solution: \ = 1)
  tiles.push(
    createTile(`lr${id}-m1`, Math.floor(cols / 2), 2, 'mirror', 'up', requireMoves >= 2 ? 0 : 1)
  );

  // Mirror 3: left->down (solution: / = 0)
  tiles.push(createTile(`lr${id}-m2`, 2, 2, 'mirror', 'left', requireMoves >= 3 ? 1 : 0));

  tiles.push(createTile(`lr${id}-tgt`, 2, sourceY - 1, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Complex multi-path with decoy mirrors
 */
function generateDecoyPath(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 3
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Decoy mirror (not in solution path)
  tiles.push(createTile(`lr${id}-d0`, 1, sourceY - 1, 'mirror', 'right', 0));

  // Real path mirrors
  // Mirror 1: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, 3, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // Mirror 2: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, 3, 2, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Mirror 3: right->down (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m2`, 6, 2, 'mirror', 'right', requireMoves >= 3 ? 0 : 1));

  tiles.push(createTile(`lr${id}-tgt`, 6, 4, 'target'));

  // More decoys
  tiles.push(createTile(`lr${id}-d1`, 5, 3, 'mirror', 'right', 1));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Diamond pattern - beam goes around in a diamond shape
 */
function generateDiamond(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 4
): Level {
  const tiles: Tile[] = [];
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);

  tiles.push(createTile(`lr${id}-src`, 0, cy, 'source', 'right'));

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, cx - 2, cy, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // Mirror 2: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, cx - 2, cy - 2, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Mirror 3: right->down (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m2`, cx, cy - 2, 'mirror', 'right', requireMoves >= 3 ? 0 : 1));

  // Mirror 4: down->right (solution: / = 0)
  tiles.push(createTile(`lr${id}-m3`, cx, cy, 'mirror', 'down', requireMoves >= 4 ? 1 : 0));

  tiles.push(createTile(`lr${id}-tgt`, cx + 2, cy, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Split path with walls - must navigate around obstacles
 */
function generateMazePath(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 4
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Create wall obstacles - leave gaps for beam path
  const wallX1 = Math.floor(cols / 3);
  const wallX2 = Math.floor((2 * cols) / 3);

  // First wall with gap at row 1 (top)
  for (let y = 2; y < rows; y++) {
    tiles.push(createTile(`lr${id}-w1-${y}`, wallX1, y, 'wall'));
  }

  // Second wall with gap at bottom (rows-3 area)
  for (let y = 0; y < rows - 3; y++) {
    tiles.push(createTile(`lr${id}-w2-${y}`, wallX2, y, 'wall'));
  }

  // Path: source -> m0 (right->up) -> m1 (up->right) -> through gap in wall1
  //       -> m2 (right->down) -> through gap in wall2 -> m3 (down->right) -> target

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, 2, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // Mirror 2: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, 2, 1, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Mirror 3: right->down (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m2`, wallX1 + 2, 1, 'mirror', 'right', requireMoves >= 3 ? 0 : 1));

  // Mirror 4: down->right (solution: / = 0)
  tiles.push(
    createTile(`lr${id}-m3`, wallX1 + 2, rows - 3, 'mirror', 'down', requireMoves >= 4 ? 1 : 0)
  );

  // Target to the right of wall2 gap
  tiles.push(createTile(`lr${id}-tgt`, wallX2 + 2, rows - 3, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Extended zigzag with 5+ mirrors
 */
function generateExtendedZigzag(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  mirrorCount: number = 5,
  requireMoves: number = 5
): Level {
  const tiles: Tile[] = [];
  const sourceY = rows - 2;
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  let x = 2;
  let y = sourceY;

  for (let i = 0; i < mirrorCount; i++) {
    const isEven = i % 2 === 0;
    // Even mirrors: right->up or up->right (solution: / = 0 for right->up, \ = 1 for up->right)
    // Odd mirrors: up->right or right->up (solution: \ = 1 for up->right, / = 0 for right->up)

    if (isEven) {
      // right->up requires / (rotation 0)
      tiles.push(createTile(`lr${id}-m${i}`, x, y, 'mirror', 'right', requireMoves > i ? 1 : 0));
      y -= 2;
    } else {
      // up->right requires \ (rotation 1)
      tiles.push(createTile(`lr${id}-m${i}`, x, y, 'mirror', 'up', requireMoves > i ? 0 : 1));
      x += 2;
    }
  }

  // Target at the end
  tiles.push(createTile(`lr${id}-tgt`, x, y, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Double portal challenge - simpler version that works
 */
function generateDoublePortal(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  requireMoves: number = 3
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));

  // Mirror 1: right->up (solution: / = 0)
  tiles.push(createTile(`lr${id}-m0`, 2, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));

  // First portal pair - beam goes up into portal A
  tiles.push(createTile(`lr${id}-p1a`, 2, 2, 'portal', 'up', 0, 'A'));
  // Portal A exits at right side
  tiles.push(createTile(`lr${id}-p1b`, cols - 3, 2, 'portal', 'up', 0, 'A'));

  // Mirror 2: up->right (solution: \ = 1)
  tiles.push(createTile(`lr${id}-m1`, cols - 3, 1, 'mirror', 'up', requireMoves >= 2 ? 0 : 1));

  // Target to the right
  tiles.push(createTile(`lr${id}-tgt`, cols - 1, 1, 'target'));

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

// ── Level Definitions ─────────────────────────────────────────────────────────

interface LevelDef {
  id: number;
  name: string;
  world: number;
  cols: number;
  rows: number;
  pattern:
    | 'L'
    | 'D'
    | 'T'
    | 'U'
    | 'W'
    | 'P'
    | 'Lg'
    | 'C'
    | 'Z'
    | 'Sp'
    | 'DB'
    | 'Dc'
    | 'Dm'
    | 'Mp'
    | 'EZ'
    | 'DP';
  maxMoves: number;
  requireMoves?: number;
  mirrorCount?: number;
}

const LEVEL_DEFS: LevelDef[] = [
  // World 1: PRISM - Introductory levels (1-2 mirrors, 1-2 required moves)
  {
    id: 801,
    name: 'First Steps',
    world: 1,
    cols: 5,
    rows: 5,
    pattern: 'L',
    maxMoves: 3,
    requireMoves: 1,
  },
  {
    id: 802,
    name: 'Corner Turn',
    world: 1,
    cols: 6,
    rows: 5,
    pattern: 'L',
    maxMoves: 3,
    requireMoves: 1,
  },
  {
    id: 803,
    name: 'Simple Path',
    world: 1,
    cols: 6,
    rows: 6,
    pattern: 'D',
    maxMoves: 4,
    requireMoves: 2,
  },
  {
    id: 804,
    name: 'Up & Over',
    world: 1,
    cols: 7,
    rows: 6,
    pattern: 'T',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 805,
    name: 'The Bend',
    world: 1,
    cols: 7,
    rows: 7,
    pattern: 'D',
    maxMoves: 4,
    requireMoves: 2,
  },
  {
    id: 806,
    name: 'Short Cut',
    world: 1,
    cols: 8,
    rows: 6,
    pattern: 'C',
    maxMoves: 3,
    requireMoves: 1,
  },

  // World 2: REFRACT - Getting trickier (2-3 mirrors, 2-3 required moves)
  {
    id: 807,
    name: 'Zigzag',
    world: 2,
    cols: 8,
    rows: 7,
    pattern: 'Z',
    maxMoves: 6,
    requireMoves: 3,
  },
  {
    id: 808,
    name: 'Diagonal Run',
    world: 2,
    cols: 9,
    rows: 7,
    pattern: 'D',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 809,
    name: 'Wall Bounce',
    world: 2,
    cols: 9,
    rows: 8,
    pattern: 'W',
    maxMoves: 6,
    requireMoves: 3,
  },
  {
    id: 810,
    name: 'The Hook',
    world: 2,
    cols: 10,
    rows: 8,
    pattern: 'U',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 811,
    name: 'Cross Fire',
    world: 2,
    cols: 10,
    rows: 8,
    pattern: 'Dc',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 812,
    name: 'Long Shot',
    world: 2,
    cols: 11,
    rows: 7,
    pattern: 'Lg',
    maxMoves: 3,
    requireMoves: 1,
  },
  {
    id: 813,
    name: 'Switchback',
    world: 2,
    cols: 11,
    rows: 9,
    pattern: 'T',
    maxMoves: 6,
    requireMoves: 3,
  },

  // World 3: GAUNTLET - Challenging (3-4 mirrors, 3-4 required moves)
  {
    id: 814,
    name: 'Spiral In',
    world: 3,
    cols: 10,
    rows: 10,
    pattern: 'Sp',
    maxMoves: 6,
    requireMoves: 3,
  },
  {
    id: 815,
    name: 'Double Back',
    world: 3,
    cols: 11,
    rows: 9,
    pattern: 'DB',
    maxMoves: 6,
    requireMoves: 3,
  },
  {
    id: 816,
    name: 'Maze Runner',
    world: 3,
    cols: 12,
    rows: 10,
    pattern: 'Mp',
    maxMoves: 7,
    requireMoves: 4,
  },
  {
    id: 817,
    name: 'The Gauntlet',
    world: 3,
    cols: 12,
    rows: 11,
    pattern: 'Z',
    maxMoves: 8,
    requireMoves: 4,
  },
  {
    id: 818,
    name: 'Deep Dive',
    world: 3,
    cols: 13,
    rows: 10,
    pattern: 'D',
    maxMoves: 6,
    requireMoves: 3,
  },
  {
    id: 819,
    name: 'Complex Turn',
    world: 3,
    cols: 13,
    rows: 11,
    pattern: 'U',
    maxMoves: 6,
    requireMoves: 3,
  },
  {
    id: 820,
    name: 'The Web',
    world: 3,
    cols: 14,
    rows: 12,
    pattern: 'Sp',
    maxMoves: 8,
    requireMoves: 4,
  },

  // World 4: NEXUS - Portal challenges (2-3 required moves with portals)
  {
    id: 821,
    name: 'Portal Jump',
    world: 4,
    cols: 10,
    rows: 8,
    pattern: 'P',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 822,
    name: 'Warp Zone',
    world: 4,
    cols: 11,
    rows: 9,
    pattern: 'P',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 823,
    name: 'Teleport Maze',
    world: 4,
    cols: 12,
    rows: 10,
    pattern: 'P',
    maxMoves: 6,
    requireMoves: 3,
  },
  {
    id: 824,
    name: 'Portal Master',
    world: 4,
    cols: 13,
    rows: 10,
    pattern: 'DP',
    maxMoves: 7,
    requireMoves: 3,
  },
  {
    id: 825,
    name: 'Dimension Shift',
    world: 4,
    cols: 14,
    rows: 11,
    pattern: 'DP',
    maxMoves: 7,
    requireMoves: 3,
  },
  {
    id: 826,
    name: 'Quantum Leap',
    world: 4,
    cols: 14,
    rows: 12,
    pattern: 'DP',
    maxMoves: 8,
    requireMoves: 4,
  },
  {
    id: 827,
    name: 'Nexus Core',
    world: 4,
    cols: 15,
    rows: 12,
    pattern: 'DP',
    maxMoves: 8,
    requireMoves: 4,
  },

  // World 5: APEX - Master challenges (4-5 mirrors, 4-5 required moves)
  {
    id: 828,
    name: 'Grand Spiral',
    world: 5,
    cols: 14,
    rows: 14,
    pattern: 'Sp',
    maxMoves: 8,
    requireMoves: 4,
  },
  {
    id: 829,
    name: 'Fortress',
    world: 5,
    cols: 15,
    rows: 13,
    pattern: 'Mp',
    maxMoves: 10,
    requireMoves: 5,
  },
  {
    id: 830,
    name: 'Apex Climb',
    world: 5,
    cols: 16,
    rows: 14,
    pattern: 'EZ',
    maxMoves: 10,
    requireMoves: 5,
    mirrorCount: 5,
  },
  {
    id: 831,
    name: 'Ultimate Path',
    world: 5,
    cols: 16,
    rows: 15,
    pattern: 'Dm',
    maxMoves: 10,
    requireMoves: 5,
  },
  {
    id: 832,
    name: "Master's Web",
    world: 5,
    cols: 17,
    rows: 14,
    pattern: 'Sp',
    maxMoves: 10,
    requireMoves: 5,
  },
  {
    id: 833,
    name: 'Lightning',
    world: 5,
    cols: 17,
    rows: 15,
    pattern: 'Lg',
    maxMoves: 4,
    requireMoves: 2,
  },
  {
    id: 834,
    name: 'The Labyrinth',
    world: 5,
    cols: 18,
    rows: 16,
    pattern: 'Mp',
    maxMoves: 12,
    requireMoves: 6,
  },
  {
    id: 835,
    name: 'Final Frontier',
    world: 5,
    cols: 20,
    rows: 16,
    pattern: 'EZ',
    maxMoves: 12,
    requireMoves: 6,
    mirrorCount: 6,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function printBoard(level: Level, mirrorRotations?: number[]): void {
  let tiles = level.tiles;
  if (mirrorRotations) {
    const mirrors = tiles.filter((t) => t.displayData?.kind === 'mirror');
    tiles = tiles.map((t) => {
      if (t.displayData?.kind === 'mirror') {
        const idx = mirrors.indexOf(t);
        if (idx >= 0 && idx < mirrorRotations.length) {
          return { ...t, displayData: { ...t.displayData, rotation: mirrorRotations[idx] } };
        }
      }
      return t;
    });
  }

  const { beam, hitsTarget } = traceBeam(tiles, level.gridSize, level.gridCols, level.gridRows);
  const tileMap = new Map<string, Tile>();
  for (const t of tiles) tileMap.set(`${t.x},${t.y}`, t);

  const cols = level.gridCols || level.gridSize;
  const rows = level.gridRows || level.gridSize;

  console.log(`  ┌${'──'.repeat(cols)}┐`);

  for (let y = 0; y < rows; y++) {
    let row = '  │';
    for (let x = 0; x < cols; x++) {
      const tile = tileMap.get(`${x},${y}`);
      const isBeam = beam.has(`${x},${y}`);

      if (!tile) {
        row += isBeam ? `${colors.yellow}██${colors.reset}` : '  ';
      } else {
        const kind = tile.displayData?.kind;
        const rot = tile.displayData?.rotation;

        let char = '  ';
        if (kind === 'source') {
          const dir = tile.displayData?.dir;
          const arrow = dir === 'right' ? '▶' : dir === 'down' ? '▼' : dir === 'left' ? '◀' : '▲';
          char = `${colors.cyan}${arrow}${arrow}${colors.reset}`;
        } else if (kind === 'target') {
          char = `${colors.green}★★${colors.reset}`;
        } else if (kind === 'wall') {
          char = `${colors.red}██${colors.reset}`;
        } else if (kind === 'mirror') {
          const m = rot === 0 ? '/' : '\\';
          char = isBeam
            ? `${colors.yellow}${m}${m}${colors.reset}`
            : `${colors.magenta}${m}${m}${colors.reset}`;
        } else if (kind === 'portal') {
          const pid = tile.displayData?.portalId;
          char = `${colors.blue}[${pid}]${colors.reset}`;
        } else {
          char = isBeam ? `${colors.yellow}~~${colors.reset}` : '  ';
        }
        row += char;
      }
    }
    row += '│';
    console.log(row);
  }

  console.log(`  └${'──'.repeat(cols)}┘`);
  console.log(
    `  Beam ${hitsTarget ? `${colors.green}HITS${colors.reset}` : `${colors.red}MISSES${colors.reset}`}`
  );
}

async function main() {
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  LASER RELAY LEVEL GENERATOR v4${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  const validLevels: Level[] = [];
  const invalidLevels: { id: number; name: string; error: string }[] = [];

  for (const def of LEVEL_DEFS) {
    console.log(`${colors.bold}Level ${def.id} "${def.name}"${colors.reset}`);
    console.log(
      `  Pattern: ${def.pattern}, Size: ${def.cols}x${def.rows}, Required Moves: ${def.requireMoves}`
    );

    let level: Level | null = null;
    const requireMoves = def.requireMoves ?? 1;

    switch (def.pattern) {
      case 'L':
        level = generateSimpleL(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'D':
        level = generateDoubleMirror(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'T':
        level = generateTripleStair(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'U':
        level = generateUTurn(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'W':
        level = generateWithWalls(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'P':
        level = generatePortal(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'Lg':
        level = generateLongShot(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'C':
        level = generateCross(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'Z':
        level = generateZigzag(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'Sp':
        level = generateSpiral(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'DB':
        level = generateDoubleBack(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'Dc':
        level = generateDecoyPath(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'Dm':
        level = generateDiamond(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'Mp':
        level = generateMazePath(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
      case 'EZ':
        level = generateExtendedZigzag(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          def.mirrorCount ?? 5,
          requireMoves
        );
        break;
      case 'DP':
        level = generateDoublePortal(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          requireMoves
        );
        break;
    }

    if (!level) {
      console.log(`  ${colors.red}✗ FAILED TO GENERATE${colors.reset}\n`);
      invalidLevels.push({ id: def.id, name: def.name, error: 'Failed to generate' });
      continue;
    }

    const verification = verifyLevel(level);
    console.log(
      `  Mirrors: ${verification.mirrorCount}, Min Moves to Solve: ${verification.minMoves}`
    );

    if (verification.valid) {
      if (verification.minMoves < requireMoves) {
        console.log(
          `  ${colors.yellow}⚠ WARNING: Level only requires ${verification.minMoves} moves (expected ${requireMoves})${colors.reset}`
        );
      }
      console.log(`  ${colors.green}✓ VALID${colors.reset}`);
      validLevels.push(level);

      console.log(`\n  ${colors.bold}Initial State:${colors.reset}`);
      printBoard(level);
      console.log(`\n  ${colors.bold}Solved State:${colors.reset}`);
      printBoard(level, verification.solution);
    } else {
      console.log(`  ${colors.red}✗ INVALID: ${verification.error}${colors.reset}`);
      invalidLevels.push({ id: def.id, name: def.name, error: verification.error });
      console.log(`\n  ${colors.bold}Board:${colors.reset}`);
      printBoard(level);
    }
    console.log('');
  }

  console.log(`\n${colors.bold}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}SUMMARY${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════${colors.reset}\n`);
  console.log(`Valid levels: ${colors.green}${validLevels.length}${colors.reset}`);
  console.log(`Invalid levels: ${colors.red}${invalidLevels.length}${colors.reset}`);

  if (invalidLevels.length > 0) {
    console.log(`\n${colors.red}Invalid levels:${colors.reset}`);
    for (const { id, name, error } of invalidLevels) {
      console.log(`  ${id} "${name}": ${error}`);
    }
  }

  if (validLevels.length > 0) {
    console.log(`\n${colors.green}Generated ${validLevels.length} valid levels!${colors.reset}`);

    const levelsPath = path.join(__dirname, '../game/modes/laserRelay/levels.ts');
    const fileContent = `// LASER RELAY LEVELS - Auto-generated by laser-level-generator.ts
// Run: npx tsx src/cli/laser-level-generator.ts

import type { Level } from '../../types';

export const LASER_LEVELS: Level[] = [
${validLevels.map((level) => `  ${JSON.stringify(level)}`).join(',\n')}
];

export const LASER_WORLDS = [
  { id: 1, name: 'PRISM', tagline: 'Introductory levels', color: '#06b6d4', icon: '🔷' },
  { id: 2, name: 'REFRACT', tagline: 'Getting trickier', color: '#8b5cf6', icon: '💎' },
  { id: 3, name: 'GAUNTLET', tagline: 'Challenging puzzles', color: '#f59e0b', icon: '⚡' },
  { id: 4, name: 'NEXUS', tagline: 'Portal challenges', color: '#ec4899', icon: '🌀' },
  { id: 5, name: 'APEX', tagline: 'Master challenges', color: '#ef4444', icon: '🏆' },
];

export const LASER_LEVEL_MAP = new Map<number, Level>(LASER_LEVELS.map(level => [level.id, level]));

export function getLevelsByWorld(world: number): Level[] {
  return LASER_LEVELS.filter(level => level.world === world);
}

export function getTotalLevelCount(): number {
  return LASER_LEVELS.length;
}
`;

    fs.writeFileSync(levelsPath, fileContent);
    console.log(
      `\n${colors.green}✓ Written ${validLevels.length} levels to ${levelsPath}${colors.reset}`
    );
  }
}

main().catch(console.error);
