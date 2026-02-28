// PRESSURE - Compact Level Format
// Write levels in ~30 lines instead of ~300.
// hydrateLevel() converts CompactLevel → full Level object.
//
// TILE CODES  (c field):
//   Straight : 'ud' | 'lr'
//   L-corner : 'ur' | 'rd' | 'dl' | 'lu'
//   T-shape  : 'urd' | 'rdu' | 'dlu' | 'lur'
//   Cross    : 'x'
//
// WALL SHORTHAND:
//   'border'         → auto-generate full border walls
//   [[x,y], ...]     → specific wall positions
//   'border+[[x,y]]' → border + interior walls (use interiorWalls field)

import type { Level, Tile, Direction, CompressionDirection } from '../types';

// ─── Compact tile entry ────────────────────────────────────────────────────
export interface CompactTile {
  /** [x, y] position */
  p: [number, number];
  /**
   * Connection code.  See table above.
   * Omit for wall tiles (type: 'wall') — walls have no connections.
   */
  c?: string;
  /** Type override — defaults to 'path' for tiles with c, 'wall' for tiles without c. */
  t?: 'path' | 'wall' | 'node';
  /** canRotate — defaults to true for path tiles */
  r?: boolean;
}

// ─── Compact level ─────────────────────────────────────────────────────────
export interface CompactLevel {
  id: number;
  name: string;
  world: number;
  /** [cols, rows] — use same value for square grids */
  grid: [number, number];
  maxMoves: number;
  compressionDelay: number;
  compressionDirection?: CompressionDirection;
  compressionEnabled?: boolean;
  /** Goal node positions as [x, y] pairs */
  goals: [number, number][];
  /**
   * 'border'  → auto-generate full perimeter walls
   * omit      → no auto-walls
   */
  autoWalls?: 'border';
  /** Interior wall positions as [x, y] pairs (in addition to autoWalls) */
  interiorWalls?: [number, number][];
  /** Path and special tiles */
  tiles: CompactTile[];
  timeLimit?: number;
  isGenerated?: boolean;
}

// ─── Connection code → Direction[] ─────────────────────────────────────────
const CODE_TO_DIRS: Record<string, Direction[]> = {
  ud: ['up', 'down'],
  lr: ['left', 'right'],
  ur: ['up', 'right'],
  rd: ['right', 'down'],
  dl: ['down', 'left'],
  lu: ['left', 'up'],
  urd: ['up', 'right', 'down'],
  rdu: ['right', 'down', 'up'],
  dlu: ['down', 'left', 'up'],
  lur: ['left', 'up', 'right'],
  rdl: ['right', 'down', 'left'],
  x: ['up', 'down', 'left', 'right'],
};

function parseDirs(code: string): Direction[] {
  const dirs = CODE_TO_DIRS[code];
  if (!dirs) throw new Error(`Unknown connection code: "${code}"`);
  return dirs;
}

// ─── Direction[] → code (for dehydration) ──────────────────────────────────
function dirsToCode(dirs: Direction[]): string {
  const sorted = [...dirs].sort((a, b) => a.localeCompare(b)).join('');
  for (const [code, d] of Object.entries(CODE_TO_DIRS)) {
    if ([...d].sort((a, b) => a.localeCompare(b)).join('') === sorted) return code;
  }
  return dirs.join('');
}

// ─── Border wall generator ──────────────────────────────────────────────────
function buildBorderWalls(cols: number, rows: number): Tile[] {
  const walls: Tile[] = [];
  for (let x = 0; x < cols; x++) {
    walls.push(makeWall(x, 0));
    if (rows > 1) walls.push(makeWall(x, rows - 1));
  }
  for (let y = 1; y < rows - 1; y++) {
    walls.push(makeWall(0, y));
    if (cols > 1) walls.push(makeWall(cols - 1, y));
  }
  return walls;
}

function makeWall(x: number, y: number): Tile {
  return {
    id: `wall-${x}-${y}`,
    type: 'wall',
    x,
    y,
    connections: [],
    isGoalNode: false,
    canRotate: false,
  };
}

