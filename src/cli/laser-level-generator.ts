// LASER RELAY - Level Generator CLI
// Generates diverse laser relay levels with multiple required moves
// Run with: npx tsx src/cli/laser-level-generator.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  compressionEnabled?: boolean;
  compressionDirection?: string;
  gridCols?: number;
  gridRows?: number;
}

interface Compression {
  delay: number;
  direction: string;
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
  gridRows: number,
  compression?: Compression
): Level {
  return {
    id,
    name,
    world,
    gridSize: Math.max(gridCols, gridRows),
    tiles,
    goalNodes: [],
    maxMoves,
    compressionDelay: compression?.delay ?? 999999,
    compressionEnabled: compression !== undefined ? true : undefined,
    compressionDirection: compression?.direction,
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

// ── Level Verification ────────────────────────────────────────────────────────
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

  if (bestSolution)
    return { valid: true, error: '', mirrorCount, minMoves, solution: bestSolution };
  return { valid: false, error: 'No valid solution found', mirrorCount, minMoves: 0 };
}

// ── Beam Path Traversal (includes empty cells) ───────────────────────────────
/**
 * Returns ALL cells the beam traverses, including empty space between tiles.
 * Needed for decoy placement — traceBeam skips empty cells, which would let
 * addDecoys accidentally block the beam path with a decoy mirror.
 */
function getFullBeamPath(tiles: Tile[], cols: number, rows: number): Set<string> {
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(`${t.x},${t.y}`, t);
  const source = tiles.find((t) => t.displayData?.kind === 'source');
  if (!source) return new Set();

  let x = source.x,
    y = source.y;
  let dir = source.displayData!.dir;
  const path = new Set<string>();
  let steps = 0;

  while (steps++ < cols * rows * 4) {
    const { dx, dy } = STEP[dir];
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= cols || y >= rows) break;
    path.add(`${x},${y}`); // track BEFORE tile check — includes empty cells
    const tile = map.get(`${x},${y}`);
    if (!tile) continue;
    const kind = tile.displayData?.kind;
    if (kind === 'wall' || kind === 'source') break;
    if (kind === 'target') break;
    if (kind === 'mirror') {
      const rot = tile.displayData?.rotation ?? 0;
      const nd = rot === 0 ? SLASH[dir] : BACK[dir];
      if (!nd) break;
      dir = nd;
    }
  }
  return path;
}

// ── Decoy Placement ───────────────────────────────────────────────────────────
/**
 * Place extra non-solution mirrors in empty grid areas.
 * Uses the full beam traversal path (including empty cells) to avoid blocking it.
 */
function addDecoys(
  tiles: Tile[],
  used: Set<string>,
  solvedBeam: Set<string>,
  id: number,
  count: number,
  cols: number,
  rows: number
): void {
  // Candidate spots spread across the grid, avoiding edges
  const candidates: [number, number][] = [
    [cols - 3, rows - 3],
    [Math.round(cols * 0.65), Math.round(rows * 0.35)],
    [Math.round(cols * 0.75), Math.round(rows * 0.65)],
    [Math.round(cols * 0.45), rows - 4],
    [cols - 4, Math.round(rows * 0.5)],
    [Math.round(cols * 0.55), 2],
    [Math.round(cols * 0.4), Math.round(rows * 0.4)],
    [cols - 5, rows - 5],
  ];

  let placed = 0;
  for (const [px, py] of candidates) {
    if (placed >= count) break;
    const cx = Math.max(1, Math.min(cols - 2, px));
    const cy = Math.max(1, Math.min(rows - 2, py));
    if (!used.has(`${cx},${cy}`) && !solvedBeam.has(`${cx},${cy}`)) {
      // Deterministic rotation that looks plausible but isn't the solution
      const rot = (cx + cy * 3) % 2;
      tiles.push(createTile(`lr${id}-dec${placed}`, cx, cy, 'mirror', 'right', rot));
      used.add(`${cx},${cy}`);
      placed++;
    }
  }
}

// ── Level Pattern Generators ──────────────────────────────────────────────────

/**
 * Simple L-shape: source → 1 mirror → target. Always 1 required move.
 */
