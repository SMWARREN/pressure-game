// PRESSURE - Level Solver
// Uses Iterative Deepening DFS for memory efficiency
// Run with: npx tsx src/cli/solver.ts

import type { Level, Tile, Position, Direction } from '../game/types';
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

/**
 * Rotate tile connections by 90 degrees clockwise
 */
function rotateConnections(connections: Direction[], times: number = 1): Direction[] {
  const dirs: Direction[] = ['up', 'right', 'down', 'left'];
  return connections.map((c) => dirs[(dirs.indexOf(c) + times) % 4]);
}

/**
 * Check if all goal nodes are connected
 */
function checkWin(tiles: Tile[], goalNodes: Position[]): boolean {
  if (goalNodes.length < 2) return true;

  const tileMap = new Map<string, Tile>();
  for (const tile of tiles) {
    tileMap.set(`${tile.x},${tile.y}`, tile);
  }

  const visited = new Set<string>();
  const stack = [`${goalNodes[0].x},${goalNodes[0].y}`];

  while (stack.length > 0) {
    const key = stack.pop()!;
    if (visited.has(key)) continue;
    visited.add(key);

    const tile = tileMap.get(key);
    if (!tile || tile.type === 'wall' || tile.type === 'crushed') continue;

    for (const dir of tile.connections) {
      const nx = tile.x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0);
      const ny = tile.y + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0);
      const nkey = `${nx},${ny}`;

      if (visited.has(nkey)) continue;

      const neighbor = tileMap.get(nkey);
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue;

      const opposite: Direction =
        dir === 'up' ? 'down' : dir === 'down' ? 'up' : dir === 'left' ? 'right' : 'left';
      if (neighbor.connections.includes(opposite)) {
        stack.push(nkey);
      }
    }
  }

  return goalNodes.every((g) => visited.has(`${g.x},${g.y}`));
}

/**
 * Solution move representation
 */
interface Move {
  x: number;
  y: number;
  rotations: number;
}

/**
 * Iterative Deepening DFS - memory efficient
 */
function solveLevelIDDFS(level: Level): { solvable: boolean; minRotations: number; moves: Move[] } {
  const baseTiles = level.tiles.map((t) => ({ ...t, connections: [...t.connections] }));

  // Check if already solved
  if (checkWin(baseTiles, level.goalNodes)) {
    return { solvable: true, minRotations: 0, moves: [] };
  }

  // Get all rotatable tile positions
  const rotatablePositions: Position[] = level.tiles
    .filter((t) => t.canRotate)
    .map((t) => ({ x: t.x, y: t.y }));

  if (rotatablePositions.length === 0) {
    return { solvable: false, minRotations: -1, moves: [] };
  }

  // For large levels, use heuristic approach
  if (rotatablePositions.length > 12) {
    return solveLargeLevel(level, baseTiles, rotatablePositions);
  }

  // IDDFS - iterative deepening
  const rotations = new Uint8Array(rotatablePositions.length);

  for (let maxDepth = 1; maxDepth <= level.maxMoves; maxDepth++) {
    const result = iddfs(
      baseTiles,
      rotatablePositions,
      level.goalNodes,
      rotations,
      0,
      maxDepth,
      []
    );
    if (result) {
      return { solvable: true, minRotations: result.rotations, moves: result.moves };
    }
  }

  return { solvable: false, minRotations: -1, moves: [] };
}

/**
 * IDDFS recursive helper
 */
