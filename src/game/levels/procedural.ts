// PRESSURE - Procedural Level Generator v2
// Build-from-solution approach: construct the solved layout, then scramble.
// No BFS at generation time — BFS only runs for hints on demand.
//
// HOW IT WORKS
// ────────────
// 1. Place nodes in the "safe zone" for the chosen compression direction
// 2. Generate a winding path using recursive backtracking (not Manhattan)
// 3. Build each tile in its CORRECT orientation (solved state)
// 4. Scramble each main-path tile by 1–3 rotations, record inverse = solution
// 5. Add dead-end branch decoys off the path (not in solution)
// 6. Add interior wall obstacles in empty cells
// 7. Quick isConnected check to ensure scramble didn't accidentally solve it

import { Level, Tile, Direction, CompressionDirection, Position } from '../types';

const DIRS: Direction[] = ['up', 'right', 'down', 'left'];
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const DXDY: Record<Direction, [number, number]> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
};

function rotateDir(d: Direction, times: number): Direction {
  return DIRS[(DIRS.indexOf(d) + times) % 4];
}

function rotate(conns: Direction[], times: number): Direction[] {
  return conns.map((c) => rotateDir(c, times));
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Fast connectivity check (no BFS solver) ──────────────────────────────
function isConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true;
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(`${t.x},${t.y}`, t);
  const visited = new Set<string>();
  const queue = [goals[0]];
  visited.add(`${goals[0].x},${goals[0].y}`);
  const connected = new Set([`${goals[0].x},${goals[0].y}`]);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const tile = map.get(`${curr.x},${curr.y}`);
    if (!tile) continue;
    for (const d of tile.connections) {
      const [dx, dy] = DXDY[d];
      const nx = curr.x + dx,
        ny = curr.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      const neighbor = map.get(key);
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue;
      if (neighbor.connections.includes(OPP[d])) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
        if (goals.some((g) => g.x === nx && g.y === ny)) connected.add(key);
      }
    }
  }
  return goals.every((g) => connected.has(`${g.x},${g.y}`));
}

// ─── Types ────────────────────────────────────────────────────────────────
export interface ProceduralOptions {
  gridCols: number;
  gridRows: number;
  nodeCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  compressionDirection?: CompressionDirection;
  /** Number of interior wall clusters (rooms/obstacles) */
  interiorWalls?: number;
  /** Dead-end decoy branches off the main path */
  branches?: number;
  /** 0–1 fraction of main-path tiles that are pre-solved and locked */
  lockedFraction?: number;
  id?: number;
  name?: string;
  world?: number;
}

const DIFF_PARAMS = {
  easy: { compressionDelay: 12000, movePadding: 4, wallsMin: 0, wallsMax: 1 },
  medium: { compressionDelay: 8000, movePadding: 3, wallsMin: 1, wallsMax: 2 },
  hard: { compressionDelay: 5000, movePadding: 2, wallsMin: 2, wallsMax: 3 },
  expert: { compressionDelay: 3500, movePadding: 1, wallsMin: 2, wallsMax: 4 },
};

// Compression direction → goal node placement zone [minFrac, maxFrac] for x and y.
// Goals are placed TOWARD the compressing wall so walls actually threaten them.
// e.g. 'top' walls come from y=0, so goals live in the top portion (small y).
type DirConfig = { dir: CompressionDirection; zoneX: [number, number]; zoneY: [number, number] };
const DIR_CONFIGS: DirConfig[] = [
  { dir: 'top', zoneX: [0.15, 0.85], zoneY: [0.15, 0.5] }, // near top wall
  { dir: 'bottom', zoneX: [0.15, 0.85], zoneY: [0.5, 0.85] }, // near bottom wall
  { dir: 'left', zoneX: [0.15, 0.5], zoneY: [0.15, 0.85] }, // near left wall
  { dir: 'right', zoneX: [0.5, 0.85], zoneY: [0.15, 0.85] }, // near right wall
  { dir: 'top-bottom', zoneX: [0.15, 0.85], zoneY: [0.2, 0.8] }, // spread vertically
  { dir: 'left-right', zoneX: [0.2, 0.8], zoneY: [0.15, 0.85] }, // spread horizontally
  { dir: 'top-left', zoneX: [0.15, 0.5], zoneY: [0.15, 0.5] }, // near top-left
  { dir: 'top-right', zoneX: [0.5, 0.85], zoneY: [0.15, 0.5] }, // near top-right
  { dir: 'bottom-left', zoneX: [0.15, 0.5], zoneY: [0.5, 0.85] }, // near bottom-left
  { dir: 'bottom-right', zoneX: [0.5, 0.85], zoneY: [0.5, 0.85] }, // near bottom-right
  { dir: 'all', zoneX: [0.25, 0.75], zoneY: [0.25, 0.75] }, // center (all sides)
];

