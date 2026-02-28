// PRESSURE - CLI Level Enhancer
// Enhances levels by verifying, detecting duplicates, adding decoys, expanding grids, and splitting into world files.
// Uses existing BFS solver from the engine - no logic duplication.
// Run with: npm run enhance [options]

import type { Level, Tile, Position, Direction } from '../game/types';
import { getSolution, verifyLevel, generateLevel } from '../game/levels';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
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

// Import all level sets
import { CLASSIC_LEVELS } from '../game/modes/classic/levels';
import { ZEN_LEVELS_SET_2 } from '../game/modes/zen/levels';

// All level collections for analysis
// READ-ONLY sets (verified working, don't modify)
const READ_ONLY_SETS = ['classic'];

// All level collections for analysis
const ALL_LEVEL_SETS: Record<string, Level[]> = {
  classic: CLASSIC_LEVELS,
  zen_extended: ZEN_LEVELS_SET_2,
};

// ─── Types ────────────────────────────────────────────────────────────────

interface LevelIssue {
  levelId: number;
  levelName: string;
  modeId: string;
  issue: 'duplicate' | 'unsolvable' | 'already_solved' | 'max_moves_too_low';
  details: string;
  duplicateOf?: number;
}

interface EnhancedLevel {
  original: Level;
  enhanced: Level;
  changes: string[];
}

// ─── Grid Fingerprinting for Duplicate Detection ───────────────────────────

/**
 * Create a fingerprint of a level's grid layout (ignoring specific tile IDs and rotations)
 * This detects levels that are structurally the same even if pipes are rotated differently
 */