function iddfs(
  baseTiles: Tile[],
  rotatablePositions: Position[],
  goalNodes: Position[],
  rotations: Uint8Array,
  currentDepth: number,
  maxDepth: number,
  moves: Move[]
): { rotations: number; moves: Move[] } | null {
  // Apply current rotations and check win
  const tiles = applyRotations(baseTiles, rotatablePositions, rotations);
  if (checkWin(tiles, goalNodes)) {
    return { rotations: currentDepth, moves };
  }

  if (currentDepth >= maxDepth) {
    return null;
  }

  // Try each tile with each rotation
  for (let i = 0; i < rotatablePositions.length; i++) {
    const pos = rotatablePositions[i];

    for (let r = 1; r <= 3; r++) {
      // Apply rotation
      const oldRotation = rotations[i];
      rotations[i] = (rotations[i] + r) % 4;

      const newMoves = [...moves, { x: pos.x, y: pos.y, rotations: r }];
      const result = iddfs(
        baseTiles,
        rotatablePositions,
        goalNodes,
        rotations,
        currentDepth + r,
        maxDepth,
        newMoves
      );

      // Restore rotation
      rotations[i] = oldRotation;

      if (result) return result;
    }
  }

  return null;
}

/**
 * Apply rotations to base tiles
 */
function applyRotations(
  baseTiles: Tile[],
  rotatablePositions: Position[],
  rotations: Uint8Array
): Tile[] {
  return baseTiles.map((tile) => {
    const rotIndex = rotatablePositions.findIndex((p) => p.x === tile.x && p.y === tile.y);
    if (rotIndex >= 0 && tile.canRotate && rotations[rotIndex] > 0) {
      return { ...tile, connections: rotateConnections(tile.connections, rotations[rotIndex]) };
    }
    return tile;
  });
}

/**
 * Solve large levels using greedy + limited search
 */
function solveLargeLevel(
  level: Level,
  baseTiles: Tile[],
  rotatablePositions: Position[]
): { solvable: boolean; minRotations: number; moves: Move[] } {
  console.log(
    `  Using heuristic solver for large level (${rotatablePositions.length} rotatable tiles)...`
  );

  // First try greedy approach
  const greedyResult = tryGreedySolution(level, baseTiles, rotatablePositions);
  if (greedyResult.solvable) {
    return greedyResult;
  }

  // Try IDDFS with limited depth
  const maxSearchDepth = Math.min(level.maxMoves, 15);
  console.log(`  Trying IDDFS with max depth ${maxSearchDepth}...`);

  const rotations = new Uint8Array(rotatablePositions.length);

  for (let maxDepth = 1; maxDepth <= maxSearchDepth; maxDepth++) {
    const result = iddfsLarge(
      baseTiles,
      rotatablePositions,
      level.goalNodes,
      rotations,
      0,
      maxDepth,
      [],
      0
    );
    if (result) {
      console.log(`  Found solution at depth ${maxDepth}`);
      return { solvable: true, minRotations: result.rotations, moves: result.moves };
    }
  }

  console.log(`  No solution found within depth ${maxSearchDepth}`);
  return { solvable: false, minRotations: -1, moves: [] };
}

/**
 * IDDFS for large levels with pruning
 */
function iddfsLarge(
  baseTiles: Tile[],
  rotatablePositions: Position[],
  goalNodes: Position[],
  rotations: Uint8Array,
  currentDepth: number,
  maxDepth: number,
  moves: Move[],
  tileIndex: number
): { rotations: number; moves: Move[] } | null {
  // Check win at current state
  const tiles = applyRotations(baseTiles, rotatablePositions, rotations);
  if (checkWin(tiles, goalNodes)) {
    return { rotations: currentDepth, moves };
  }

  if (currentDepth >= maxDepth || tileIndex >= rotatablePositions.length) {
    return null;
  }

  const pos = rotatablePositions[tileIndex];

  // Try no rotation first (continue to next tile)
  const result = iddfsLarge(
    baseTiles,
    rotatablePositions,
    goalNodes,
    rotations,
    currentDepth,
    maxDepth,
    moves,
    tileIndex + 1
  );
  if (result) return result;

  // Try rotations
  for (let r = 1; r <= 3; r++) {
    if (currentDepth + r > maxDepth) continue;

    const oldRotation = rotations[tileIndex];
    rotations[tileIndex] = (rotations[tileIndex] + r) % 4;

    const newMoves = [...moves, { x: pos.x, y: pos.y, rotations: r }];
    const result2 = iddfsLarge(
      baseTiles,
      rotatablePositions,
      goalNodes,
      rotations,
      currentDepth + r,
      maxDepth,
      newMoves,
      tileIndex + 1
    );

    rotations[tileIndex] = oldRotation;

    if (result2) return result2;
  }

  return null;
}