// ─── Pipe shape catalogue ─────────────────────────────────────────────────
// Indexed by connection count so we pick the smallest matching shape.
const PIPE_SHAPES: Direction[][] = [
  ['up', 'down'], // straight v
  ['left', 'right'], // straight h
  ['up', 'right'], // L corner
  ['right', 'down'],
  ['down', 'left'],
  ['left', 'up'],
  ['up', 'right', 'down'], // T shapes
  ['right', 'down', 'left'],
  ['down', 'left', 'up'],
  ['left', 'up', 'right'],
  ['up', 'down', 'left', 'right'], // cross
];

// Find the base shape + rotation offset that satisfies `needed` directions.
// Returns [baseShape, rotationToSolvedState].
function findShape(needed: Direction[]): [Direction[], number] {
  for (const shape of PIPE_SHAPES) {
    if (shape.length < needed.length) continue;
    for (let r = 0; r < 4; r++) {
      const rotated = rotate(shape, r);
      if (needed.every((d) => rotated.includes(d))) {
        return [shape, r];
      }
    }
  }
  // Fallback: straight pipe
  return [['up', 'down'], 0];
}

// ─── Winding path: recursive backtracker ─────────────────────────────────
function windingPath(
  start: Position,
  target: Position,
  cols: number,
  rows: number,
  blocked: Set<string>,
  maxLen: number
): Position[] | null {
  const path: Position[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  function dfs(curr: Position): boolean {
    if (curr.x === target.x && curr.y === target.y) return true;
    if (path.length > maxLen) return false;

    for (const d of shuffle(DIRS as Direction[])) {
      const [dx, dy] = DXDY[d];
      const nx = curr.x + dx,
        ny = curr.y + dy;
      const key = `${nx},${ny}`;

      if (nx < 1 || nx >= cols - 1 || ny < 1 || ny >= rows - 1) continue;
      if (blocked.has(key) || visited.has(key)) continue;

      // Allow tight corridors near the target, avoid elsewhere
      const distToTarget = Math.abs(nx - target.x) + Math.abs(ny - target.y);
      if (distToTarget > 2) {
        let adj = 0;
        for (const d2 of DIRS) {
          const [dx2, dy2] = DXDY[d2];
          if (
            visited.has(`${nx + dx2},${ny + dy2}`) &&
            `${nx + dx2},${ny + dy2}` !== `${curr.x},${curr.y}`
          )
            adj++;
        }
        if (adj > 1) continue;
      }

      visited.add(key);
      path.push({ x: nx, y: ny });
      if (dfs({ x: nx, y: ny })) return true;
      path.pop();
      visited.delete(key);
    }
    return false;
  }

  return dfs(start) ? path : null;
}

// ─── Dead-end branch ──────────────────────────────────────────────────────
function deadEndBranch(
  start: Position,
  cols: number,
  rows: number,
  blocked: Set<string>,
  maxLen: number
): Position[] {
  const branch: Position[] = [];
  let curr = start;
  const visited = new Set<string>([`${start.x},${start.y}`]);
  for (let i = 0; i < maxLen; i++) {
    let moved = false;
    for (const d of shuffle(DIRS as Direction[])) {
      const [dx, dy] = DXDY[d];
      const nx = curr.x + dx,
        ny = curr.y + dy;
      const key = `${nx},${ny}`;
      if (nx < 1 || nx >= cols - 1 || ny < 1 || ny >= rows - 1) continue;
      if (blocked.has(key) || visited.has(key)) continue;
      visited.add(key);
      branch.push({ x: nx, y: ny });
      curr = { x: nx, y: ny };
      moved = true;
      break;
    }
    if (!moved) break;
  }
  return branch;
}

// ─── Connection map ────────────────────────────────────────────────────────
type ConnMap = Map<string, Set<Direction>>;

function addConn(map: ConnMap, x: number, y: number, d: Direction) {
  const key = `${x},${y}`;
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(d);
}

// ─── Room-style interior wall cluster ────────────────────────────────────
// Places a small L-shape or line of walls that forms a "room wall" rather
// than a single isolated block. This creates corridors and enclosed spaces.
function placeRoomWalls(cols: number, rows: number, occupied: Set<string>, count: number): Tile[] {
  const added: Tile[] = [];
  const attempts = count * 12;

  for (let a = 0; a < attempts && added.length < count; a++) {
    const x = rng(1, cols - 2);
    const y = rng(1, rows - 2);
    if (occupied.has(`${x},${y}`)) continue;

    // Pick a random small cluster shape: line-2, line-3, L-2, dot
    const shape = rng(0, 3);
    const candidates: Position[] = [{ x, y }];

    if (shape === 0) {
      // horizontal pair
      candidates.push({ x: x + 1, y });
    } else if (shape === 1) {
      // vertical pair
      candidates.push({ x, y: y + 1 });
    } else if (shape === 2) {
      // horizontal triple
      candidates.push({ x: x + 1, y }, { x: x + 2, y });
    } else {
      // L-shape
      candidates.push({ x: x + 1, y }, { x: x + 1, y: y + 1 });
    }

    // Only place if ALL cells in cluster are free and inside grid
    const allFree = candidates.every(
      (p) =>
        p.x >= 1 && p.x < cols - 1 && p.y >= 1 && p.y < rows - 1 && !occupied.has(`${p.x},${p.y}`)
    );
    if (!allFree) continue;

    for (const p of candidates) {
      occupied.add(`${p.x},${p.y}`);
      added.push({
        id: `iwall-${p.x}-${p.y}`,
        type: 'wall',
        x: p.x,
        y: p.y,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
    }
  }

  return added;
}

// ─── Build tiles from solved state, then scramble ─────────────────────────
// Returns tiles (scrambled) + solution (how to unscramble main path tiles).
// lockedFraction: 0–1, portion of main path tiles that are pre-solved (canRotate:false).
function buildTilesFromSolution(
  mainConnMap: ConnMap,
  branchConnMap: ConnMap,
  goalSet: Set<string>,
  lockedFraction: number = 0
): { tiles: Tile[]; solution: { x: number; y: number; rotations: number }[] } {
  const tiles: Tile[] = [];
  const solution: { x: number; y: number; rotations: number }[] = [];

  const mainKeys = [...mainConnMap.keys()].filter((k) => !goalSet.has(k));
  // Decide which main-path tiles are locked (pre-solved, canRotate:false)
  const lockedCount = Math.round(mainKeys.length * lockedFraction);
  const lockedSet = new Set(shuffle(mainKeys).slice(0, lockedCount));

  const allKeys = new Set([...mainConnMap.keys(), ...branchConnMap.keys()]);

  allKeys.forEach((key) => {
    if (goalSet.has(key)) return;
    const [px, py] = key.split(',').map(Number);

    const needed: Direction[] = [];
    for (const d of mainConnMap.get(key) ?? new Set()) needed.push(d);
    for (const d of branchConnMap.get(key) ?? new Set()) {
      if (!needed.includes(d)) needed.push(d);
    }

    const [baseShape, solvedRotation] = findShape(needed);
    const solvedConns = rotate(baseShape, solvedRotation);

    const isMainPath = mainConnMap.has(key);
    const isLocked = lockedSet.has(key);

    if (isLocked) {
      // Locked tile: placed in solved orientation, cannot rotate — free hint for player
      tiles.push({
        id: `path-${px}-${py}`,
        type: 'path',
        x: px,
        y: py,
        connections: solvedConns,
        isGoalNode: false,
        canRotate: false,
      });
      return;
    }

    // Scramble by 1–3 rotations
    const scramble = rng(1, 3);
    const scrambledConns = rotate(baseShape, (solvedRotation + scramble) % 4);
    const unscramble = (4 - scramble) % 4;

    if (isMainPath && unscramble > 0) {
      solution.push({ x: px, y: py, rotations: unscramble });
    }

    tiles.push({
      id: `path-${px}-${py}`,
      type: 'path',
      x: px,
      y: py,
      connections: scrambledConns,
      isGoalNode: false,
      canRotate: true,
    });
  });

  return { tiles, solution };
}

// ─── Main generator ────────────────────────────────────────────────────────
export function generateProceduralLevel(opts: ProceduralOptions): Level | null {
  const { gridCols, gridRows, nodeCount, difficulty } = opts;
  const params = DIFF_PARAMS[difficulty];

  const dirConfig = opts.compressionDirection
    ? (DIR_CONFIGS.find((d) => d.dir === opts.compressionDirection) ??
      DIR_CONFIGS[DIR_CONFIGS.length - 1])
    : DIR_CONFIGS[rng(0, DIR_CONFIGS.length - 1)];

  const interiorWallCount = opts.interiorWalls ?? rng(params.wallsMin, params.wallsMax);
  const branchCount = opts.branches ?? rng(1, 2);

  for (let attempt = 0; attempt < 40; attempt++) {
    // ── 1. Border walls ─────────────────────────────────────────────────
    const wallTiles: Tile[] = [];
    const borderSet = new Set<string>();
    for (let x = 0; x < gridCols; x++) {
      for (const y of [0, gridRows - 1]) {
        wallTiles.push({
          id: `wall-${x}-${y}`,
          type: 'wall',
          x,
          y,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
        borderSet.add(`${x},${y}`);
      }
    }
    for (let y = 1; y < gridRows - 1; y++) {
      for (const x of [0, gridCols - 1]) {
        wallTiles.push({
          id: `wall-${x}-${y}`,
          type: 'wall',
          x,
          y,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
        borderSet.add(`${x},${y}`);
      }
    }

    // ── 2. Node placement in safe zone ──────────────────────────────────
    const zx = dirConfig.zoneX,
      zy = dirConfig.zoneY;
    const nodeMinX = Math.max(1, Math.round(zx[0] * (gridCols - 2)));
    const nodeMaxX = Math.min(gridCols - 2, Math.round(zx[1] * (gridCols - 2)));
    const nodeMinY = Math.max(1, Math.round(zy[0] * (gridRows - 2)));
    const nodeMaxY = Math.min(gridRows - 2, Math.round(zy[1] * (gridRows - 2)));

    const candidates: Position[] = [];
    for (let y = nodeMinY; y <= nodeMaxY; y++)
      for (let x = nodeMinX; x <= nodeMaxX; x++) candidates.push({ x, y });

    const minDist = Math.max(3, Math.floor(Math.min(gridCols, gridRows) / 3));
    const goalPositions: Position[] = [];
    for (const pos of shuffle(candidates)) {
      if (goalPositions.length >= nodeCount) break;
      if (!goalPositions.some((g) => Math.abs(g.x - pos.x) + Math.abs(g.y - pos.y) < minDist))
        goalPositions.push(pos);
    }
    if (goalPositions.length < nodeCount) continue;

    const goalSet = new Set(goalPositions.map((p) => `${p.x},${p.y}`));
    const occupied = new Set<string>([...borderSet, ...goalPositions.map((p) => `${p.x},${p.y}`)]);

    // ── 3. Winding paths between consecutive nodes ───────────────────────
    const mainConnMap: ConnMap = new Map();
    let pathFailed = false;

    for (let i = 0; i < goalPositions.length - 1; i++) {
      const from = goalPositions[i];
      const to = goalPositions[i + 1];
      const pathBlocked = new Set(occupied);
      pathBlocked.delete(`${to.x},${to.y}`);
      // Allow re-entering already-pathed cells (connections merge at T-junctions)
      for (const k of mainConnMap.keys()) pathBlocked.delete(k);

      const path = windingPath(from, to, gridCols, gridRows, pathBlocked, gridCols * gridRows);
      if (!path || path.length < 2) {
        pathFailed = true;
        break;
      }

      for (let j = 0; j < path.length - 1; j++) {
        const a = path[j],
          b = path[j + 1];
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const dAB: Direction = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
        const dBA: Direction = OPP[dAB];
        addConn(mainConnMap, a.x, a.y, dAB);
        addConn(mainConnMap, b.x, b.y, dBA);
        if (!goalSet.has(`${b.x},${b.y}`)) occupied.add(`${b.x},${b.y}`);
      }
    }
    if (pathFailed) continue;

    // ── 4. Interior wall obstacles (room-style clusters) ─────────────────
    if (interiorWallCount > 0) {
      const roomWalls = placeRoomWalls(gridCols, gridRows, occupied, interiorWallCount);
      for (const t of roomWalls) {
        wallTiles.push(t);
        occupied.add(`${t.x},${t.y}`);
      }
    }

    // ── 5. Dead-end branches (decoys) ────────────────────────────────────
    const branchConnMap: ConnMap = new Map();
    const pathCells = shuffle([...mainConnMap.keys()].filter((k) => !goalSet.has(k)));
    let branchesAdded = 0;

    for (const key of pathCells) {
      if (branchesAdded >= branchCount) break;
      const [bx, by] = key.split(',').map(Number);
      const branch = deadEndBranch(
        { x: bx, y: by },
        gridCols,
        gridRows,
        new Set(occupied),
        rng(2, 3)
      );
      if (branch.length === 0) continue;

      // Connect branch root to its first cell
      const root = { x: bx, y: by };
      const first = branch[0];
      const dx = first.x - root.x,
        dy = first.y - root.y;
      const dOut: Direction = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
      addConn(branchConnMap, root.x, root.y, dOut);
      addConn(branchConnMap, first.x, first.y, OPP[dOut]);

      for (let j = 0; j < branch.length - 1; j++) {
        const a = branch[j],
          b = branch[j + 1];
        const dxb = b.x - a.x,
          dyb = b.y - a.y;
        const dAB: Direction =
          dxb === 1 ? 'right' : dxb === -1 ? 'left' : dyb === 1 ? 'down' : 'up';
        addConn(branchConnMap, a.x, a.y, dAB);
        addConn(branchConnMap, b.x, b.y, OPP[dAB]);
        occupied.add(`${b.x},${b.y}`);
      }
      occupied.add(`${first.x},${first.y}`);
      branchesAdded++;
    }

    // ── 6. Goal node tiles ───────────────────────────────────────────────
    const nodeTiles: Tile[] = goalPositions.map((p) => ({
      id: `node-${p.x}-${p.y}`,
      type: 'node' as const,
      x: p.x,
      y: p.y,
      connections: ['up', 'down', 'left', 'right'] as Direction[],
      isGoalNode: true,
      canRotate: false,
    }));

    // ── 7. Build scrambled path tiles with embedded solution ──────────────
    const { tiles: pathTiles, solution } = buildTilesFromSolution(
      mainConnMap,
      branchConnMap,
      goalSet,
      opts.lockedFraction ?? 0
    );

    const allTiles = [...wallTiles, ...nodeTiles, ...pathTiles];

    // ── 8. Verify scramble didn't accidentally solve the puzzle ───────────
    if (isConnected(allTiles, goalPositions)) continue;

    // Verify solution restores connectivity (cheap sanity check)
    const solvedTiles = allTiles.map((t) => {
      const move = solution.find((m) => m.x === t.x && m.y === t.y);
      return move ? { ...t, connections: rotate(t.connections, move.rotations) } : t;
    });
    if (!isConnected(solvedTiles, goalPositions)) continue;

    const minMoves = solution.reduce((s, p) => s + p.rotations, 0);
    if (minMoves === 0) continue;

    return {
      id: opts.id ?? Date.now() + attempt,
      name: opts.name ?? generateName(difficulty),
      world: opts.world ?? 1,
      gridSize: gridCols,
      gridCols,
      gridRows,
      maxMoves: minMoves + params.movePadding,
      compressionDelay: params.compressionDelay,
      compressionDirection: dirConfig.dir,
      tiles: allTiles,
      goalNodes: goalPositions,
      isGenerated: true,
      solution,
    };
  }

  return null;
}

// ─── Name generator ────────────────────────────────────────────────────────
const ADJECTIVES: Record<string, string[]> = {
  easy: ['Open', 'Gentle', 'Flowing', 'Clear', 'Smooth', 'Soft', 'Wide', 'Loose'],
  medium: ['Twisted', 'Coiled', 'Bent', 'Winding', 'Fractured', 'Tangled', 'Warped'],
  hard: ['Brutal', 'Dense', 'Locked', 'Crushing', 'Vicious', 'Tight', 'Savage'],
  expert: ['Merciless', 'Extreme', 'Critical', 'Lethal', 'Infernal', 'Absolute'],
};
const NOUNS = [
  'Circuit',
  'Conduit',
  'Nexus',
  'Corridor',
  'Channel',
  'Lattice',
  'Mesh',
  'Duct',
  'Passage',
  'Vein',
];

function generateName(difficulty: string): string {
  const adjs = ADJECTIVES[difficulty] ?? ADJECTIVES.medium;
  return `${adjs[rng(0, adjs.length - 1)]} ${NOUNS[rng(0, NOUNS.length - 1)]}`;
}

// ─── Batch world generator ─────────────────────────────────────────────────
export interface WorldConfig {
  worldId: number;
  levelCount: number;
  startId: number;
  gridCols: number;
  gridRows: number;
  nodeCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  compressionDirection?: CompressionDirection;
  interiorWalls?: number;
  branches?: number;
  lockedFraction?: number;
  names?: string[];
}

export function generateWorld(config: WorldConfig): Level[] {
  const levels: Level[] = [];
  for (let i = 0; i < config.levelCount; i++) {
    const level = generateProceduralLevel({
      gridCols: config.gridCols,
      gridRows: config.gridRows,
      nodeCount: config.nodeCount,
      difficulty: config.difficulty,
      compressionDirection: config.compressionDirection,
      interiorWalls: config.interiorWalls,
      branches: config.branches,
      lockedFraction: config.lockedFraction,
      id: config.startId + i,
      name: config.names?.[i] ?? generateName(config.difficulty),
      world: config.worldId,
    });
    if (level) levels.push(level);
  }
  return levels;
}
