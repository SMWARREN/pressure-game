// PRESSURE - CLI Game Tester
// Tests game boards using the actual PressureEngine.
// Run with: npm run test:game [options] [level.json]

import type { Level, Tile, Position, Direction, GameState } from '../game/types';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createCompressionSystem } from '../game/engine/compression';

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

// Use the actual compression system from the engine
const compressionSystem = createCompressionSystem();

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
 * Render game state
 */
function renderGameState(
  tiles: Tile[],
  gridSize: number,
  wallOffset: number,
  moves: number,
  maxMoves: number,
  status: string,
  timeUntilCompression: number,
  compressionDelay: number,
  modeName: string,
  extraInfo?: string
): void {
  console.clear();
  console.log(`\n${colors.bold}${colors.magenta}═══ PRESSURE GAME TESTER ═══${colors.reset}\n`);

  console.log(`${colors.bold}Mode:${colors.reset} ${colors.green}${modeName}${colors.reset}`);
  console.log(`${colors.bold}Moves:${colors.reset} ${moves}/${maxMoves}`);
  console.log(
    `${colors.bold}Status:${colors.reset} ${status === 'playing' ? colors.green : status === 'won' ? colors.cyan : colors.red}${status}${colors.reset}`
  );
  console.log(
    `${colors.bold}Wall Offset:${colors.reset} ${wallOffset}/${Math.floor(gridSize / 2)}`
  );
  console.log(
    `${colors.bold}Compression Timer:${colors.reset} ${timeUntilCompression}ms / ${compressionDelay}ms`
  );
  if (extraInfo) {
    console.log(`${colors.bold}Info:${colors.reset} ${extraInfo}`);
  }

  console.log(`\n${renderBoard(tiles, gridSize, wallOffset)}\n`);

  console.log(`${colors.dim}Legend:${colors.reset}`);
  console.log(
    `  ${colors.cyan}[│]${colors.reset} Goal Node  ${colors.blue}(│)${colors.reset} Node  ${colors.white}│${colors.reset} Path`
  );
  console.log(
    `  ${colors.dim}██${colors.reset} Wall  ${colors.red}✗✗${colors.reset} Crushed  ${colors.yellow}(in danger)${colors.reset}`
  );
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
 * Rotate tile connections
 */
function rotateConnections(connections: Direction[], times: number = 1): Direction[] {
  const dirs: Direction[] = ['up', 'right', 'down', 'left'];
  return connections.map((c) => dirs[(dirs.indexOf(c) + times) % 4]);
}

/**
 * Apply a move to the tiles
 */
function applyMove(tiles: Tile[], x: number, y: number): Tile[] {
  return tiles.map((tile) => {
    if (tile.x === x && tile.y === y && tile.canRotate) {
      return { ...tile, connections: rotateConnections(tile.connections, 1) };
    }
    return tile;
  });
}

/**
 * Advance walls using the ACTUAL engine compression system
 */
function advanceWalls(
  tiles: Tile[],
  wallOffset: number,
  level: Level,
  modeId: string
): { tiles: Tile[]; wallOffset: number; gameOver: boolean; crushedGoal: Position | null } {
  const ctx = {
    modeId,
    level,
    getState: () => ({ currentModeId: modeId }) as GameState,
    setState: () => {},
    sfx: () => {},
  };

  const result = compressionSystem.advance(tiles, wallOffset, level, ctx);

  let crushedGoal: Position | null = null;
  if (result.gameOver) {
    for (const g of level.goalNodes) {
      const tile = result.tiles.find((t) => t.x === g.x && t.y === g.y);
      if (tile?.type === 'crushed') {
        crushedGoal = g;
        break;
      }
    }
  }

  return {
    tiles: result.tiles,
    wallOffset: result.newOffset,
    gameOver: result.gameOver,
    crushedGoal,
  };
}

/**
 * Test scenario result
 */
interface TestResult {
  name: string;
  passed: boolean;
  steps: string[];
  finalStatus: string;
  error?: string;
}

/**
 * Run a single simulation
 */
async function runSimulation(
  level: Level,
  modeName: string,
  modeId: string,
  autoPlay: boolean,
  delay: number = 300
): Promise<{ status: string; tiles: Tile[]; wallOffset: number; moves: number; log: string[] }> {
  let tiles = level.tiles.map((t) => ({ ...t, connections: [...t.connections] }));
  let wallOffset = 0;
  let moves = 0;
  let status = 'playing';
  let timeUntilCompression = level.compressionDelay;
  const log: string[] = [];

  log.push(`Initial state - ${level.gridSize}x${level.gridSize} grid, ${level.maxMoves} max moves`);

  // Check if already won
  if (checkWin(tiles, level.goalNodes)) {
    status = 'won';
    log.push(`WIN: Goals already connected at start`);
    if (delay > 0) {
      renderGameState(
        tiles,
        level.gridSize,
        wallOffset,
        moves,
        level.maxMoves,
        status,
        timeUntilCompression,
        level.compressionDelay,
        modeName
      );
    }
    return { status, tiles, wallOffset, moves, log };
  }

  // Auto-play solution if provided
  if (autoPlay && level.solution) {
    for (const sol of level.solution) {
      for (let i = 0; i < sol.rotations; i++) {
        // Check move limit BEFORE making the move
        if (moves >= level.maxMoves) {
          log.push(`Move limit reached (${moves}/${level.maxMoves}) - cannot continue`);
          // Continue to compression phase instead of returning
          break;
        }

        tiles = applyMove(tiles, sol.x, sol.y);
        moves++;
        log.push(`Move ${moves}: Rotated tile (${sol.x}, ${sol.y})`);

        if (delay > 0) {
          renderGameState(
            tiles,
            level.gridSize,
            wallOffset,
            moves,
            level.maxMoves,
            status,
            timeUntilCompression,
            level.compressionDelay,
            modeName
          );
          await new Promise((r) => setTimeout(r, delay));
        }

        if (checkWin(tiles, level.goalNodes)) {
          status = 'won';
          log.push(`WIN: All goal nodes connected after ${moves} moves`);
          return { status, tiles, wallOffset, moves, log };
        }
      }
      // Break out of outer loop if move limit reached
      if (moves >= level.maxMoves) break;
    }
  }

  // Simulate compression cycles
  let compressionCycles = 0;
  const maxCycles = 10;

  while (status === 'playing' && compressionCycles < maxCycles) {
    timeUntilCompression -= 1000;

    if (timeUntilCompression <= 0) {
      timeUntilCompression = level.compressionDelay;
      compressionCycles++;

      const result = advanceWalls(tiles, wallOffset, level, modeId);
      tiles = result.tiles;
      wallOffset = result.wallOffset;

      if (result.gameOver && result.crushedGoal) {
        status = 'lost';
        log.push(
          `LOSS: Wall advanced to offset ${wallOffset} - Goal at (${result.crushedGoal.x}, ${result.crushedGoal.y}) crushed!`
        );

        if (delay > 0) {
          renderGameState(
            tiles,
            level.gridSize,
            wallOffset,
            moves,
            level.maxMoves,
            status,
            timeUntilCompression,
            level.compressionDelay,
            modeName,
            `Goal at (${result.crushedGoal.x}, ${result.crushedGoal.y}) was crushed!`
          );
        }
        break;
      }

      log.push(`Compression: Wall advanced to offset ${wallOffset}`);

      if (delay > 0) {
        renderGameState(
          tiles,
          level.gridSize,
          wallOffset,
          moves,
          level.maxMoves,
          status,
          timeUntilCompression,
          level.compressionDelay,
          modeName
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (delay > 0 && status === 'playing') {
      renderGameState(
        tiles,
        level.gridSize,
        wallOffset,
        moves,
        level.maxMoves,
        status,
        timeUntilCompression,
        level.compressionDelay,
        modeName
      );
      await new Promise((r) => setTimeout(r, delay / 2));
    }
  }

  return { status, tiles, wallOffset, moves, log };
}

/**
 * Run all test scenarios
 */
async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log(
    `\n${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.magenta}  PRESSURE GAME TESTER - ALL SCENARIOS${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  // ═══════════════════════════════════════════════════════════════════════
  // WIN SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.bold}${colors.green}═══ WIN SCENARIOS ═══${colors.reset}\n`);

  // Test 1: Simple win (1 move)
  {
    const test: TestResult = {
      name: 'Win - Simple (1 move)',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 1,
      name: 'Simple Connection',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 10000,
      maxMoves: 5,
      goalNodes: [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ],
      solution: [{ x: 2, y: 2, rotations: 1 }],
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', true, 200);
      test.passed = result.status === 'won';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 2: Win on last move
  {
    const test: TestResult = {
      name: 'Win - On Last Move',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 2,
      name: 'Last Move Win',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 10000,
      maxMoves: 1,
      goalNodes: [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ],
      solution: [{ x: 2, y: 2, rotations: 1 }],
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', true, 200);
      test.passed = result.status === 'won' && result.moves === 1;
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 3: Win with multiple rotations
  {
    const test: TestResult = {
      name: 'Win - Multiple Rotations (3)',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 3,
      name: 'Triple Rotate',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 10000,
      maxMoves: 5,
      goalNodes: [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ],
      solution: [{ x: 2, y: 2, rotations: 3 }],
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', true, 200);
      test.passed = result.status === 'won';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 4: Win before compression
  {
    const test: TestResult = {
      name: 'Win - Before Compression',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 4,
      name: 'Close Call',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 1500,
      maxMoves: 5,
      goalNodes: [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ],
      solution: [{ x: 2, y: 2, rotations: 1 }],
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', true, 200);
      test.passed = result.status === 'won' && result.wallOffset === 0;
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 5: Win - Already connected
  {
    const test: TestResult = {
      name: 'Win - Already Connected',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 5,
      name: 'Big Board',
      world: 4,
      gridSize: 10,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 4,
          y: 5,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 5,
          y: 5,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
      ],
      compressionDelay: 5000,
      maxMoves: 5,
      goalNodes: [
        { x: 4, y: 5 },
        { x: 5, y: 5 },
      ],
      solution: [],
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', true, 200);
      test.passed = result.status === 'won';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 6: Win - Zen mode (no compression)
  {
    const test: TestResult = {
      name: 'Win - Zen Mode (no compression)',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 6,
      name: 'Zen Garden',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 0,
      maxMoves: 999,
      goalNodes: [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ],
      solution: [{ x: 2, y: 2, rotations: 1 }],
      compressionEnabled: false,
    };
    try {
      const result = await runSimulation(level, 'Zen', 'zen', true, 200);
      test.passed = result.status === 'won' && result.wallOffset === 0;
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 7: Win - Blitz mode (fast)
  {
    const test: TestResult = {
      name: 'Win - Blitz Mode (fast)',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 7,
      name: 'Blitz Round',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 2000,
      maxMoves: 3,
      goalNodes: [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ],
      solution: [{ x: 2, y: 2, rotations: 1 }],
    };
    try {
      const result = await runSimulation(level, 'Blitz', 'blitz', true, 150);
      test.passed = result.status === 'won';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LOSS SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.bold}${colors.red}═══ LOSS SCENARIOS ═══${colors.reset}\n`);

  // Test 8: Loss - Wall crush (goal at edge)
  {
    const test: TestResult = {
      name: 'Loss - Wall Crush (goal at edge)',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 8,
      name: 'Goal in Danger',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 1,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 3,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 1000,
      maxMoves: 10,
      goalNodes: [
        { x: 1, y: 1 },
        { x: 3, y: 3 },
      ],
      solution: [],
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', false, 100);
      test.passed = result.status === 'lost';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 9: Loss - Fast compression (Blitz)
  {
    const test: TestResult = {
      name: 'Loss - Fast Compression (Blitz)',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 9,
      name: 'Blitz Danger',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 1,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 3,
          y: 3,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 500,
      maxMoves: 10,
      goalNodes: [
        { x: 1, y: 1 },
        { x: 3, y: 3 },
      ],
      solution: [],
    };
    try {
      const result = await runSimulation(level, 'Blitz', 'blitz', false, 50);
      test.passed = result.status === 'lost';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 10: Loss - Move limit exceeded (need 3 rotations, only 1 allowed)
  {
    const test: TestResult = {
      name: 'Loss - Move Limit Exceeded',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 10,
      name: 'Move Limit',
      world: 1,
      gridSize: 5,
      tiles: [
        // Goals positioned to need specific connections
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 2,
          y: 3,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        // Path at (2,2) needs 'left' for g1 and 'down' for g2
        // Path ['up', 'right'] needs 3 rotations to become ['up', 'left'] -> wait that's wrong
        // Let's use ['up', 'right'] which becomes ['left', 'up'] after 3 rotations
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'right'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 10000,
      maxMoves: 1, // Only 1 move, but need 3 rotations
      goalNodes: [
        { x: 1, y: 2 },
        { x: 2, y: 3 },
      ],
      solution: [{ x: 2, y: 2, rotations: 3 }], // Needs 3 rotations: up-right -> right-down -> down-left -> left-up
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', true, 200);
      // Should NOT win because we can't complete the solution with only 1 move
      test.passed = result.status !== 'won';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  // Test 11: Loss - Both goals crushed simultaneously
  {
    const test: TestResult = {
      name: 'Loss - Both Goals Crushed',
      passed: false,
      steps: [],
      finalStatus: '',
    };
    const level: Level = {
      id: 11,
      name: 'Double Crush',
      world: 1,
      gridSize: 5,
      tiles: [
        {
          id: 'g1',
          type: 'node',
          x: 1,
          y: 1,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'g2',
          type: 'node',
          x: 1,
          y: 3,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: true,
          canRotate: false,
        },
        {
          id: 'p1',
          type: 'path',
          x: 2,
          y: 2,
          connections: ['up', 'down', 'left', 'right'],
          isGoalNode: false,
          canRotate: true,
        },
      ],
      compressionDelay: 1000,
      maxMoves: 10,
      goalNodes: [
        { x: 1, y: 1 },
        { x: 1, y: 3 },
      ],
      solution: [],
    };
    try {
      const result = await runSimulation(level, 'Classic', 'classic', false, 100);
      test.passed = result.status === 'lost';
      test.steps = result.log;
      test.finalStatus = result.status;
    } catch (e) {
      test.error = String(e);
    }
    results.push(test);
    console.log(
      `${test.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${test.name}: ${test.finalStatus}`
    );
  }

  return results;
}

/**
 * Print summary
 */
function printSummary(results: TestResult[]): void {
  console.log(
    `\n${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  TEST SUMMARY${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  // Group by win/loss
  const winTests = results.filter((r) => r.name.startsWith('Win'));
  const lossTests = results.filter((r) => r.name.startsWith('Loss'));

  console.log(`${colors.bold}${colors.green}WINS:${colors.reset}`);
  for (const result of winTests) {
    const icon = result.passed
      ? `${colors.green}✓${colors.reset}`
      : `${colors.red}✗${colors.reset}`;
    console.log(`  ${icon} ${result.name}: ${result.finalStatus}`);
    if (result.error) console.log(`    ${colors.red}Error: ${result.error}${colors.reset}`);
  }

  console.log(`\n${colors.bold}${colors.red}LOSSES:${colors.reset}`);
  for (const result of lossTests) {
    const icon = result.passed
      ? `${colors.green}✓${colors.reset}`
      : `${colors.red}✗${colors.reset}`;
    console.log(`  ${icon} ${result.name}: ${result.finalStatus}`);
    if (result.error) console.log(`    ${colors.red}Error: ${result.error}${colors.reset}`);
  }

  console.log(`\n${colors.bold}Total: ${passed}/${total} tests passed${colors.reset}`);

  if (passed === total) {
    console.log(`${colors.green}${colors.bold}All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}${total - passed} test(s) failed${colors.reset}`);
  }
}

/**
 * Load level from file
 */
function loadLevelFromFile(filePath: string): Level | null {
  const fullPath = resolve(filePath);
  if (!existsSync(fullPath)) {
    console.error(`${colors.red}Error: File not found: ${fullPath}${colors.reset}`);
    return null;
  }
  try {
    const content = readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as Level;
  } catch (error) {
    console.error(`${colors.red}Error parsing JSON: ${error}${colors.reset}`);
    return null;
  }
}

/**
 * Print usage
 */
function printUsage(): void {
  console.log(`
${colors.bold}${colors.magenta}PRESSURE Game Tester${colors.reset}

${colors.bold}Usage:${colors.reset}
  npm run test:game [options] [level.json]
  npx tsx src/cli/game-tester.ts [options] [level.json]

${colors.bold}Options:${colors.reset}
  --all        Run all test scenarios
  --no-auto    Don't auto-play the solution
  --help, -h   Show this help message

${colors.bold}Examples:${colors.reset}
  npm run test:game -- --all              Run all test scenarios
  npm run test:game level.json            Load and test a specific level
  npm run test:game --no-auto level.json  Load level without auto-playing
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  let autoPlay = true;
  let runAll = false;
  let levelFile: string | null = null;

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--all') {
      runAll = true;
    } else if (arg === '--no-auto') {
      autoPlay = false;
    } else if (!arg.startsWith('--')) {
      levelFile = arg;
    }
  }

  if (runAll) {
    const results = await runAllTests();
    printSummary(results);
    return;
  }

  if (levelFile) {
    const level = loadLevelFromFile(levelFile);
    if (!level) process.exit(1);

    // Fill walls
    for (let i = 0; i < level.gridSize; i++) {
      for (let j = 0; j < level.gridSize; j++) {
        const isEdge = i === 0 || i === level.gridSize - 1 || j === 0 || j === level.gridSize - 1;
        const exists = level.tiles.some((t) => t.x === i && t.y === j);
        if (isEdge && !exists) {
          level.tiles.push({
            id: `wall-${i}-${j}`,
            type: 'wall',
            x: i,
            y: j,
            connections: [],
            isGoalNode: false,
            canRotate: false,
          });
        }
      }
    }

    await runSimulation(level, 'Custom', 'classic', autoPlay, 300);
  } else {
    const results = await runAllTests();
    printSummary(results);
  }
}

main().catch(console.error);
