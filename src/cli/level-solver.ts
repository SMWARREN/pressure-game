// PRESSURE - CLI Level Solver
// Solves all levels across all game modes using the engine.
// Run with: npm run solve [options]

import type { Level, Tile, Position, Direction } from '../game/types';
import { createCompressionSystem } from '../game/engine/compression';
import { generateLevel } from '../game/levels';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all level sets
import { CLASSIC_LEVELS } from '../game/modes/classic/levels';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Compression system
const compressionSystem = createCompressionSystem();

// All level collections
const ALL_LEVELS: Record<string, Level[]> = {
  classic: CLASSIC_LEVELS,
};

// Pipe characters for connections
const pipeChars: Record<string, string> = {
  'up-down': '│',
  'left-right': '─',
  'up-right': '└',
  'up-left': '┘',
  'down-right': '┌',
  'down-left': '┐',
  'up-down-left-right': '┼',
  'up-down-left': '┤',
  'up-down-right': '├',
  'up-left-right': '┴',
  'down-left-right': '┬',
  up: '╵',
  down: '╷',
  left: '╴',
  right: '╶',
};

const DIRS: Direction[] = ['up', 'right', 'down', 'left'];
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/**
 * Get the pipe character for a tile based on its connections
 */
function getPipeChar(connections: Direction[]): string {
  if (connections.length === 0) return '·';
  const sorted = [...connections].sort() as Direction[];
  const key = sorted.join('-');
  return pipeChars[key] || '·';
}

/**
 * Get the color for a tile type
 */
function getTileColor(tile: Tile, wallOffset: number, gridSize: number): string {
  const dist = Math.min(tile.x, tile.y, gridSize - 1 - tile.x, gridSize - 1 - tile.y);
  const inDanger = dist <= wallOffset;

  switch (tile.type) {
    case 'wall':
      return colors.dim;
    case 'node':
      return tile.isGoalNode ? colors.cyan : colors.blue;
    case 'path':
      return inDanger ? colors.yellow : colors.white;
    case 'crushed':
      return colors.red;
    default:
      return colors.dim;
  }
}

/**
 * Render a single tile (2 chars wide)
 */
function renderTile(tile: Tile, wallOffset: number, gridSize: number): string {
  const color = getTileColor(tile, wallOffset, gridSize);

  if (tile.type === 'wall') return `${colors.dim}██${colors.reset}`;
  if (tile.type === 'crushed') return `${colors.red}✗✗${colors.reset}`;
  if (tile.type === 'node' && tile.isGoalNode) {
    const pipe = getPipeChar(tile.connections);
    return `${colors.cyan}${colors.bold}[${pipe}]${colors.reset}`;
  }
  if (tile.type === 'node') {
    const pipe = getPipeChar(tile.connections);
    return `${colors.blue}(${pipe})${colors.reset}`;
  }
  const pipe = getPipeChar(tile.connections);
  return `${color} ${pipe} ${colors.reset}`;
}

/**
 * Render the game board with proper box boundaries
 */
function renderBoard(tiles: Tile[], gridSize: number, wallOffset: number): string {
  const tileMap = new Map<string, Tile>();
  for (const tile of tiles) {
    tileMap.set(`${tile.x},${tile.y}`, tile);
  }

  const lines: string[] = [];

  // Top border
  let topBorder = '  ┌';
  for (let x = 0; x < gridSize; x++) {
    const dist = Math.min(x, gridSize - 1 - x);
    if (dist < wallOffset) {
      topBorder += `${colors.red}──${colors.reset}`;
    } else {
      topBorder += `${colors.dim}──${colors.reset}`;
    }
  }
  topBorder += `${colors.dim}┐${colors.reset}`;
  lines.push(topBorder);

  // Grid rows
  for (let y = 0; y < gridSize; y++) {
    const yDist = Math.min(y, gridSize - 1 - y);
    const leftCrushed = yDist < wallOffset;

    // Left border
    let row = leftCrushed ? `${colors.red}  ${colors.reset}` : '  ';
    row += leftCrushed ? `${colors.red}│${colors.reset}` : `${colors.dim}│${colors.reset}`;

    // Tiles
    for (let x = 0; x < gridSize; x++) {
      const tile = tileMap.get(`${x},${y}`);
      if (tile) {
        row += renderTile(tile, wallOffset, gridSize);
      } else {
        const dist = Math.min(x, y, gridSize - 1 - x, gridSize - 1 - y);
        if (dist < wallOffset) {
          row += `${colors.red}██${colors.reset}`;
        } else {
          row += '  ';
        }
      }
    }

    // Right border
    row += leftCrushed ? `${colors.red}│${colors.reset}` : `${colors.dim}│${colors.reset}`;
    lines.push(row);
  }

  // Bottom border
  let bottomBorder = '  └';
  for (let x = 0; x < gridSize; x++) {
    const dist = Math.min(x, gridSize - 1 - x);
    if (dist < wallOffset) {
      bottomBorder += `${colors.red}──${colors.reset}`;
    } else {
      bottomBorder += `${colors.dim}──${colors.reset}`;
    }
  }
  bottomBorder += `${colors.dim}┘${colors.reset}`;
  lines.push(bottomBorder);

  return lines.join('\n');
}