/**
 * Greedy solution attempt
 */
function tryGreedySolution(
  level: Level,
  baseTiles: Tile[],
  rotatablePositions: Position[]
): { solvable: boolean; minRotations: number; moves: Move[] } {
  const tileMap = new Map<string, Tile>();
  for (const tile of baseTiles) {
    tileMap.set(`${tile.x},${tile.y}`, tile);
  }

  const rotations = new Uint8Array(rotatablePositions.length);
  const moves: Move[] = [];
  let totalRotations = 0;

  // For each rotatable tile, find the rotation that maximizes valid connections
  for (let i = 0; i < rotatablePositions.length; i++) {
    const pos = rotatablePositions[i];
    const tile = tileMap.get(`${pos.x},${pos.y}`);
    if (!tile || !tile.canRotate) continue;

    let bestRotation = 0;
    let bestScore = -1;

    for (let r = 0; r < 4; r++) {
      const rotated = rotateConnections(tile.connections, r);
      let score = 0;

      for (const dir of rotated) {
        const nx = pos.x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0);
        const ny = pos.y + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0);
        const neighbor = tileMap.get(`${nx},${ny}`);

        if (neighbor && neighbor.type !== 'wall' && neighbor.type !== 'crushed') {
          const opposite: Direction =
            dir === 'up' ? 'down' : dir === 'down' ? 'up' : dir === 'left' ? 'right' : 'left';
          if (neighbor.connections.includes(opposite)) {
            score += 2; // Valid connection
          } else {
            score += 1; // Potential connection (neighbor exists but doesn't connect)
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestRotation = r;
      }
    }

    if (bestRotation > 0) {
      rotations[i] = bestRotation;
      moves.push({ x: pos.x, y: pos.y, rotations: bestRotation });
      totalRotations += bestRotation;
    }
  }

  // Check if greedy solution works
  const finalTiles = applyRotations(baseTiles, rotatablePositions, rotations);
  if (checkWin(finalTiles, level.goalNodes)) {
    console.log(`  Greedy solution found!`);
    return { solvable: true, minRotations: totalRotations, moves };
  }

  return { solvable: false, minRotations: -1, moves: [] };
}

/**
 * Optimize moves to combine rotations on the same tile
 */
function optimizeMoves(moves: Move[]): Move[] {
  const rotationCount = new Map<string, number>();

  for (const move of moves) {
    const key = `${move.x},${move.y}`;
    rotationCount.set(key, (rotationCount.get(key) || 0) + move.rotations);
  }

  const optimized: Move[] = [];
  for (const [key, rotations] of rotationCount) {
    const [x, y] = key.split(',').map(Number);
    const normalizedRotations = rotations % 4;
    if (normalizedRotations > 0) {
      optimized.push({ x, y, rotations: normalizedRotations });
    }
  }

  return optimized;
}

/**
 * Main function to solve all levels
 */