// ─── Main hydrator ─────────────────────────────────────────────────────────
export function hydrateLevel(compact: CompactLevel): Level {
  const [cols, rows] = compact.grid;
  const goalSet = new Set(compact.goals.map(([x, y]) => `${x},${y}`));

  const tiles: Tile[] = [];

  // 1. Border walls
  if (compact.autoWalls === 'border') {
    tiles.push(...buildBorderWalls(cols, rows));
  }

  // 2. Interior walls
  for (const [x, y] of compact.interiorWalls ?? []) {
    tiles.push(makeWall(x, y));
  }

  // 3. Goal nodes (cross-connected, fixed)
  for (const [x, y] of compact.goals) {
    tiles.push({
      id: `node-${x}-${y}`,
      type: 'node',
      x,
      y,
      connections: ['up', 'down', 'left', 'right'],
      isGoalNode: true,
      canRotate: false,
    });
  }

  // 4. Path / custom tiles
  for (const ct of compact.tiles) {
    const [x, y] = ct.p;
    const key = `${x},${y}`;
    if (goalSet.has(key)) continue; // goal node takes precedence

    const isWall = ct.t === 'wall' || ct.c === undefined;
    if (isWall) {
      tiles.push(makeWall(x, y));
      continue;
    }

    const connections = parseDirs(ct.c!);
    const canRotate = ct.r !== false;
    tiles.push({
      id: `path-${x}-${y}`,
      type: ct.t ?? 'path',
      x,
      y,
      connections,
      isGoalNode: false,
      canRotate,
    });
  }

  const level: Level = {
    id: compact.id,
    name: compact.name,
    world: compact.world,
    gridSize: cols,
    gridCols: cols,
    gridRows: rows,
    maxMoves: compact.maxMoves,
    compressionDelay: compact.compressionDelay,
    compressionDirection: compact.compressionDirection,
    compressionEnabled: compact.compressionEnabled,
    tiles,
    goalNodes: compact.goals.map(([x, y]) => ({ x, y })),
    ...(compact.timeLimit !== undefined && { timeLimit: compact.timeLimit }),
    ...(compact.isGenerated !== undefined && { isGenerated: compact.isGenerated }),
  };

  return level;
}

// ─── Dehydrator (Level → CompactLevel) ────────────────────────────────────
// Useful for extracting existing verbose levels into compact form.
export function dehydrateLevel(level: Level, autoWalls: boolean = true): CompactLevel {
  const cols = level.gridCols ?? level.gridSize;
  const rows = level.gridRows ?? level.gridSize;
  const goalSet = new Set(level.goalNodes.map((g) => `${g.x},${g.y}`));

  const borderSet = new Set<string>();
  if (autoWalls) {
    for (let x = 0; x < cols; x++) {
      borderSet.add(`${x},0`);
      borderSet.add(`${x},${rows - 1}`);
    }
    for (let y = 1; y < rows - 1; y++) {
      borderSet.add(`0,${y}`);
      borderSet.add(`${cols - 1},${y}`);
    }
  }

  const interiorWalls: [number, number][] = [];
  const tiles: CompactTile[] = [];

  for (const tile of level.tiles) {
    const key = `${tile.x},${tile.y}`;
    if (goalSet.has(key)) continue;

    if (tile.type === 'wall') {
      if (!borderSet.has(key)) {
        interiorWalls.push([tile.x, tile.y]);
      }
      continue;
    }

    const ct: CompactTile = { p: [tile.x, tile.y] };
    if (tile.connections.length > 0) ct.c = dirsToCode(tile.connections);
    if (!tile.canRotate) ct.r = false;
    if (tile.type !== 'path') ct.t = tile.type as 'node';
    tiles.push(ct);
  }

  return {
    id: level.id,
    name: level.name,
    world: level.world,
    grid: [cols, rows],
    maxMoves: level.maxMoves,
    compressionDelay: level.compressionDelay,
    ...(level.compressionDirection && { compressionDirection: level.compressionDirection }),
    ...(level.compressionEnabled !== undefined && { compressionEnabled: level.compressionEnabled }),
    goals: level.goalNodes.map((g) => [g.x, g.y]),
    autoWalls: autoWalls ? 'border' : undefined,
    ...(interiorWalls.length > 0 && { interiorWalls }),
    tiles,
    ...(level.timeLimit !== undefined && { timeLimit: level.timeLimit }),
    ...(level.isGenerated !== undefined && { isGenerated: level.isGenerated }),
  };
}