function generateSimpleL(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number
): Level {
  const tiles: Tile[] = [];
  const sourceY = Math.floor(rows / 2);
  tiles.push(createTile(`lr${id}-src`, 0, sourceY, 'source', 'right'));
  const mirrorX = Math.floor(cols * 0.6);
  tiles.push(createTile(`lr${id}-m0`, mirrorX, sourceY, 'mirror', 'right', 1)); // BACK=wrong
  tiles.push(createTile(`lr${id}-tgt`, mirrorX, sourceY - 2, 'target'));
  return buildLevel(id, name, world, maxMoves, tiles, cols, rows);
}

/**
 * Ascending Serpentine: source at bottom-left, beam staircase goes UP-RIGHT.
 *
 * Correct rotation = SLASH(0) for all mirrors (right→up, up→right).
 * Wrong rotation = BACK(1) sends beam into a blocking wall.
 * - Even mirrors: BACK sends right→down → wall below blocks it.
 * - Odd mirrors: BACK sends up→left → wall to left blocks it.
 *
 * Independent x/y spacing fills the grid well for all grid sizes.
 * requireMoves mirrors start wrong; rest start correct.
 * Decoys (optional): extra non-path mirrors placed in empty areas.
 */
function generateSerpentine(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  mirrorCount: number = 4,
  requireMoves: number = 4,
  decoys: number = 0,
  compression?: Compression
): Level {
  const tiles: Tile[] = [];
  const used = new Set<string>();
  const place = (tile: Tile) => {
    const k = `${tile.x},${tile.y}`;
    if (!used.has(k)) {
      used.add(k);
      tiles.push(tile);
    }
  };

  place(createTile(`lr${id}-src`, 0, rows - 2, 'source', 'right'));

  // Independent spacing fills grid in both dimensions
  const oddCount = Math.floor(mirrorCount / 2);
  const evenCount = Math.ceil(mirrorCount / 2);
  const xs = oddCount > 0 ? Math.max(2, Math.floor((cols - 3) / oddCount)) : 2;
  const ys = evenCount > 0 ? Math.max(2, Math.floor((rows - 3) / evenCount)) : 2;

  let x = 2,
    y = rows - 2;

  for (let i = 0; i < mirrorCount; i++) {
    const rot = i < requireMoves ? 1 : 0; // BACK(1)=wrong, SLASH(0)=correct
    if (i % 2 === 0) {
      // Even: beam right → SLASH:right→up (correct), BACK:right→down (wrong→wall below)
      place(createTile(`lr${id}-m${i}`, x, y, 'mirror', 'right', rot));
      if (y + 1 < rows) place(createTile(`lr${id}-wb${i}`, x, y + 1, 'wall'));
      y -= ys;
    } else {
      // Odd: beam up → SLASH:up→right (correct), BACK:up→left (wrong→wall left)
      place(createTile(`lr${id}-m${i}`, x, y, 'mirror', 'up', rot));
      if (x - 1 >= 0) place(createTile(`lr${id}-wb${i}`, x - 1, y, 'wall'));
      x += xs;
    }
  }

  place(createTile(`lr${id}-tgt`, x, y, 'target'));

  if (decoys > 0) {
    // Compute full beam traversal (including empty cells) to avoid blocking path
    const solvedTiles = tiles.map((t) =>
      t.displayData?.kind === 'mirror'
        ? { ...t, displayData: { ...t.displayData, rotation: 0 } }
        : t
    );
    const beamPath = getFullBeamPath(solvedTiles, cols, rows);
    addDecoys(tiles, used, beamPath, id, decoys, cols, rows);
  }

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows, compression);
}

/**
 * Descending Serpentine: source at top-left, beam staircase goes DOWN-RIGHT.
 * Visually opposite of the ascending pattern.
 *
 * Correct rotation = BACK(1) for all mirrors (right→down, down→right).
 * Wrong rotation = SLASH(0) sends beam into a blocking wall.
 * - Even mirrors: SLASH sends right→up → wall above blocks it.
 * - Odd mirrors: SLASH sends down→left → wall to left blocks it.
 */