async function main() {
  console.log(
    `\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.magenta}  PRESSURE LEVEL SOLVER - Classic Mode${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.magenta}════════════════════════════════════════════════════${colors.reset}\n`
  );

  const results: {
    level: Level;
    solvable: boolean;
    minRotations: number;
    moves: Move[];
    status: 'PASS' | 'FAIL' | 'WARN';
  }[] = [];

  for (const level of CLASSIC_LEVELS) {
    console.log(
      `${colors.bold}Level ${level.id}: "${level.name}" (${level.gridSize}x${level.gridSize})${colors.reset}`
    );
    console.log(
      `  maxMoves: ${level.maxMoves}, rotatable tiles: ${level.tiles.filter((t) => t.canRotate).length}`
    );

    // Solve with IDDFS
    const result = solveLevelIDDFS(level);
    const optimizedMoves = optimizeMoves(result.moves);

    let status: 'PASS' | 'FAIL' | 'WARN';
    if (!result.solvable) {
      status = 'FAIL';
      console.log(`  ${colors.red}✗ NOT SOLVABLE${colors.reset}`);
    } else if (result.minRotations > level.maxMoves) {
      status = 'FAIL';
      console.log(
        `  ${colors.red}✗ REQUIRES ${result.minRotations} ROTATIONS (maxMoves: ${level.maxMoves})${colors.reset}`
      );
    } else if (result.minRotations === level.maxMoves) {
      status = 'WARN';
      console.log(
        `  ${colors.yellow}⚠ EXACTLY ${result.minRotations} ROTATIONS (maxMoves: ${level.maxMoves})${colors.reset}`
      );
    } else {
      status = 'PASS';
      const margin = level.maxMoves - result.minRotations;
      console.log(
        `  ${colors.green}✓ SOLVABLE in ${result.minRotations} rotations (maxMoves: ${level.maxMoves}, margin: ${margin})${colors.reset}`
      );
    }

    if (result.solvable && optimizedMoves.length > 0) {
      console.log(`  Solution (${optimizedMoves.length} tiles):`);
      for (const move of optimizedMoves) {
        console.log(`    (${move.x}, ${move.y}): ${move.rotations} rotation(s)`);
      }
    }

    console.log('');

    results.push({ level, ...result, moves: optimizedMoves, status });
  }

  // Summary
  console.log(
    `\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  SUMMARY${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}════════════════════════════════════════════════════${colors.reset}\n`
  );

  const passed = results.filter((r) => r.status === 'PASS');
  const warned = results.filter((r) => r.status === 'WARN');
  const failed = results.filter((r) => r.status === 'FAIL');

  console.log(`${colors.green}PASSED: ${passed.length}${colors.reset}`);
  console.log(`${colors.yellow}WARNED: ${warned.length}${colors.reset}`);
  console.log(`${colors.red}FAILED: ${failed.length}${colors.reset}`);
  console.log('');

  if (failed.length > 0) {
    console.log(`${colors.bold}${colors.red}Failed Levels:${colors.reset}`);
    for (const { level, solvable, minRotations } of failed) {
      console.log(
        `  Level ${level.id} "${level.name}": ${solvable ? `needs ${minRotations} rotations (maxMoves: ${level.maxMoves})` : 'NOT SOLVABLE'}`
      );
    }
    console.log('');
  }

  if (warned.length > 0) {
    console.log(`${colors.bold}${colors.yellow}Warning Levels (exact move count):${colors.reset}`);
    for (const { level, minRotations } of warned) {
      console.log(
        `  Level ${level.id} "${level.name}": ${minRotations} rotations (maxMoves: ${level.maxMoves})`
      );
    }
    console.log('');
  }

  // Generate suggested fixes
  if (failed.length > 0 || warned.length > 0) {
    console.log(`${colors.bold}${colors.cyan}Suggested Fixes:${colors.reset}`);
    for (const { level, solvable, minRotations } of [...failed, ...warned]) {
      if (solvable) {
        const newMaxMoves = Math.ceil(minRotations * 1.5);
        console.log(`  Level ${level.id}: maxMoves ${level.maxMoves} → ${newMaxMoves}`);
      } else {
        console.log(`  Level ${level.id}: NEEDS REDESIGN - not solvable`);
      }
    }
    console.log('');
  }

  // Output solution code for each level
  console.log(`\n${colors.bold}${colors.cyan}Solution Code:${colors.reset}\n`);
  for (const { level, solvable, minRotations, moves } of results) {
    if (solvable && moves.length > 0) {
      console.log(`// Level ${level.id} "${level.name}" - ${minRotations} rotations`);
      console.log(`solution: [`);
      for (const move of moves) {
        console.log(`  { x: ${move.x}, y: ${move.y}, rotations: ${move.rotations} },`);
      }
      console.log(`],`);
    }
  }
}

main().catch(console.error);