function createGridFingerprint(level: Level): string {
  const gridSize = level.gridSize;
  const goalPositions = [...level.goalNodes]
    .map((g) => `${g.x},${g.y}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|');

  // Create a map of tile positions to their types
  const tileMap = new Map<string, { type: string; canRotate: boolean }>();
  for (const tile of level.tiles) {
    if (tile.type !== 'wall') {
      tileMap.set(`${tile.x},${tile.y}`, {
        type: tile.type,
        canRotate: tile.canRotate,
      });
    }
  }

  // Create fingerprint string
  const tiles: string[] = [];
  for (let y = 1; y < gridSize - 1; y++) {
    for (let x = 1; x < gridSize - 1; x++) {
      const key = `${x},${y}`;
      const tile = tileMap.get(key);
      if (tile) {
        tiles.push(`${key}:${tile.type}${tile.canRotate ? 'r' : 'f'}`);
      }
    }
  }

  return `${gridSize}x${gridSize}:g[${goalPositions}]:t[${tiles.sort().join(';')}]`;
}

// Detailed fingerprint function removed - was unused
// Grid fingerprint (createGridFingerprint) is sufficient for duplicate detection

// ─── Duplicate Detection ───────────────────────────────────────────────────

/**
 * Find duplicate levels across all level sets
 */
function findDuplicates(): Map<string, Level[]> {
  const fingerprints = new Map<string, Level[]>();

  for (const [modeId, levels] of Object.entries(ALL_LEVEL_SETS)) {
    for (const level of levels) {
      // Use grid fingerprint for structural duplicates
      const gridFp = createGridFingerprint(level);
      const key = `${modeId}:${gridFp}`;

      if (!fingerprints.has(key)) {
        fingerprints.set(key, []);
      }
      fingerprints.get(key)!.push(level);
    }
  }

  // Filter to only entries with duplicates
  const duplicates = new Map<string, Level[]>();
  for (const [key, levels] of fingerprints) {
    if (levels.length > 1) {
      duplicates.set(key, levels);
    }
  }

  return duplicates;
}

// ─── Level Enhancement Functions ───────────────────────────────────────────

/**
 * Add decoy tiles to a level (pipes that look useful but can't be rotated)
 */
function addDecoys(level: Level, count: number = 2): Level {
  const gridSize = level.gridSize;
  const existingPositions = new Set(level.tiles.map((t) => `${t.x},${t.y}`));
  const decoys: Tile[] = [];

  // Find empty interior cells
  const emptyCells: Position[] = [];
  for (let y = 1; y < gridSize - 1; y++) {
    for (let x = 1; x < gridSize - 1; x++) {
      if (!existingPositions.has(`${x},${y}`)) {
        emptyCells.push({ x, y });
      }
    }
  }

  // Shuffle and pick random cells
  const shuffled = emptyCells.sort(() => Math.random() - 0.5);
  const connectionSets: Direction[][] = [
    ['up', 'down'],
    ['left', 'right'],
    ['up', 'right'],
    ['right', 'down'],
    ['down', 'left'],
    ['left', 'up'],
  ];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const pos = shuffled[i];
    const conns = connectionSets[Math.floor(Math.random() * connectionSets.length)];
    decoys.push({
      id: `decoy-${pos.x}-${pos.y}`,
      type: 'path',
      x: pos.x,
      y: pos.y,
      connections: [...conns],
      isGoalNode: false,
      canRotate: false, // Decoys cannot be rotated!
    });
  }

  return {
    ...level,
    tiles: [...level.tiles, ...decoys],
  };
}

/**
 * Expand a level's grid size and add more room
 */
function expandGrid(level: Level, additionalSize: number = 2): Level {
  const oldSize = level.gridSize;
  const newSize = oldSize + additionalSize;
  const offset = Math.floor(additionalSize / 2);

  // Shift all tiles by offset
  const newTiles = level.tiles.map((tile) => ({
    ...tile,
    x: tile.x + offset,
    y: tile.y + offset,
    id:
      tile.type === 'wall'
        ? `wall-${tile.x + offset}-${tile.y + offset}`
        : tile.id.replace(/(\d+)-(\d+)/, `${tile.x + offset}-${tile.y + offset}`),
  }));

  // Add new walls for the expanded grid
  const newWalls: Tile[] = [];
  for (let i = 0; i < newSize; i++) {
    // Top and bottom walls
    if (!newTiles.some((t) => t.x === i && t.y === 0)) {
      newWalls.push({
        id: `wall-${i}-0`,
        type: 'wall',
        x: i,
        y: 0,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
    }
    if (!newTiles.some((t) => t.x === i && t.y === newSize - 1)) {
      newWalls.push({
        id: `wall-${i}-${newSize - 1}`,
        type: 'wall',
        x: i,
        y: newSize - 1,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
    }
    // Left and right walls (only interior rows)
    if (i > 0 && i < newSize - 1) {
      if (!newTiles.some((t) => t.x === 0 && t.y === i)) {
        newWalls.push({
          id: `wall-0-${i}`,
          type: 'wall',
          x: 0,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
      }
      if (!newTiles.some((t) => t.x === newSize - 1 && t.y === i)) {
        newWalls.push({
          id: `wall-${newSize - 1}-${i}`,
          type: 'wall',
          x: newSize - 1,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
      }
    }
  }

  // Shift goal nodes
  const newGoalNodes = level.goalNodes.map((g) => ({
    x: g.x + offset,
    y: g.y + offset,
  }));

  return {
    ...level,
    gridSize: newSize,
    tiles: [...newTiles, ...newWalls],
    goalNodes: newGoalNodes,
  };
}

/**
 * Add pressure (compression) to a zen-style level
 */
function addPressure(level: Level, compressionDelay: number): Level {
  return {
    ...level,
    compressionDelay,
    compressionEnabled: true,
  };
}

/**
 * Scramble pipes in a level that starts in a won state
 */
function scramblePipes(level: Level): Level {
  const DIRS: Direction[] = ['up', 'right', 'down', 'left'];

  const newTiles = level.tiles.map((tile) => {
    if (!tile.canRotate) return tile;

    // Random rotation (1-3 times)
    const rotations = 1 + Math.floor(Math.random() * 3);
    const newConnections = tile.connections.map((c) => {
      const idx = DIRS.indexOf(c);
      return DIRS[(idx + rotations) % 4];
    });

    return { ...tile, connections: newConnections };
  });

  return { ...level, tiles: newTiles };
}

// ─── Level Verification ────────────────────────────────────────────────────

/**
 * Verify a level using the existing engine's BFS solver
 */
function verifyLevelWithEngine(level: Level): {
  solvable: boolean;
  minMoves: number;
  alreadySolved: boolean;
} {
  // Use the existing verifyLevel function from levels.ts
  const verification = verifyLevel(level);

  // Also check if already solved using getSolution
  const solution = getSolution(level);

  return {
    solvable: verification.solvable,
    minMoves: verification.minMoves ?? 0,
    alreadySolved: solution !== null && solution.length === 0,
  };
}

// ─── Main Enhancement Logic ────────────────────────────────────────────────

interface EnhanceOptions {
  fixUnsolvable: boolean;
  addDecoys: boolean;
  decoyCount: number;
  expandGrid: boolean;
  expandSize: number;
  addPressure: boolean;
  pressureDelay: number;
  detectDuplicates: boolean;
  splitByWorld: boolean;
  outputDir: string;
}

/**
 * Enhance all levels according to options
 */
function enhanceLevels(options: EnhanceOptions): void {
  console.log(
    `\n${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  PRESSURE LEVEL ENHANCER${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  const issues: LevelIssue[] = [];
  const enhanced: EnhancedLevel[] = [];

  // 1. Detect duplicates
  if (options.detectDuplicates) {
    console.log(`${colors.cyan}Checking for duplicate levels...${colors.reset}`);
    const duplicates = findDuplicates();

    if (duplicates.size > 0) {
      console.log(
        `${colors.yellow}Found ${duplicates.size} duplicate level structures:${colors.reset}`
      );
      for (const [, levels] of duplicates) {
        console.log(
          `  ${colors.yellow}•${colors.reset} ${levels.map((l) => `"${l.name}" (ID: ${l.id})`).join(' = ')}`
        );

        // Mark all but the first as duplicates
        for (let i = 1; i < levels.length; i++) {
          issues.push({
            levelId: levels[i].id,
            levelName: levels[i].name,
            modeId: 'various',
            issue: 'duplicate',
            details: `Same structure as "${levels[0].name}" (ID: ${levels[0].id})`,
            duplicateOf: levels[0].id,
          });
        }
      }
    } else {
      console.log(`${colors.green}✓ No duplicate levels found${colors.reset}`);
    }
    console.log();
  }

  // 2. Verify and enhance each level
  for (const [modeId, levels] of Object.entries(ALL_LEVEL_SETS)) {
    console.log(`${colors.cyan}Processing ${modeId} (${levels.length} levels)...${colors.reset}`);

    for (const level of levels) {
      const changes: string[] = [];
      let enhancedLevel = { ...level };

      // Skip modifications for read-only sets (classic levels are verified working)
      const isReadOnly = READ_ONLY_SETS.includes(modeId);

      // Verify level
      const verification = verifyLevelWithEngine(level);

      if (!verification.solvable) {
        issues.push({
          levelId: level.id,
          levelName: level.name,
          modeId,
          issue: 'unsolvable',
          details: 'Level has no valid solution',
        });

        // Only fix non-read-only levels
        if (options.fixUnsolvable && !isReadOnly) {
          // Generate a replacement level
          const newLevel = generateLevel({
            gridSize: level.gridSize,
            nodeCount: level.goalNodes.length,
            difficulty:
              level.compressionDelay >= 10000
                ? 'easy'
                : level.compressionDelay >= 5000
                  ? 'medium'
                  : 'hard',
          });

          if (newLevel) {
            enhancedLevel = {
              ...newLevel,
              id: level.id,
              name: level.name,
              world: level.world,
            };
            changes.push('Regenerated unsolvable level');
          }
        }
      } else if (verification.alreadySolved) {
        issues.push({
          levelId: level.id,
          levelName: level.name,
          modeId,
          issue: 'already_solved',
          details: 'Level starts in a solved state',
        });

        // Only fix non-read-only levels
        if (options.fixUnsolvable && !isReadOnly) {
          enhancedLevel = scramblePipes(level);
          changes.push('Scrambled pipes to break initial connection');
        }
      }

      // Only apply enhancements to non-read-only levels
      if (!isReadOnly) {
        // Add decoys
        if (options.addDecoys && verification.solvable) {
          enhancedLevel = addDecoys(enhancedLevel, options.decoyCount);
          changes.push(`Added ${options.decoyCount} non-rotatable decoy(s)`);
        }

        // Expand grid
        if (options.expandGrid && verification.solvable) {
          enhancedLevel = expandGrid(enhancedLevel, options.expandSize);
          changes.push(`Expanded grid by ${options.expandSize}`);
        }

        // Add pressure
        if (options.addPressure && verification.solvable) {
          enhancedLevel = addPressure(enhancedLevel, options.pressureDelay);
          changes.push(`Added pressure (${options.pressureDelay}ms compression delay)`);
        }
      }

      if (changes.length > 0) {
        enhanced.push({
          original: level,
          enhanced: enhancedLevel,
          changes,
        });
      }
    }
  }

  // 3. Print summary
  console.log(
    `\n${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  SUMMARY${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  if (issues.length > 0) {
    console.log(`${colors.yellow}Issues found: ${issues.length}${colors.reset}`);
    for (const issue of issues) {
      const icon =
        issue.issue === 'duplicate'
          ? '⟳'
          : issue.issue === 'unsolvable'
            ? '✗'
            : issue.issue === 'already_solved'
              ? '!'
              : '?';
      console.log(
        `  ${colors.yellow}${icon}${colors.reset} Level ${issue.levelId} "${issue.levelName}": ${issue.issue} - ${issue.details}`
      );
    }
  } else {
    console.log(`${colors.green}✓ All levels verified successfully${colors.reset}`);
  }

  if (enhanced.length > 0) {
    console.log(`\n${colors.green}Enhanced ${enhanced.length} levels:${colors.reset}`);
    for (const e of enhanced) {
      console.log(
        `  ${colors.green}✓${colors.reset} Level ${e.original.id} "${e.original.name}": ${e.changes.join(', ')}`
      );
    }
  }

  // 4. Split by world if requested
  if (options.splitByWorld) {
    console.log(
      `\n${colors.cyan}Splitting levels by world into ${options.outputDir}...${colors.reset}`
    );
    splitLevelsByWorld(options.outputDir);
  }
}

/**
 * Split levels into separate files by world
 */
function splitLevelsByWorld(outputDir: string): void {
  const output = path.join(__dirname, '..', '..', outputDir);

  // Ensure output directory exists
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }

  for (const [modeId, levels] of Object.entries(ALL_LEVEL_SETS)) {
    const modeDir = path.join(output, modeId);
    if (!fs.existsSync(modeDir)) {
      fs.mkdirSync(modeDir, { recursive: true });
    }

    // Group by world
    const worldMap = new Map<number, Level[]>();
    for (const level of levels) {
      const world = level.world;
      if (!worldMap.has(world)) {
        worldMap.set(world, []);
      }
      worldMap.get(world)!.push(level);
    }

    // Write each world to a separate file
    for (const [worldId, worldLevels] of worldMap) {
      const filename = `world-${worldId}.ts`;
      const filepath = path.join(modeDir, filename);

      const code = generateWorldFile(worldId, worldLevels, modeId);
      fs.writeFileSync(filepath, code, 'utf-8');

      console.log(
        `  ${colors.green}✓${colors.reset} ${modeId}/world-${worldId}.ts (${worldLevels.length} levels)`
      );
    }
  }
}

/**
 * Generate TypeScript code for a world file
 */
function generateWorldFile(worldId: number, levels: Level[], modeId: string): string {
  const levelsCode = levels.map((l) => generateLevelCode(l)).join(',\n\n');

  return `// PRESSURE - ${modeId.toUpperCase()} World ${worldId} Levels
// Auto-generated by level-enhancer.ts

import { Level, Direction } from '../../types';

export const WORLD_${worldId}_LEVELS: Level[] = [
${levelsCode}
];
`;
}

/**
 * Generate TypeScript code for a single level
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

// ─── CLI Interface ─────────────────────────────────────────────────────────

function printUsage(): void {
  console.log(`
${colors.bold}${colors.magenta}PRESSURE Level Enhancer${colors.reset}

${colors.bold}Usage:${colors.reset}
  npm run enhance [options]
  npx tsx src/cli/level-enhancer.ts [options]

${colors.bold}Options:${colors.reset}
  --fix                Fix unsolvable and already-solved levels
  --decoys [n]         Add n non-rotatable decoy tiles (default: 2)
  --expand [n]         Expand grid by n cells (default: 2)
  --pressure [ms]      Add compression with specified delay (default: 5000)
  --duplicates         Detect duplicate level structures
  --split [dir]        Split levels into world files (default: generated/worlds)
  --all                Apply all enhancements
  --help, -h           Show this help message

${colors.bold}Examples:${colors.reset}
  npm run enhance -- --duplicates           Check for duplicate levels
  npm run enhance -- --fix --decoys 3       Fix issues and add 3 decoys
  npm run enhance -- --expand 2 --pressure  Expand grids and add pressure
  npm run enhance -- --all --split worlds   Apply all and split into files
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options: EnhanceOptions = {
    fixUnsolvable: args.includes('--fix') || args.includes('--all'),
    addDecoys: args.includes('--decoys') || args.includes('--all'),
    decoyCount: 2,
    expandGrid: args.includes('--expand') || args.includes('--all'),
    expandSize: 2,
    addPressure: args.includes('--pressure') || args.includes('--all'),
    pressureDelay: 5000,
    detectDuplicates: args.includes('--duplicates') || args.includes('--all'),
    splitByWorld: args.includes('--split') || args.includes('--all'),
    outputDir: 'generated/worlds',
  };

  // Parse numeric arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--decoys' && args[i + 1]) {
      options.decoyCount = Number.parseInt(args[i + 1], 10) || 2;
    }
    if (args[i] === '--expand' && args[i + 1]) {
      options.expandSize = Number.parseInt(args[i + 1], 10) || 2;
    }
    if (args[i] === '--pressure' && args[i + 1]) {
      options.pressureDelay = Number.parseInt(args[i + 1], 10) || 5000;
    }
    if (args[i] === '--split' && args[i + 1] && !args[i + 1].startsWith('--')) {
      options.outputDir = args[i + 1];
    }
  }

  enhanceLevels(options);
}

main().catch(console.error);
