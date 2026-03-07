// PRESSURE - Level Utilities
// Solution computation, verification, and procedural generation.
// Classic mode levels are now in src/game/modes/classic/levels.ts

import { Level, Tile, Position, Direction } from './types';

// Re-export CLASSIC_LEVELS for backward compatibility
export { CLASSIC_LEVELS } from './modes/classic/levels';

// Type aliases
type SolutionPath = { x: number; y: number; rotations: number }[];
type DifficultyLevel = 'easy' | 'medium' | 'hard';

// null  = computed, no solution found
// entry missing = not yet computed
const solutionCache = new Map<number, SolutionPath | null>();

const DIRS: Direction[] = ['up', 'right', 'down', 'left'];
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

function rotate(conns: Direction[], times: number): Direction[] {
  return conns.map((c) => DIRS[(DIRS.indexOf(c) + times) % 4]);
}

// Helper: Get next position in a direction
function getNextPosition(x: number, y: number, direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { x, y: y - 1 };
    case 'down':
      return { x, y: y + 1 };
    case 'left':
      return { x: x - 1, y };
    case 'right':
      return { x: x + 1, y };
  }
}

// Helper: Check if neighbor tile is valid and connected
function isValidConnectedNeighbor(neighbor: Tile | undefined, direction: Direction): boolean {
  if (!neighbor) return false;
  if (neighbor.type === 'wall' || neighbor.type === 'crushed') return false;
  return neighbor.connections.includes(OPP[direction]);
}

// BFS to check if all goal nodes are connected
function isConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true;

  const getTile = (x: number, y: number) => tiles.find((t) => t.x === x && t.y === y);
  const visited = new Set<string>();
  const queue: Position[] = [goals[0]];
  visited.add(`${goals[0].x},${goals[0].y}`);
  const connected = new Set([`${goals[0].x},${goals[0].y}`]);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const tile = getTile(curr.x, curr.y);
    if (!tile) continue;

    for (const d of tile.connections) {
      const next = getNextPosition(curr.x, curr.y, d);
      const key = `${next.x},${next.y}`;
      if (visited.has(key)) continue;

      const neighbor = getTile(next.x, next.y);
      if (!isValidConnectedNeighbor(neighbor, d)) continue;

      visited.add(key);
      queue.push(next);
      if (goals.some((g) => g.x === next.x && g.y === next.y)) connected.add(key);
    }
  }

  return goals.every((g) => connected.has(`${g.x},${g.y}`));
}