/**
 * Rotate tile connections
 */
function rotate(conns: Direction[], times: number): Direction[] {
  return conns.map((c) => DIRS[(DIRS.indexOf(c) + times) % 4]);
}

/**
 * Check if all goal nodes are connected (BFS)
 */
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

/**
 * BFS solver - returns solution path or null if unsolvable
 * Enhanced with timeout for impossible levels
 */
function solveBFS(
  tiles: Tile[],
  goals: Position[],
  maxMoves: number,
  timeoutMs: number = 5000
): { x: number; y: number; rotations: number }[] | null {
  // Check if already connected - this is a level design issue, not a solution
  if (isConnected(tiles, goals)) return null; // Return null to indicate "already solved" bug

  const rotatable = tiles.filter((t) => t.canRotate);
  if (rotatable.length === 0) return null;

  const startTime = Date.now();
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

  while (queue.length > 0) {
    // Check timeout every 1000 iterations
    if (++iterations % 1000 === 0) {
      if (Date.now() - startTime > timeoutMs) {
        return null; // Timed out
      }
    }

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

  return null;
}

/**
 * Apply a move to the tiles
 */
function applyMove(tiles: Tile[], x: number, y: number): Tile[] {
  return tiles.map((tile) => {
    if (tile.x === x && tile.y === y && tile.canRotate) {
      return { ...tile, connections: rotate(tile.connections, 1) };
    }
    return tile;
  });
}

/**
 * Advance walls using the engine compression system
 */
function advanceWalls(
  tiles: Tile[],
  wallOffset: number,
  level: Level,
  modeId: string
): { tiles: Tile[]; wallOffset: number; gameOver: boolean } {
  const ctx = {
    modeId,
    level,
    getState: () => ({ currentModeId: modeId }) as any,
    setState: () => {},
    sfx: () => {},
  };

  const result = compressionSystem.advance(tiles, wallOffset, level, ctx);

  return {
    tiles: result.tiles,
    wallOffset: result.newOffset,
    gameOver: result.gameOver,
  };
}

/**
 * Fixed level result
 */
interface FixedLevel {
  original: Level;
  fixed: Level;
  fixType: 'scrambled' | 'maxmoves_increased' | 'regenerated';
  description: string;
}

/**
 * Solve result
 */
interface SolveResult {
  modeId: string;
  levelId: number;
  levelName: string;
  status: 'won' | 'lost' | 'no_solution' | 'impossible';
  moves: number;
  maxMoves: number;
  minMoves: number;
  solution: { x: number; y: number; rotations: number }[];
  wallOffset: number;
  log: string[];
  fixSuggestion?: string;
  fixedLevel?: FixedLevel;
}

/**
 * Generate a descriptive name for a level based on its characteristics
 */
function generateDescriptiveName(level: Level, difficulty: string): string {
  const nodeCount = level.goalNodes.length;
  const gridSize = level.gridSize;
  const rotatableCount = level.tiles.filter((t) => t.canRotate).length;

  // Shape descriptors based on node positions
  const nodes = level.goalNodes;
  const shapeDescriptor = analyzeNodeShape(nodes);

  // Complexity descriptor
  const complexity =
    rotatableCount <= 3
      ? 'Simple'
      : rotatableCount <= 6
        ? 'Moderate'
        : rotatableCount <= 10
          ? 'Complex'
          : 'Intricate';

  // Build name
  const parts: string[] = [];

  // Add shape descriptor
  if (shapeDescriptor) {
    parts.push(shapeDescriptor);
  }

  // Add complexity for harder levels
  if (difficulty === 'hard' || difficulty === 'medium') {
    parts.push(complexity);
  }

  // Add node count descriptor for multi-node levels
  if (nodeCount > 2) {
    const nodeDesc =
      nodeCount === 3
        ? 'Triangle'
        : nodeCount === 4
          ? 'Square'
          : nodeCount === 5
            ? 'Pentagon'
            : nodeCount === 6
              ? 'Hexagon'
              : `${nodeCount}-Node`;
    parts.push(nodeDesc);
  }

  // Fallback if no descriptors
  if (parts.length === 0) {
    parts.push(gridSize <= 5 ? 'Basic' : 'Extended');
  }

  return parts.join(' ');
}

/**
 * Analyze the shape formed by goal nodes
 */
function analyzeNodeShape(nodes: Position[]): string {
  if (nodes.length < 2) return '';

  // Check if nodes are in a line
  const allSameX = nodes.every((n) => n.x === nodes[0].x);
  const allSameY = nodes.every((n) => n.y === nodes[0].y);

  if (allSameX || allSameY) {
    return 'Linear';
  }

  // Check for diagonal
  const sortedByX = [...nodes].sort((a, b) => a.x - b.x);
  let isDiagonal = true;
  for (let i = 1; i < sortedByX.length; i++) {
    if (
      Math.abs(sortedByX[i].y - sortedByX[i - 1].y) !==
      Math.abs(sortedByX[i].x - sortedByX[i - 1].x)
    ) {
      isDiagonal = false;
      break;
    }
  }
  if (isDiagonal) return 'Diagonal';

  // Check for L-shape (2 nodes forming corner)
  if (nodes.length === 2) {
    const dx = Math.abs(nodes[0].x - nodes[1].x);
    const dy = Math.abs(nodes[0].y - nodes[1].y);
    if (dx > 0 && dy > 0) return 'Corner';
  }

  // Check for spread pattern
  const xRange = Math.max(...nodes.map((n) => n.x)) - Math.min(...nodes.map((n) => n.x));
  const yRange = Math.max(...nodes.map((n) => n.y)) - Math.min(...nodes.map((n) => n.y));

  if (xRange > 3 || yRange > 3) return 'Spread';
  if (xRange <= 2 && yRange <= 2) return 'Compact';

  return 'Clustered';
}

/**
 * Scramble pipes in a level that starts in a won state
 * Keeps scrambling until the connection is broken
 */
function scrambleLevel(level: Level): Level {
  let tiles = level.tiles.map((t) => ({ ...t, connections: [...t.connections] }));
  let attempts = 0;
  const maxAttempts = 100;

  // Keep trying until we break the connection or run out of attempts
  while (isConnected(tiles, level.goalNodes) && attempts < maxAttempts) {
    attempts++;
    tiles = tiles.map((t) => {
      if (!t.canRotate) return t;
      // Rotate 1-3 times randomly
      const rotations = 1 + Math.floor(Math.random() * 3);
      return { ...t, connections: rotate(t.connections, rotations) };
    });
  }

  // If still connected after many attempts, try a more aggressive approach
  if (isConnected(tiles, level.goalNodes)) {
    // Rotate ALL rotatable tiles by 1
    tiles = tiles.map((t) => {
      if (!t.canRotate) return t;
      return { ...t, connections: rotate(t.connections, 1) };
    });
  }

  return { ...level, tiles };
}

/**
 * Fix a broken level based on its issue type
 */
function fixLevel(level: Level, result: SolveResult): FixedLevel | null {
  // Case 1: Level starts in won state - scramble pipes
  if (result.status === 'no_solution' && result.fixSuggestion?.includes('won state')) {
    const scrambled = scrambleLevel(level);
    return {
      original: level,
      fixed: scrambled,
      fixType: 'scrambled',
      description: 'Scrambled pipes to break initial connection',
    };
  }

  // Case 2: maxMoves too low - increase it
  if (result.status === 'impossible' && result.minMoves > 0) {
    const fixed = { ...level, maxMoves: result.minMoves + 2 };
    return {
      original: level,
      fixed,
      fixType: 'maxmoves_increased',
      description: `Increased maxMoves from ${level.maxMoves} to ${fixed.maxMoves}`,
    };
  }

  // Case 3: Level is unsolvable - regenerate with same parameters
  if (result.status === 'no_solution') {
    const difficulty =
      level.compressionDelay >= 10000 ? 'easy' : level.compressionDelay >= 5000 ? 'medium' : 'hard';
    const generated = generateLevel({
      gridSize: level.gridSize,
      nodeCount: level.goalNodes.length,
      difficulty,
    });

    // Generate a descriptive name based on level characteristics
    const nodeCount = generated.goalNodes.length;
    const gridSize = generated.gridSize;
    const descriptiveName = generateDescriptiveName(generated, difficulty);

    // Preserve the original level's identity but with new descriptive name
    const fixed: Level = {
      ...generated,
      id: level.id,
      name: descriptiveName,
      world: level.world,
    };

    return {
      original: level,
      fixed,
      fixType: 'regenerated',
      description: `Regenerated as "${descriptiveName}" (${gridSize}x${gridSize}, ${nodeCount} nodes, ${difficulty})`,
    };
  }

  return null;
}

/**
 * Solve a pipe-based level using BFS
 */
function solveLevel(
  level: Level,
  modeId: string,
  verbose: boolean = false,
  _autoFix: boolean = false
): SolveResult {
  const log: string[] = [];
  let tiles = level.tiles.map((t) => ({ ...t, connections: [...t.connections] }));
  let wallOffset = 0;
  let moves = 0;

  log.push(`Level ${level.id}: "${level.name}" (${level.gridSize}x${level.gridSize})`);
  log.push(`Max moves: ${level.maxMoves}, Compression delay: ${level.compressionDelay}ms`);
  log.push(`Goal nodes: ${level.goalNodes.map((g) => `(${g.x},${g.y})`).join(', ')}`);

  // Count rotatable tiles
  const rotatable = tiles.filter((t) => t.canRotate);
  log.push(`Rotatable tiles: ${rotatable.length}`);

  // Check if already won at start - this is a LEVEL DESIGN BUG
  if (isConnected(tiles, level.goalNodes)) {
    log.push(`BUG: Goals already connected at start - level needs to be fixed!`);
    return {
      modeId,
      levelId: level.id,
      levelName: level.name,
      status: 'no_solution', // Treat as broken level
      moves: 0,
      maxMoves: level.maxMoves,
      minMoves: -1,
      solution: [],
      wallOffset: 0,
      log,
      fixSuggestion: `Level starts in a won state! Scramble the pipes so player needs to make moves.`,
    };
  }

  // Use BFS to find solution with 5 second timeout per level
  const timeoutMs = 5000;
  log.push(`Running BFS solver (${timeoutMs}ms timeout)...`);

  const solution = solveBFS(tiles, level.goalNodes, level.maxMoves * 2, timeoutMs);

  if (!solution) {
    log.push(`NO_SOLUTION: BFS could not find a solution`);

    // Provide fix suggestion
    const fixSuggestion =
      `Level may be unsolvable. Check:\n` +
      `  1. Are all goal nodes reachable via path tiles?\n` +
      `  2. Do path tiles have correct connection types?\n` +
      `  3. Is maxMoves (${level.maxMoves}) sufficient?`;

    return {
      modeId,
      levelId: level.id,
      levelName: level.name,
      status: 'no_solution',
      moves: 0,
      maxMoves: level.maxMoves,
      minMoves: -1,
      solution: [],
      wallOffset: 0,
      log,
      fixSuggestion,
    };
  }

  const minMoves = solution.reduce((s, p) => s + p.rotations, 0);
  log.push(`Solution found: ${solution.length} tile rotations, ${minMoves} total moves`);

  // Check if solution is possible within maxMoves
  if (minMoves > level.maxMoves) {
    log.push(`IMPOSSIBLE: Solution requires ${minMoves} moves but maxMoves is ${level.maxMoves}`);
    return {
      modeId,
      levelId: level.id,
      levelName: level.name,
      status: 'impossible',
      moves: 0,
      maxMoves: level.maxMoves,
      minMoves,
      solution,
      wallOffset: 0,
      log,
      fixSuggestion: `Increase maxMoves from ${level.maxMoves} to at least ${minMoves}`,
    };
  }

  // Apply the solution
  for (const sol of solution) {
    for (let i = 0; i < sol.rotations; i++) {
      if (moves >= level.maxMoves) {
        log.push(`LOSS: Move limit reached (${moves}/${level.maxMoves})`);
        return {
          modeId,
          levelId: level.id,
          levelName: level.name,
          status: 'lost',
          moves,
          maxMoves: level.maxMoves,
          minMoves,
          solution,
          wallOffset,
          log,
        };
      }

      tiles = applyMove(tiles, sol.x, sol.y);
      moves++;
      log.push(`Move ${moves}: Rotated tile (${sol.x}, ${sol.y})`);

      if (isConnected(tiles, level.goalNodes)) {
        log.push(`WIN: All goal nodes connected after ${moves} moves`);
        if (verbose) {
          console.log(`\n${renderBoard(tiles, level.gridSize, wallOffset)}\n`);
        }
        return {
          modeId,
          levelId: level.id,
          levelName: level.name,
          status: 'won',
          moves,
          maxMoves: level.maxMoves,
          minMoves,
          solution,
          wallOffset,
          log,
        };
      }
    }
  }

  // Simulate compression cycles if not won yet
  const compressionEnabled = level.compressionEnabled !== false && level.compressionDelay > 0;

  if (compressionEnabled) {
    log.push(`Simulating compression cycles...`);
    let compressionCycles = 0;
    const maxCycles = Math.floor(level.gridSize / 2) + 2;

    while (compressionCycles < maxCycles) {
      const result = advanceWalls(tiles, wallOffset, level, modeId);
      tiles = result.tiles;
      wallOffset = result.wallOffset;
      compressionCycles++;

      log.push(`Compression cycle ${compressionCycles}: Wall offset = ${wallOffset}`);

      if (result.gameOver) {
        log.push(`LOSS: Goal crushed at wall offset ${wallOffset}`);
        if (verbose) {
          console.log(`\n${renderBoard(tiles, level.gridSize, wallOffset)}\n`);
        }
        return {
          modeId,
          levelId: level.id,
          levelName: level.name,
          status: 'lost',
          moves,
          maxMoves: level.maxMoves,
          minMoves,
          solution,
          wallOffset,
          log,
        };
      }

      // Check win after each compression
      if (isConnected(tiles, level.goalNodes)) {
        log.push(`WIN: Goals connected after compression cycle ${compressionCycles}`);
        return {
          modeId,
          levelId: level.id,
          levelName: level.name,
          status: 'won',
          moves,
          maxMoves: level.maxMoves,
          minMoves,
          solution,
          wallOffset,
          log,
        };
      }
    }
  }

  // Final check
  if (isConnected(tiles, level.goalNodes)) {
    log.push(`WIN: Goals connected`);
    return {
      modeId,
      levelId: level.id,
      levelName: level.name,
      status: 'won',
      moves,
      maxMoves: level.maxMoves,
      minMoves,
      solution,
      wallOffset,
      log,
    };
  }

  log.push(`LOSS: Could not connect all goals after applying solution`);
  return {
    modeId,
    levelId: level.id,
    levelName: level.name,
    status: 'lost',
    moves,
    maxMoves: level.maxMoves,
    minMoves,
    solution,
    wallOffset,
    log,
  };
}

/**
 * Solve all levels for a specific mode
 */
function solveModeLevels(
  modeId: string,
  levels: Level[],
  verbose: boolean = false,
  autoFix: boolean = false
): { results: SolveResult[]; fixedLevels: FixedLevel[] } {
  const results: SolveResult[] = [];
  const fixedLevels: FixedLevel[] = [];

  console.log(
    `\n${colors.bold}${colors.magenta}═══ ${modeId.toUpperCase()} MODE ═══${colors.reset}`
  );
  console.log(
    `${colors.dim}Solving ${levels.length} levels...${autoFix ? ' (auto-fix enabled)' : ''}${colors.reset}\n`
  );

  for (const level of levels) {
    let result = solveLevel(level, modeId, verbose, autoFix);

    // If auto-fix is enabled and level is broken, try to fix it
    if (autoFix && result.status !== 'won') {
      const fixed = fixLevel(level, result);
      if (fixed) {
        console.log(`${colors.yellow}    Fixing: ${fixed.description}${colors.reset}`);

        // Re-solve the fixed level
        const fixedResult = solveLevel(fixed.fixed, modeId, verbose, false);
        if (fixedResult.status === 'won') {
          fixedResult.fixedLevel = fixed;
          result = fixedResult;
          fixedLevels.push(fixed);
        }
      }
    }

    results.push(result);

    const statusIcon =
      result.status === 'won'
        ? `${colors.green}✓${colors.reset}`
        : result.status === 'no_solution'
          ? `${colors.yellow}○${colors.reset}`
          : result.status === 'impossible'
            ? `${colors.magenta}!${colors.reset}`
            : `${colors.red}✗${colors.reset}`;

    const statusText =
      result.status === 'won'
        ? result.fixedLevel
          ? `${colors.green}FIXED & WON${colors.reset}`
          : `${colors.green}WON${colors.reset}`
        : result.status === 'no_solution'
          ? `${colors.yellow}NO SOLUTION${colors.reset}`
          : result.status === 'impossible'
            ? `${colors.magenta}IMPOSSIBLE${colors.reset}`
            : `${colors.red}LOST${colors.reset}`;

    const movesInfo =
      result.minMoves >= 0
        ? `${result.moves}/${result.maxMoves} moves (min: ${result.minMoves})`
        : `${result.moves}/${result.maxMoves} moves`;

    console.log(
      `  ${statusIcon} Level ${result.levelId} "${result.levelName}": ${statusText} ` +
        `(${movesInfo})`
    );

    if (verbose && result.log.length > 0) {
      console.log(`${colors.dim}${result.log.slice(-5).join('\n')}${colors.reset}`);
    }
  }

  // Print fixed levels summary
  if (fixedLevels.length > 0) {
    console.log(
      `\n${colors.green}${colors.bold}Fixed ${fixedLevels.length} levels:${colors.reset}`
    );
    for (const f of fixedLevels) {
      console.log(`  ${colors.green}✓${colors.reset} Level ${f.original.id}: ${f.description}`);
    }
  }

  return { results, fixedLevels };
}

/**
 * Print summary of all results
 */
function printSummary(allResults: SolveResult[]): void {
  console.log(
    `\n${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  SOLVER SUMMARY${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  const won = allResults.filter((r) => r.status === 'won').length;
  const lost = allResults.filter((r) => r.status === 'lost').length;
  const noSolution = allResults.filter((r) => r.status === 'no_solution').length;
  const impossible = allResults.filter((r) => r.status === 'impossible').length;
  const total = allResults.length;

  // Group by mode
  const modeGroups = new Map<string, SolveResult[]>();
  for (const result of allResults) {
    const group = modeGroups.get(result.modeId) || [];
    group.push(result);
    modeGroups.set(result.modeId, group);
  }

  for (const [modeId, results] of modeGroups) {
    const modeWon = results.filter((r) => r.status === 'won').length;
    const modeTotal = results.length;
    const percentage = Math.round((modeWon / modeTotal) * 100);

    console.log(
      `${colors.bold}${modeId.toUpperCase()}:${colors.reset} ` +
        `${modeWon}/${modeTotal} solved (${percentage}%)`
    );

    // Show failed/impossible levels
    const failed = results.filter((r) => r.status !== 'won');
    if (failed.length > 0) {
      for (const f of failed) {
        const statusText =
          f.status === 'no_solution'
            ? 'no solution'
            : f.status === 'impossible'
              ? `impossible (needs ${f.minMoves} moves, max is ${f.maxMoves})`
              : 'failed';
        console.log(
          `  ${colors.red}✗${colors.reset} Level ${f.levelId} "${f.levelName}" - ${statusText}`
        );
        if (f.fixSuggestion) {
          console.log(`${colors.dim}    Fix: ${f.fixSuggestion.split('\n')[0]}${colors.reset}`);
        }
      }
    }
  }

  console.log(`\n${colors.bold}───────────────────────────────────────${colors.reset}`);
  console.log(
    `${colors.bold}Total:${colors.reset} ` +
      `${colors.green}${won} won${colors.reset}, ` +
      `${colors.red}${lost} lost${colors.reset}, ` +
      `${colors.yellow}${noSolution} no solution${colors.reset}, ` +
      `${colors.magenta}${impossible} impossible${colors.reset} ` +
      `out of ${total} levels`
  );

  const percentage = Math.round((won / total) * 100);
  if (percentage === 100) {
    console.log(`${colors.green}${colors.bold}All levels solved! 🎉${colors.reset}`);
  } else {
    console.log(`${colors.bold}Solve rate: ${percentage}%${colors.reset}`);
  }
}

/**
 * Generate TypeScript code for a level
 */
function generateLevelCode(level: Level): string {
  const tilesStr = level.tiles
    .map((t) => {
      const conns =
        t.connections.length > 0 ? `[${t.connections.map((c) => `'${c}'`).join(', ')}]` : '[]';
      return `    {
      id: '${t.id}',
      type: '${t.type}',
      x: ${t.x},
      y: ${t.y},
      connections: ${conns} as Direction[],
      isGoalNode: ${t.isGoalNode},
      canRotate: ${t.canRotate},
    }`;
    })
    .join(',\n');

  const goalsStr = level.goalNodes.map((g) => `{ x: ${g.x}, y: ${g.y} }`).join(', ');

  return `{
  id: ${level.id},
  name: '${level.name}',
  world: ${level.world},
  gridSize: ${level.gridSize},
  tiles: [
${tilesStr}
  ],
  compressionDelay: ${level.compressionDelay},
  maxMoves: ${level.maxMoves},
  goalNodes: [${goalsStr}],
}`;
}

/**
 * Write fixed levels back to the source file
 */
function writeFixedLevels(modeId: string, fixedLevels: FixedLevel[]): void {
  if (fixedLevels.length === 0) return;

  const modeFileMap: Record<string, string> = {
    classic: path.join(__dirname, '../game/modes/classic/levels.ts'),
  };

  const filePath = modeFileMap[modeId];
  if (!filePath) {
    console.log(
      `${colors.yellow}Warning: No file path configured for mode ${modeId}${colors.reset}`
    );
    return;
  }

  // Read the current file
  let content = fs.readFileSync(filePath, 'utf-8');

  // For each fixed level, we need to update the level in the file
  // This is a simplified approach - we'll regenerate the entire CLASSIC_LEVELS array
  console.log(
    `${colors.cyan}Writing ${fixedLevels.length} fixed levels to ${filePath}${colors.reset}`
  );

  // Create a map of fixed levels by ID
  const fixedById = new Map<number, Level>();
  for (const f of fixedLevels) {
    fixedById.set(f.original.id, f.fixed);
  }

  // Get all current levels and apply fixes
  const currentLevels = ALL_LEVELS[modeId] || [];
  const updatedLevels = currentLevels.map((level) => {
    const fixed = fixedById.get(level.id);
    return fixed || level;
  });

  // Generate the new levels array code
  const levelsCode = updatedLevels.map((l) => generateLevelCode(l)).join(',\n\n');

  // Find and replace the CLASSIC_LEVELS array
  // This regex matches the export statement and array
  const exportRegex = /export const CLASSIC_LEVELS: Level\[\] = \[[\s\S]*?\];/;

  if (exportRegex.test(content)) {
    content = content.replace(
      exportRegex,
      `export const CLASSIC_LEVELS: Level[] = [\n${levelsCode}\n];`
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(
      `${colors.green}✓ Successfully wrote ${fixedLevels.length} fixed levels to ${path.basename(filePath)}${colors.reset}`
    );
  } else {
    console.log(`${colors.red}Error: Could not find CLASSIC_LEVELS export in file${colors.reset}`);
  }
}

/**
 * Print usage
 */
function printUsage(): void {
  console.log(`
${colors.bold}${colors.magenta}PRESSURE Level Solver${colors.reset}

${colors.bold}Usage:${colors.reset}
  npm run solve [options]
  npx tsx src/cli/level-solver.ts [options]

${colors.bold}Options:${colors.reset}
  --mode <id>      Solve only a specific mode (e.g., --mode classic)
  --verbose, -v    Show detailed output for each level
  --fix            Automatically fix broken levels (scramble, adjust maxMoves, or regenerate)
  --write          Write fixed levels back to the source file (requires --fix)
  --list           List all available modes and level counts
  --help, -h       Show this help message

${colors.bold}Examples:${colors.reset}
  npm run solve                     Solve all levels across all modes
  npm run solve -- --mode classic   Solve only classic mode levels
  npm run solve -- --verbose        Solve all levels with detailed output
  npm run solve -- --fix            Solve and auto-fix broken levels
  npm run solve -- --fix --write    Solve, fix, and write changes to file
  npm run solve -- --list           List all modes
`);
}

/**
 * List all available modes
 */
function listModes(): void {
  console.log(`\n${colors.bold}${colors.magenta}Available Game Modes:${colors.reset}\n`);

  for (const [modeId, levels] of Object.entries(ALL_LEVELS)) {
    console.log(`  ${colors.bold}${modeId}${colors.reset}: ${levels.length} levels`);
  }

  const total = Object.values(ALL_LEVELS).reduce((sum, levels) => sum + levels.length, 0);
  console.log(
    `\n${colors.dim}Total: ${total} levels across ${Object.keys(ALL_LEVELS).length} modes${colors.reset}\n`
  );
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  let verbose = false;
  let specificMode: string | null = null;
  let showList = false;
  let autoFix = false;
  let writeToFile = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--list') {
      showList = true;
    } else if (arg === '--fix') {
      autoFix = true;
    } else if (arg === '--write') {
      writeToFile = true;
    } else if (arg === '--mode') {
      specificMode = args[++i];
    }
  }

  if (showList) {
    listModes();
    process.exit(0);
  }

  // --write requires --fix
  if (writeToFile && !autoFix) {
    console.log(
      `${colors.yellow}Warning: --write requires --fix. Enabling --fix automatically.${colors.reset}`
    );
    autoFix = true;
  }

  console.log(
    `\n${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  PRESSURE LEVEL SOLVER${colors.reset}`);
  if (autoFix) {
    console.log(`${colors.yellow}  Auto-fix mode enabled${colors.reset}`);
    if (writeToFile) {
      console.log(`${colors.cyan}  Write-to-file enabled${colors.reset}`);
    }
  }
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );

  const allResults: SolveResult[] = [];
  const allFixedLevels: FixedLevel[] = [];

  if (specificMode) {
    const levels = ALL_LEVELS[specificMode];
    if (!levels) {
      console.error(`${colors.red}Error: Unknown mode "${specificMode}"${colors.reset}`);
      console.log(`\nAvailable modes: ${Object.keys(ALL_LEVELS).join(', ')}`);
      process.exit(1);
    }
    const { results, fixedLevels } = solveModeLevels(specificMode, levels, verbose, autoFix);
    allResults.push(...results);
    allFixedLevels.push(...fixedLevels);

    // Write fixed levels to file if requested
    if (writeToFile && fixedLevels.length > 0) {
      writeFixedLevels(specificMode, fixedLevels);
    }
  } else {
    for (const [modeId, levels] of Object.entries(ALL_LEVELS)) {
      const { results, fixedLevels } = solveModeLevels(modeId, levels, verbose, autoFix);
      allResults.push(...results);
      allFixedLevels.push(...fixedLevels);

      // Write fixed levels to file if requested
      if (writeToFile && fixedLevels.length > 0) {
        writeFixedLevels(modeId, fixedLevels);
      }
    }
  }

  printSummary(allResults);

  // Exit with error code if any levels failed
  const failedCount = allResults.filter((r) => r.status !== 'won').length;
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch(console.error);