function generateSerpentineDown(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  maxMoves: number,
  mirrorCount: number = 4,
  requireMoves: number = 4,
  decoys: number = 0,
  compression?: Compression
): Level {
  const tiles: Tile[] = [];
  const used = new Set<string>();
  const place = (tile: Tile) => {
    const k = `${tile.x},${tile.y}`;
    if (!used.has(k)) {
      used.add(k);
      tiles.push(tile);
    }
  };

  place(createTile(`lr${id}-src`, 0, 1, 'source', 'right'));

  const oddCount = Math.floor(mirrorCount / 2);
  const evenCount = Math.ceil(mirrorCount / 2);
  const xs = oddCount > 0 ? Math.max(2, Math.floor((cols - 3) / oddCount)) : 2;
  const ys = evenCount > 0 ? Math.max(2, Math.floor((rows - 3) / evenCount)) : 2;

  let x = 2,
    y = 1;

  for (let i = 0; i < mirrorCount; i++) {
    const rot = i < requireMoves ? 0 : 1; // SLASH(0)=wrong, BACK(1)=correct
    if (i % 2 === 0) {
      // Even: beam right → BACK:right→down (correct), SLASH:right→up (wrong→wall above)
      place(createTile(`lr${id}-m${i}`, x, y, 'mirror', 'right', rot));
      if (y - 1 >= 0) place(createTile(`lr${id}-wb${i}`, x, y - 1, 'wall'));
      y += ys;
    } else {
      // Odd: beam down → BACK:down→right (correct), SLASH:down→left (wrong→wall left)
      place(createTile(`lr${id}-m${i}`, x, y, 'mirror', 'down', rot));
      if (x - 1 >= 0) place(createTile(`lr${id}-wb${i}`, x - 1, y, 'wall'));
      x += xs;
    }
  }

  place(createTile(`lr${id}-tgt`, x, y, 'target'));

  if (decoys > 0) {
    // Compute full beam traversal (including empty cells) to avoid blocking path
    const solvedTiles = tiles.map((t) =>
      t.displayData?.kind === 'mirror'
        ? { ...t, displayData: { ...t.displayData, rotation: 1 } }
        : t
    );
    const beamPath = getFullBeamPath(solvedTiles, cols, rows);
    addDecoys(tiles, used, beamPath, id, decoys, cols, rows);
  }

  return buildLevel(id, name, world, maxMoves, tiles, cols, rows, compression);
}

/**
 * Portal: source → M0(right→up) → portal teleport → M1(up→right) → target
 * Blocking walls guarantee exactly 2 required flips.
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

  // M0: correct=SLASH(0) right→up, wrong=BACK(1) right→down, wall below
  tiles.push(createTile(`lr${id}-m0`, 2, sourceY, 'mirror', 'right', requireMoves >= 1 ? 1 : 0));
  if (sourceY + 1 < rows) tiles.push(createTile(`lr${id}-wb0`, 2, sourceY + 1, 'wall'));

  // Portal pair: beam goes up into portal, exits at far right side
  const exitX = cols - 3;
  tiles.push(createTile(`lr${id}-p1a`, 2, 2, 'portal', 'up', 0, 'A'));
  tiles.push(createTile(`lr${id}-p1b`, exitX, 2, 'portal', 'up', 0, 'A'));

  // M1: correct=SLASH(0) up→right, wrong=BACK(1) up→left, wall to left
  tiles.push(createTile(`lr${id}-m1`, exitX, 1, 'mirror', 'up', requireMoves >= 2 ? 1 : 0));
  if (exitX - 1 >= 0) tiles.push(createTile(`lr${id}-wb1`, exitX - 1, 1, 'wall'));

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
  /** Sn=ascending staircase, Sd=descending staircase, P=portal */
  pattern: 'L' | 'Sn' | 'Sd' | 'P';
  maxMoves: number;
  requireMoves?: number;
  mirrorCount?: number;
  /** Extra non-path mirrors scattered around the grid */
  decoys?: number;
  /** Add wall compression with this delay and direction */
  compression?: { delay: number; direction: string };
}

