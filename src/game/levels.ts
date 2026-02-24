// PRESSURE - Level Utilities
// Solution computation, verification, and procedural generation.
// Classic mode levels are now in src/game/modes/classic/levels.ts

import { Level, Tile, Position, Direction } from './types';

// Re-export CLASSIC_LEVELS for backward compatibility
export { CLASSIC_LEVELS } from './modes/classic/levels';

// null  = computed, no solution found
// entry missing = not yet computed
const solutionCache = new Map<number, { x: number; y: number; rotations: number }[] | null>();

const DIRS: Direction[] = ['up', 'right', 'down', 'left'];
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

function rotate(conns: Direction[], times: number): Direction[] {
  return conns.map((c) => DIRS[(DIRS.indexOf(c) + times) % 4]);
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
      let nx = curr.x,
        ny = curr.y;
      if (d === 'up') ny--;
      else if (d === 'down') ny++;
      else if (d === 'left') nx--;
      else if (d === 'right') nx++;

      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;

      const neighbor = getTile(nx, ny);
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

// BFS solver - returns solution path or undefined
function solve(
  tiles: Tile[],
  goals: Position[],
  maxMoves: number
): { x: number; y: number; rotations: number }[] | undefined {
  if (isConnected(tiles, goals)) return [];

  const rotatable = tiles.filter((t) => t.canRotate);
  if (rotatable.length === 0) return undefined;

  const visited = new Set<string>();
  const queue: { tiles: Tile[]; path: { x: number; y: number; rotations: number }[] }[] = [
    { tiles: [...tiles], path: [] },
  ];

  const hash = (ts: Tile[]) =>
    ts
      .filter((t) => t.canRotate)
      .map((t) => `${t.x},${t.y}:${t.connections.join(',')}`)
      .sort()
      .join('|');

  visited.add(hash(tiles));

  let iterations = 0;
  const MAX_ITERATIONS = 50_000;

  while (queue.length > 0) {
    if (++iterations > MAX_ITERATIONS) return undefined;

    const curr = queue.shift()!;

    for (const rt of rotatable) {
      for (let r = 1; r <= 3; r++) {
        const newTiles = curr.tiles.map((t) => {
          if (t.x === rt.x && t.y === rt.y) {
            return { ...t, connections: rotate(t.connections, r) };
          }
          return t;
        });

        const h = hash(newTiles);
        if (visited.has(h)) continue;
        visited.add(h);

        const newPath = [...curr.path, { x: rt.x, y: rt.y, rotations: r }];

        if (isConnected(newTiles, goals)) return newPath;

        const totalMoves = newPath.reduce((s, p) => s + p.rotations, 0);
        if (totalMoves < maxMoves) {
          queue.push({ tiles: newTiles, path: newPath });
        }
      }
    }
  }

  return undefined;
}

// Get solution for a level — computed on first call, then cached.
// Generated levels already embed their solution so no BFS is needed for them.
export function getSolution(level: Level): { x: number; y: number; rotations: number }[] | null {
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
  difficulty: 'easy' | 'medium' | 'hard';
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

export function generateLevel(opts: GenerateOptions): Level {
  const { gridSize, nodeCount, difficulty } = opts;

  const diffParams = {
    easy: { compressionDelay: 10000, movePadding: 4, decoyCount: 0 },
    medium: { compressionDelay: 6000, movePadding: 2, decoyCount: 2 },
    hard: { compressionDelay: 4000, movePadding: 1, decoyCount: 3 },
  }[difficulty];

  const useDecoys = opts.decoys !== undefined ? opts.decoys : diffParams.decoyCount > 0;
  const decoyCount = useDecoys ? diffParams.decoyCount : 0;

  // Pipe shapes: straight and L-shapes
  const pipeShapes: Direction[][] = [
    ['up', 'down'],
    ['left', 'right'],
    ['up', 'right'],
    ['right', 'down'],
    ['down', 'left'],
    ['left', 'up'],
  ];

  for (let attempt = 0; attempt < 50; attempt++) {
    const margin = Math.min(2, Math.floor(gridSize / 3));
    const candidates: Position[] = [];
    for (let y = margin; y < gridSize - margin; y++)
      for (let x = margin; x < gridSize - margin; x++) candidates.push({ x, y });

    const shuffled = shuffleArray(candidates);
    const goalPositions: Position[] = [];
    for (const pos of shuffled) {
      if (goalPositions.length >= nodeCount) break;
      const tooClose = goalPositions.some((g) => Math.abs(g.x - pos.x) + Math.abs(g.y - pos.y) < 2);
      if (!tooClose) goalPositions.push(pos);
    }
    if (goalPositions.length < nodeCount) continue;

    const pathDirs = new Map<string, Direction[]>();

    const addPath = (x: number, y: number, dirs: Direction[]) => {
      const key = `${x},${y}`;
      const existing = pathDirs.get(key) ?? [];
      const merged = [...new Set([...existing, ...dirs])];
      pathDirs.set(key, merged);
    };

    // Create paths between all goal nodes in sequence
    for (let i = 0; i < goalPositions.length - 1; i++) {
      const from = goalPositions[i];
      const to = goalPositions[i + 1];

      let cx = from.x,
        cy = from.y;

      // Move horizontally first
      while (cx !== to.x) {
        const dx = to.x > cx ? 1 : -1;
        const dir: Direction = dx > 0 ? 'right' : 'left';
        addPath(cx, cy, [dir]);
        cx += dx;
        const opp: Direction = dx > 0 ? 'left' : 'right';
        addPath(cx, cy, [opp]);
      }

      // Then move vertically
      while (cy !== to.y) {
        const dy = to.y > cy ? 1 : -1;
        const dir: Direction = dy > 0 ? 'down' : 'up';
        addPath(cx, cy, [dir]);
        cy += dy;
        const opp: Direction = dy > 0 ? 'up' : 'down';
        addPath(cx, cy, [opp]);
      }
    }

    const wallTiles: Tile[] = [];
    for (let i = 0; i < gridSize; i++) {
      wallTiles.push({
        id: `wall-${i}-0`,
        type: 'wall',
        x: i,
        y: 0,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
      wallTiles.push({
        id: `wall-${i}-${gridSize - 1}`,
        type: 'wall',
        x: i,
        y: gridSize - 1,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
      if (i > 0 && i < gridSize - 1) {
        wallTiles.push({
          id: `wall-0-${i}`,
          type: 'wall',
          x: 0,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
        wallTiles.push({
          id: `wall-${gridSize - 1}-${i}`,
          type: 'wall',
          x: gridSize - 1,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
      }
    }

    const goalSet = new Set(goalPositions.map((p) => `${p.x},${p.y}`));
    const nodeTiles: Tile[] = goalPositions.map((p) => ({
      id: `node-${p.x}-${p.y}`,
      type: 'node' as const,
      x: p.x,
      y: p.y,
      connections: ['up', 'down', 'left', 'right'] as Direction[],
      isGoalNode: true,
      canRotate: false,
    }));

    const pathTiles: Tile[] = [];
    pathDirs.forEach((dirs, key) => {
      const [px, py] = key.split(',').map(Number);
      if (goalSet.has(key)) return;

      // Find a pipe shape that can rotate to match needed connections
      let bestShape = pipeShapes[0];
      for (const shape of pipeShapes) {
        for (let r = 0; r < 4; r++) {
          const rotated = shape.map((d) => DIRS[(DIRS.indexOf(d) + r) % 4]);
          if (dirs.every((d) => rotated.includes(d))) {
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
  }[difficulty as 'easy' | 'medium' | 'hard'] ?? { compressionDelay: 6000, movePadding: 2 };

  const wallTiles: Tile[] = [];
  for (let i = 0; i < gridSize; i++) {
    wallTiles.push({
      id: `wall-${i}-0`,
      type: 'wall',
      x: i,
      y: 0,
      connections: [],
      isGoalNode: false,
      canRotate: false,
    });
    wallTiles.push({
      id: `wall-${i}-${gridSize - 1}`,
      type: 'wall',
      x: i,
      y: gridSize - 1,
      connections: [],
      isGoalNode: false,
      canRotate: false,
    });
    if (i > 0 && i < gridSize - 1) {
      wallTiles.push({
        id: `wall-0-${i}`,
        type: 'wall',
        x: 0,
        y: i,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
      wallTiles.push({
        id: `wall-${gridSize - 1}-${i}`,
        type: 'wall',
        x: gridSize - 1,
        y: i,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
    }
  }

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