// Helper: Hash tile state for visited tracking
function hashTileState(tiles: Tile[]): string {
  return tiles
    .filter((t) => t.canRotate)
    .map((t) => `${t.x},${t.y}:${t.connections.join(',')}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|');
}

// Helper: Rotate a specific tile by amount
function rotateTileAt(tiles: Tile[], x: number, y: number, rotations: number): Tile[] {
  return tiles.map((t) => {
    if (t.x === x && t.y === y) {
      return { ...t, connections: rotate(t.connections, rotations) };
    }
    return t;
  });
}

// Helper: Try rotation at each rotatable tile
function processTileRotations(
  currState: { tiles: Tile[]; path: SolutionPath },
  rotatableTiles: Tile[],
  goals: Position[],
  maxMoves: number,
  visited: Set<string>,
  queue: (typeof currState)[]
): SolutionPath | null {
  for (const rt of rotatableTiles) {
    for (let r = 1; r <= 3; r++) {
      const newTiles = rotateTileAt(currState.tiles, rt.x, rt.y, r);
      const h = hashTileState(newTiles);
      if (visited.has(h)) continue;
      visited.add(h);

      const newPath = [...currState.path, { x: rt.x, y: rt.y, rotations: r }];

      if (isConnected(newTiles, goals)) return newPath;

      const totalMoves = newPath.reduce((s, p) => s + p.rotations, 0);
      if (totalMoves < maxMoves) {
        queue.push({ tiles: newTiles, path: newPath });
      }
    }
  }
  return null;
}

// BFS solver - returns solution path or undefined
function solve(tiles: Tile[], goals: Position[], maxMoves: number): SolutionPath | undefined {
  if (isConnected(tiles, goals)) return [];

  const rotatable = tiles.filter((t) => t.canRotate);
  if (rotatable.length === 0) return undefined;

  const visited = new Set<string>();
  const queue: { tiles: Tile[]; path: SolutionPath }[] = [{ tiles: [...tiles], path: [] }];

  visited.add(hashTileState(tiles));

  let iterations = 0;
  const MAX_ITERATIONS = 50_000;

  while (queue.length > 0) {
    if (++iterations > MAX_ITERATIONS) return undefined;

    const curr = queue.shift()!;
    const result = processTileRotations(curr, rotatable, goals, maxMoves, visited, queue);
    if (result !== null) return result;
  }

  return undefined;
}

// Get solution for a level — computed on first call, then cached.
// Generated levels already embed their solution so no BFS is needed for them.
export function getSolution(level: Level): SolutionPath | null {
  // Generated levels store their solution directly on the object
  if (level.solution !== undefined) return level.solution;
  // Check module-level cache for hand-authored levels
  if (solutionCache.has(level.id)) return solutionCache.get(level.id)!;
  // First access — run the BFS now (lazy)
  const sol = solve(level.tiles, level.goalNodes, level.maxMoves) ?? null;
  solutionCache.set(level.id, sol);
  return sol;
}

/* ─────────────────────────────────────────
   Level Verifier
───────────────────────────────────────── */
// verifyLevel reuses getSolution so it never re-runs BFS unnecessarily.
export function verifyLevel(level: Level): { solvable: boolean; minMoves: number } {
  const sol = getSolution(level);
  return { solvable: sol !== null, minMoves: sol?.reduce((s, p) => s + p.rotations, 0) ?? -1 };
}

/* ─────────────────────────────────────────
   Procedural Level Generator
───────────────────────────────────────── */
export interface GenerateOptions {
  gridSize: number;
  nodeCount: number;
  difficulty: DifficultyLevel;
  decoys?: boolean | number;
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper: Get difficulty parameters based on difficulty level
function getDifficultyParams(difficulty: DifficultyLevel) {
  return {
    easy: { compressionDelay: 10000, movePadding: 4, decoyCount: 0 },
    medium: { compressionDelay: 6000, movePadding: 2, decoyCount: 2 },
    hard: { compressionDelay: 4000, movePadding: 1, decoyCount: 3 },
  }[difficulty];
}

// Helper: Create goal positions from candidates with minimum distance check
function selectGoalPositions(candidates: Position[], nodeCount: number): Position[] {
  const shuffled = shuffleArray(candidates);
  const goalPositions: Position[] = [];
  for (const pos of shuffled) {
    if (goalPositions.length >= nodeCount) break;
    const tooClose = goalPositions.some((g) => Math.abs(g.x - pos.x) + Math.abs(g.y - pos.y) < 2);
    if (!tooClose) goalPositions.push(pos);
  }
  return goalPositions;
}

// Helper: Create wall tiles for grid borders
function createWallTiles(gridSize: number): Tile[] {
  const wallTiles: Tile[] = [];
  for (let i = 0; i < gridSize; i++) {
    wallTiles.push(
      {
        id: `wall-${i}-0`,
        type: 'wall',
        x: i,
        y: 0,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      },
      {
        id: `wall-${i}-${gridSize - 1}`,
        type: 'wall',
        x: i,
        y: gridSize - 1,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      }
    );
    if (i > 0 && i < gridSize - 1) {
      wallTiles.push(
        {
          id: `wall-0-${i}`,
          type: 'wall',
          x: 0,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        },
        {
          id: `wall-${gridSize - 1}-${i}`,
          type: 'wall',
          x: gridSize - 1,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        }
      );
    }
  }
  return wallTiles;
}

// Helper: Create node tiles for goal positions
function createNodeTiles(goalPositions: Position[]): Tile[] {
  return goalPositions.map((p) => ({
    id: `node-${p.x}-${p.y}`,
    type: 'node' as const,
    x: p.x,
    y: p.y,
    connections: ['up', 'down', 'left', 'right'] as Direction[],
    isGoalNode: true,
    canRotate: false,
  }));
}

// Helper: Route paths between goal nodes using Manhattan distance
// ── Route path helpers ────────────────────────────────────────────────────────

function addPathToMap(
  pathDirs: Map<string, Direction[]>,
  x: number,
  y: number,
  dirs: Direction[]
): void {
  const key = `${x},${y}`;
  const existing = pathDirs.get(key) ?? [];
  const merged = [...new Set([...existing, ...dirs])];
  pathDirs.set(key, merged);
}

function routeHorizontal(
  pathDirs: Map<string, Direction[]>,
  from: Position,
  to: Position,
  cy: number
): number {
  let cx = from.x;
  while (cx !== to.x) {
    const dx = to.x > cx ? 1 : -1;
    const dir: Direction = dx > 0 ? 'right' : 'left';
    addPathToMap(pathDirs, cx, cy, [dir]);
    cx += dx;
    const opp: Direction = dx > 0 ? 'left' : 'right';
    addPathToMap(pathDirs, cx, cy, [opp]);
  }
  return cx;
}

function routeVertical(
  pathDirs: Map<string, Direction[]>,
  cx: number,
  from: Position,
  to: Position
): void {
  let cy = from.y;
  while (cy !== to.y) {
    const dy = to.y > cy ? 1 : -1;
    const dir: Direction = dy > 0 ? 'down' : 'up';
    addPathToMap(pathDirs, cx, cy, [dir]);
    cy += dy;
    const opp: Direction = dy > 0 ? 'up' : 'down';
    addPathToMap(pathDirs, cx, cy, [opp]);
  }
}

function createRoutePaths(goalPositions: Position[], pathDirs: Map<string, Direction[]>): void {
  // Create paths between all goal nodes in sequence
  for (let i = 0; i < goalPositions.length - 1; i++) {
    const from = goalPositions[i];
    const to = goalPositions[i + 1];

    // Move horizontally first
    const cx = routeHorizontal(pathDirs, from, to, from.y);

    // Then move vertically
    routeVertical(pathDirs, cx, from, to);
  }
}

// Helper: Create path tiles from routing information
function createPathTiles(pathDirs: Map<string, Direction[]>, goalSet: Set<string>): Tile[] {
  const pipeShapes: Direction[][] = [
    ['up', 'down'],
    ['left', 'right'],
    ['up', 'right'],
    ['right', 'down'],
    ['down', 'left'],
    ['left', 'up'],
  ];

  const pathTiles: Tile[] = [];
  pathDirs.forEach((dirs, key) => {
    const [px, py] = key.split(',').map(Number);
    if (goalSet.has(key)) return;

    // Find a pipe shape that can rotate to match needed connections
    let bestShape = pipeShapes[0];
    for (const shape of pipeShapes) {
      for (let r = 0; r < 4; r++) {
        const rotated = new Set(shape.map((d) => DIRS[(DIRS.indexOf(d) + r) % 4]));
        if (dirs.every((d) => rotated.has(d))) {
          bestShape = shape;
          break;
        }
      }
    }

    // Scramble: start in wrong rotation
    const scrambleAmount = rng(1, 3);
    const scrambledConns = bestShape.map((d) => DIRS[(DIRS.indexOf(d) + scrambleAmount) % 4]);

    pathTiles.push({
      id: `path-${px}-${py}`,
      type: 'path',
      x: px,
      y: py,
      connections: scrambledConns,
      isGoalNode: false,
      canRotate: true,
    });
  });

  return pathTiles;
}

// Helper: Create decoy tiles in empty spaces
function createDecoyTiles(decoyCount: number, gridSize: number, occupiedKeys: Set<string>): Tile[] {
  const pipeShapes: Direction[][] = [
    ['up', 'down'],
    ['left', 'right'],
    ['up', 'right'],
    ['right', 'down'],
    ['down', 'left'],
    ['left', 'up'],
  ];

  const decoyTiles: Tile[] = [];

  if (decoyCount > 0) {
    const interiorCells: Position[] = [];
    for (let y = 1; y < gridSize - 1; y++)
      for (let x = 1; x < gridSize - 1; x++)
        if (!occupiedKeys.has(`${x},${y}`)) interiorCells.push({ x, y });

    const shuffledInterior = shuffleArray(interiorCells);
    for (let i = 0; i < Math.min(decoyCount, shuffledInterior.length); i++) {
      const { x, y } = shuffledInterior[i];
      const dirs = pipeShapes[rng(0, pipeShapes.length - 1)];
      decoyTiles.push({
        id: `decoy-${x}-${y}`,
        type: 'path',
        x,
        y,
        connections: dirs,
        isGoalNode: false,
        canRotate: true,
      });
    }
  }

  return decoyTiles;
}

export function generateLevel(opts: GenerateOptions): Level {
  const { gridSize, nodeCount, difficulty } = opts;
  const diffParams = getDifficultyParams(difficulty);
  const useDecoys = opts.decoys ?? diffParams.decoyCount > 0;
  const decoyCount = useDecoys ? diffParams.decoyCount : 0;

  for (let attempt = 0; attempt < 50; attempt++) {
    const margin = Math.min(2, Math.floor(gridSize / 3));
    const candidates: Position[] = [];
    for (let y = margin; y < gridSize - margin; y++)
      for (let x = margin; x < gridSize - margin; x++) candidates.push({ x, y });

    const goalPositions = selectGoalPositions(candidates, nodeCount);
    if (goalPositions.length < nodeCount) continue;

    const pathDirs = new Map<string, Direction[]>();
    createRoutePaths(goalPositions, pathDirs);

    const wallTiles = createWallTiles(gridSize);
    const goalSet = new Set(goalPositions.map((p) => `${p.x},${p.y}`));
    const nodeTiles = createNodeTiles(goalPositions);
    const pathTiles = createPathTiles(pathDirs, goalSet);

    const allTiles = [...wallTiles, ...nodeTiles, ...pathTiles];

    // CRITICAL: Check if level is already solved before scrambling more
    // An empty solution array [] means 0 moves needed = already connected
    if (isConnected(allTiles, goalPositions)) continue;

    const estimatedMaxMoves = pathTiles.length * 3 + diffParams.movePadding;
    const solution = solve(allTiles, goalPositions, estimatedMaxMoves);

    // Skip if unsolvable OR if already solved (empty solution = 0 moves)
    if (!solution || solution.length === 0) continue;

    const minMoves = solution.reduce((s, p) => s + p.rotations, 0);
    const maxMoves = minMoves + diffParams.movePadding;

    const occupiedKeys = new Set([
      ...goalPositions.map((p) => `${p.x},${p.y}`),
      ...pathTiles.map((t) => `${t.x},${t.y}`),
    ]);

    const decoyTiles = createDecoyTiles(decoyCount, gridSize, occupiedKeys);

    const finalTiles = [...wallTiles, ...nodeTiles, ...pathTiles, ...decoyTiles];

    return {
      id: Date.now() + attempt,
      name: generateLevelName(difficulty),
      world: 4,
      gridSize,
      tiles: finalTiles,
      compressionDelay: diffParams.compressionDelay,
      maxMoves,
      goalNodes: goalPositions,
      isGenerated: true,
      solution,
    };
  }

  return generateSimpleFallback(gridSize, difficulty);
}

function generateLevelName(difficulty: string): string {
  const byDiff: Record<string, string[]> = {
    easy: ['Calm', 'Gentle', 'Soft', 'Slow', 'Easy', 'Mild', 'Simple', 'Light', 'Smooth', 'Basic'],
    medium: [
      'Twisted',
      'Warped',
      'Fractured',
      'Bent',
      'Coiled',
      'Tangled',
      'Knotted',
      'Looped',
      'Wired',
      'Crossed',
    ],
    hard: [
      'Brutal',
      'Savage',
      'Merciless',
      'Vicious',
      'Deadly',
      'Fierce',
      'Extreme',
      'Critical',
      'Lethal',
      'Crushing',
    ],
  };
  const nouns = [
    'Circuit',
    'Conduit',
    'Nexus',
    'Node',
    'Web',
    'Mesh',
    'Matrix',
    'Grid',
    'Array',
    'Path',
    'Strand',
    'Line',
    'Flow',
    'Pulse',
    'Link',
    'Chain',
    'Pipe',
    'Thread',
    'Wire',
    'Route',
  ];
  const adj = (byDiff[difficulty] ?? byDiff.medium)[Math.floor(Math.random() * 10)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

function generateSimpleFallback(gridSize: number, difficulty: string): Level {
  const mid = Math.floor(gridSize / 2);
  const diffParams = {
    easy: { compressionDelay: 10000, movePadding: 4 },
    medium: { compressionDelay: 6000, movePadding: 2 },
    hard: { compressionDelay: 4000, movePadding: 1 },
  }[difficulty as DifficultyLevel] ?? { compressionDelay: 6000, movePadding: 2 };

  const wallTiles = createWallTiles(gridSize);

  // Start with vertical pipe (needs to be rotated horizontal to connect)
  const tiles: Tile[] = [
    ...wallTiles,
    {
      id: 'node-1-mid',
      type: 'node',
      x: 1,
      y: mid,
      connections: ['up', 'down', 'left', 'right'] as Direction[],
      isGoalNode: true,
      canRotate: false,
    },
    {
      id: 'path-mid-mid',
      type: 'path',
      x: mid,
      y: mid,
      connections: ['up', 'down'] as Direction[],
      isGoalNode: false,
      canRotate: true,
    },
    {
      id: `node-${gridSize - 2}-mid`,
      type: 'node',
      x: gridSize - 2,
      y: mid,
      connections: ['up', 'down', 'left', 'right'] as Direction[],
      isGoalNode: true,
      canRotate: false,
    },
  ];

  const goalNodes = [
    { x: 1, y: mid },
    { x: gridSize - 2, y: mid },
  ];

  // Verify not already solved
  if (isConnected(tiles, goalNodes)) {
    // Force rotate the path to break connection
    const pathIdx = tiles.findIndex((t) => t.type === 'path' && t.canRotate);
    if (pathIdx >= 0) {
      tiles[pathIdx] = { ...tiles[pathIdx], connections: ['left', 'up'] };
    }
  }

  const solution = solve(tiles, goalNodes, 3 + diffParams.movePadding);
  const minMoves = solution ? solution.reduce((s, p) => s + p.rotations, 0) : 1;

  return {
    id: Date.now(),
    name: 'Simple Path',
    world: 4,
    gridSize,
    tiles,
    compressionDelay: diffParams.compressionDelay,
    maxMoves: minMoves + diffParams.movePadding,
    goalNodes,
    isGenerated: true,
    solution,
  };
}