const LEVEL_DEFS: LevelDef[] = [
  // ── World 1: PRISM — Learn the basics (1-3 mirrors, simple patterns) ────────
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
    pattern: 'Sn',
    maxMoves: 4,
    requireMoves: 2,
    mirrorCount: 2,
  },
  {
    id: 803,
    name: 'Step Up',
    world: 1,
    cols: 7,
    rows: 6,
    pattern: 'Sn',
    maxMoves: 5,
    requireMoves: 2,
    mirrorCount: 2,
  },
  {
    id: 804,
    name: 'Triple Bounce',
    world: 1,
    cols: 7,
    rows: 7,
    pattern: 'Sn',
    maxMoves: 6,
    requireMoves: 3,
    mirrorCount: 3,
  },
  {
    id: 805,
    name: 'The Climb',
    world: 1,
    cols: 8,
    rows: 7,
    pattern: 'Sn',
    maxMoves: 6,
    requireMoves: 3,
    mirrorCount: 3,
  },
  {
    id: 806,
    name: 'Short Circuit',
    world: 1,
    cols: 9,
    rows: 8,
    pattern: 'Sd',
    maxMoves: 7,
    requireMoves: 3,
    mirrorCount: 3,
  },

  // ── World 2: REFRACT — Mix of ascending + descending + portal ──────────────
  {
    id: 807,
    name: 'Four Mirrors',
    world: 2,
    cols: 8,
    rows: 7,
    pattern: 'Sn',
    maxMoves: 6,
    requireMoves: 3,
    mirrorCount: 4,
  },
  {
    id: 808,
    name: 'Portal Leap',
    world: 2,
    cols: 9,
    rows: 7,
    pattern: 'P',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 809,
    name: 'Cascade',
    world: 2,
    cols: 9,
    rows: 8,
    pattern: 'Sd',
    maxMoves: 7,
    requireMoves: 4,
    mirrorCount: 4,
  },
  {
    id: 810,
    name: 'Long Stair',
    world: 2,
    cols: 10,
    rows: 8,
    pattern: 'Sn',
    maxMoves: 7,
    requireMoves: 3,
    mirrorCount: 4,
  },
  {
    id: 811,
    name: 'Downfall',
    world: 2,
    cols: 10,
    rows: 9,
    pattern: 'Sd',
    maxMoves: 8,
    requireMoves: 4,
    mirrorCount: 4,
  },
  {
    id: 812,
    name: 'Warp Gate',
    world: 2,
    cols: 11,
    rows: 8,
    pattern: 'P',
    maxMoves: 5,
    requireMoves: 2,
  },
  {
    id: 813,
    name: 'Switchback',
    world: 2,
    cols: 11,
    rows: 9,
    pattern: 'Sn',
    maxMoves: 8,
    requireMoves: 4,
    mirrorCount: 4,
  },

  // ── World 3: GAUNTLET — 5 mirrors, decoys introduced ───────────────────────
  {
    id: 814,
    name: 'Decoy Field',
    world: 3,
    cols: 10,
    rows: 10,
    pattern: 'Sn',
    maxMoves: 8,
    requireMoves: 4,
    mirrorCount: 5,
    decoys: 2,
  },
  {
    id: 815,
    name: 'Waterfall',
    world: 3,
    cols: 11,
    rows: 10,
    pattern: 'Sd',
    maxMoves: 8,
    requireMoves: 5,
    mirrorCount: 5,
  },
  {
    id: 816,
    name: 'Portal Jump',
    world: 3,
    cols: 12,
    rows: 10,
    pattern: 'P',
    maxMoves: 6,
    requireMoves: 2,
  },
  {
    id: 817,
    name: 'Rising Path',
    world: 3,
    cols: 12,
    rows: 11,
    pattern: 'Sn',
    maxMoves: 9,
    requireMoves: 5,
    mirrorCount: 5,
  },
  {
    id: 818,
    name: 'Downward Spiral',
    world: 3,
    cols: 13,
    rows: 11,
    pattern: 'Sd',
    maxMoves: 9,
    requireMoves: 4,
    mirrorCount: 5,
  },
  {
    id: 819,
    name: 'Minefield',
    world: 3,
    cols: 13,
    rows: 12,
    pattern: 'Sn',
    maxMoves: 9,
    requireMoves: 5,
    mirrorCount: 5,
    decoys: 2,
  },
  {
    id: 820,
    name: 'Tower Climb',
    world: 3,
    cols: 14,
    rows: 12,
    pattern: 'Sn',
    maxMoves: 10,
    requireMoves: 5,
    mirrorCount: 5,
  },

  // ── World 4: NEXUS — 6 mirrors, more portals and complex paths ─────────────
  {
    id: 821,
    name: 'Deep Stair',
    world: 4,
    cols: 12,
    rows: 11,
    pattern: 'Sn',
    maxMoves: 9,
    requireMoves: 5,
    mirrorCount: 6,
  },
  {
    id: 822,
    name: 'Nexus Gate',
    world: 4,
    cols: 12,
    rows: 10,
    pattern: 'P',
    maxMoves: 6,
    requireMoves: 2,
  },
  {
    id: 823,
    name: 'Cataract',
    world: 4,
    cols: 13,
    rows: 11,
    pattern: 'Sd',
    maxMoves: 10,
    requireMoves: 5,
    mirrorCount: 6,
  },
  {
    id: 824,
    name: 'Trap Maze',
    world: 4,
    cols: 13,
    rows: 12,
    pattern: 'Sn',
    maxMoves: 10,
    requireMoves: 6,
    mirrorCount: 6,
    decoys: 2,
  },
  {
    id: 825,
    name: 'Iron Climb',
    world: 4,
    cols: 14,
    rows: 12,
    pattern: 'Sn',
    maxMoves: 10,
    requireMoves: 6,
    mirrorCount: 6,
  },
  {
    id: 826,
    name: 'Gravity Drop',
    world: 4,
    cols: 14,
    rows: 13,
    pattern: 'Sd',
    maxMoves: 11,
    requireMoves: 5,
    mirrorCount: 6,
  },
  {
    id: 827,
    name: 'Nexus Core',
    world: 4,
    cols: 15,
    rows: 13,
    pattern: 'P',
    maxMoves: 8,
    requireMoves: 3,
  },

  // ── World 5: APEX — 7 mirrors, maximum challenge ───────────────────────────
  {
    id: 828,
    name: 'Grand Climb',
    world: 5,
    cols: 14,
    rows: 14,
    pattern: 'Sn',
    maxMoves: 11,
    requireMoves: 6,
    mirrorCount: 7,
  },
  {
    id: 829,
    name: 'Grand Cascade',
    world: 5,
    cols: 15,
    rows: 14,
    pattern: 'Sd',
    maxMoves: 11,
    requireMoves: 5,
    mirrorCount: 7,
  },
  {
    id: 830,
    name: 'Apex Climb',
    world: 5,
    cols: 16,
    rows: 14,
    pattern: 'Sn',
    maxMoves: 12,
    requireMoves: 6,
    mirrorCount: 7,
  },
  {
    id: 831,
    name: 'Apex Gauntlet',
    world: 5,
    cols: 16,
    rows: 15,
    pattern: 'Sn',
    maxMoves: 12,
    requireMoves: 7,
    mirrorCount: 7,
    decoys: 2,
  },
  {
    id: 832,
    name: 'Terminal Descent',
    world: 5,
    cols: 17,
    rows: 15,
    pattern: 'Sd',
    maxMoves: 13,
    requireMoves: 6,
    mirrorCount: 7,
  },
  {
    id: 833,
    name: 'Chromatic Storm',
    world: 5,
    cols: 17,
    rows: 15,
    pattern: 'Sn',
    maxMoves: 13,
    requireMoves: 7,
    mirrorCount: 7,
  },
  {
    id: 834,
    name: 'Final Trap',
    world: 5,
    cols: 18,
    rows: 16,
    pattern: 'Sd',
    maxMoves: 14,
    requireMoves: 7,
    mirrorCount: 7,
    decoys: 3,
  },
  {
    id: 835,
    name: 'Final Frontier',
    world: 5,
    cols: 20,
    rows: 16,
    pattern: 'Sn',
    maxMoves: 15,
    requireMoves: 7,
    mirrorCount: 7,
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
        if (idx >= 0 && idx < mirrorRotations.length)
          return { ...t, displayData: { ...t.displayData, rotation: mirrorRotations[idx] } };
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
          char = `${colors.blue}[${tile.displayData?.portalId}]${colors.reset}`;
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
  console.log(`${colors.bold}${colors.magenta}  LASER RELAY LEVEL GENERATOR v6${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  const validLevels: Level[] = [];
  const invalidLevels: { id: number; name: string; error: string }[] = [];

  for (const def of LEVEL_DEFS) {
    const requireMoves = def.requireMoves ?? 1;
    const mc = def.mirrorCount ?? 4;
    const dc = def.decoys ?? 0;
    const comp = def.compression as Compression | undefined;

    console.log(`${colors.bold}Level ${def.id} "${def.name}"${colors.reset}`);
    console.log(
      `  Pattern: ${def.pattern}, Size: ${def.cols}x${def.rows}, Req: ${requireMoves}${comp ? `, Compression: ${comp.direction} (${comp.delay}s)` : ''}`
    );

    let level: Level | null = null;

    switch (def.pattern) {
      case 'L':
        level = generateSimpleL(def.id, def.name, def.world, def.cols, def.rows, def.maxMoves);
        break;
      case 'Sn':
        level = generateSerpentine(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          mc,
          requireMoves,
          dc,
          comp
        );
        break;
      case 'Sd':
        level = generateSerpentineDown(
          def.id,
          def.name,
          def.world,
          def.cols,
          def.rows,
          def.maxMoves,
          mc,
          requireMoves,
          dc,
          comp
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
    }

    if (!level) {
      console.log(`  ${colors.red}✗ FAILED TO GENERATE${colors.reset}\n`);
      invalidLevels.push({ id: def.id, name: def.name, error: 'Failed to generate' });
      continue;
    }

    const verification = verifyLevel(level);
    console.log(
      `  Mirrors: ${verification.mirrorCount} (${dc > 0 ? `${dc} decoys` : 'no decoys'}), Min Moves: ${verification.minMoves}`
    );

    if (verification.valid) {
      if (verification.minMoves < requireMoves) {
        console.log(
          `  ${colors.yellow}⚠ WARNING: only ${verification.minMoves} moves needed (expected ${requireMoves})${colors.reset}`
        );
      } else {
        console.log(
          `  ${colors.green}✓ Exactly ${verification.minMoves} moves required${colors.reset}`
        );
      }
      validLevels.push(level);

      console.log(`\n  ${colors.bold}Initial:${colors.reset}`);
      printBoard(level);
      console.log(`\n  ${colors.bold}Solved:${colors.reset}`);
      printBoard(level, verification.solution);
    } else {
      console.log(`  ${colors.red}✗ INVALID: ${verification.error}${colors.reset}`);
      invalidLevels.push({ id: def.id, name: def.name, error: verification.error });
      printBoard(level);
    }
    console.log('');
  }

  console.log(`\n${colors.bold}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}SUMMARY${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════${colors.reset}\n`);
  console.log(
    `Valid: ${colors.green}${validLevels.length}${colors.reset}  Invalid: ${colors.red}${invalidLevels.length}${colors.reset}`
  );

  if (invalidLevels.length > 0) {
    for (const { id, name, error } of invalidLevels)
      console.log(`  ${colors.red}${id} "${name}": ${error}${colors.reset}`);
  }

  if (validLevels.length > 0) {
    const levelsPath = path.join(__dirname, '../game/modes/laserRelay/levels.ts');
    const fileContent = `// LASER RELAY LEVELS - Auto-generated by laser-level-generator.ts
// Run: npx tsx src/cli/laser-level-generator.ts

import type { Level } from '../../types';

export const LASER_LEVELS: Level[] = [
${validLevels.map((level) => `  ${JSON.stringify(level)}`).join(',\n')}
];

export const LASER_WORLDS = [
  { id: 1, name: 'PRISM',    tagline: 'Introductory levels', color: '#06b6d4', icon: '🔷' },
  { id: 2, name: 'REFRACT',  tagline: 'Getting trickier',   color: '#8b5cf6', icon: '💎' },
  { id: 3, name: 'GAUNTLET', tagline: 'Challenging puzzles', color: '#f59e0b', icon: '⚡' },
  { id: 4, name: 'NEXUS',    tagline: 'Portal challenges',   color: '#ec4899', icon: '🌀' },
  { id: 5, name: 'APEX',     tagline: 'Master challenges',   color: '#ef4444', icon: '🏆' },
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
