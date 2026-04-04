// Level Analyzer - Print all levels with solution moves, identify easy/duplicate levels
// Usage: npx tsx apps/web/src/cli/level-analyzer.ts [world] [--json]
// Examples:
//   npx tsx src/cli/level-analyzer.ts              (all levels)
//   npx tsx src/cli/level-analyzer.ts 1            (world 1 only)
//   npx tsx src/cli/level-analyzer.ts 1 --json     (world 1 as JSON)

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyLevel } from '@/game/levels';
import type { Level } from '@/game/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

interface LevelAnalysis {
  id: number;
  world: number;
  name: string;
  gridCols: number;
  gridRows: number;
  gridSize: number;
  goalNodes: number;
  puzzleTiles: number;
  solutionMoves: number;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  solvable: boolean;
}

function analyzeLevels(): void {
  const args = process.argv.slice(2);
  const worldFilter = args[0] ? parseInt(args[0]) : null;
  const outputJson = args.includes('--json');

  // Load all world-pack JSON files
  const worldPacksDir = path.join(__dirname, '../../../../src/game/modes/shared/world-packs');
  const allLevels: Level[] = [];

  if (fs.existsSync(worldPacksDir)) {
    const files = fs.readdirSync(worldPacksDir).filter((f) => f.endsWith('.json'));
    for (const file of files.sort()) {
      const filePath = path.join(worldPacksDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as any;
      const levelsArray = Array.isArray(content) ? content : [content];

      // Ensure grid dimensions are present (old formats might be missing them)
      for (const level of levelsArray) {
        if ((!level.gridCols || !level.gridRows) && level.tiles) {
          // Use gridSize if available, otherwise calculate
          const gridSize = (level as any).gridSize || Math.ceil(Math.sqrt(level.tiles.length));
          (level as any).gridCols = gridSize;
          (level as any).gridRows = gridSize;
        }
      }

      allLevels.push(...levelsArray);
    }
  }

  // Sort by world, then by ID
  allLevels.sort((a, b) => a.world - b.world || a.id - b.id);

  const levels = worldFilter ? allLevels.filter((l) => l.world === worldFilter) : allLevels;

  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.cyan}  LEVEL ANALYZER${colors.reset}`);
  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`
  );

  const analyses: LevelAnalysis[] = [];

  // Analyze each level
  for (const level of levels) {
    const puzzleTiles = level.tiles.filter((t) => !t.isGoalNode).length;
    const verification = verifyLevel(level);
    const solutionMoves = verification.minMoves;

    // Categorize difficulty
    let difficulty: 'trivial' | 'easy' | 'medium' | 'hard' = 'medium';
    if (solutionMoves <= 2) difficulty = 'trivial';
    else if (solutionMoves <= 4) difficulty = 'easy';
    else if (solutionMoves >= 8) difficulty = 'hard';

    const gridSize = (level as any).gridSize || 5;
    const gridCols = (level as any).gridCols || gridSize;
    const gridRows = (level as any).gridRows || gridSize;

    const analysis: LevelAnalysis = {
      id: level.id,
      world: level.world,
      name: level.name,
      gridCols,
      gridRows,
      gridSize: gridCols * gridRows,
      goalNodes: level.goalNodes.length,
      puzzleTiles,
      solutionMoves,
      difficulty,
      solvable: verification.solvable,
    };

    analyses.push(analysis);
  }

  if (outputJson) {
    console.log(JSON.stringify(analyses, null, 2));
    return;
  }

  // Print header
  console.log(
    `${colors.bold}ID${colors.reset}   | ${colors.bold}World${colors.reset} | ${colors.bold}Name${colors.reset}${' '.repeat(25)} | ${colors.bold}Grid${colors.reset} | ${colors.bold}Moves${colors.reset} | ${colors.bold}Difficulty${colors.reset}`
  );
  console.log('-'.repeat(110));

  // Group by world
  const byWorld = new Map<number, LevelAnalysis[]>();
  for (const analysis of analyses) {
    if (!byWorld.has(analysis.world)) {
      byWorld.set(analysis.world, []);
    }
    byWorld.get(analysis.world)!.push(analysis);
  }

  // Print by world
  for (const [world, worldLevels] of Array.from(byWorld.entries()).sort((a, b) => a[0] - b[0])) {
    console.log(`\n${colors.bold}${colors.cyan}WORLD ${world}${colors.reset}`);

    for (const analysis of worldLevels.sort((a, b) => a.id - b.id)) {
      const difficulty = getDifficultyColor(analysis.difficulty);
      const solvable = analysis.solvable ? '✓' : `${colors.red}✗${colors.reset}`;

      const idStr = String(analysis.id).padEnd(5);
      const worldStr = String(analysis.world).padEnd(6);
      const nameStr = analysis.name.padEnd(28);
      const gridStr = `${analysis.gridCols}x${analysis.gridRows}`.padEnd(5);
      const movesStr = String(analysis.solutionMoves).padEnd(6);

      console.log(
        `${idStr} | ${worldStr} | ${nameStr} | ${gridStr} | ${movesStr} | ${difficulty}${analysis.difficulty}${colors.reset} ${solvable}`
      );
    }
  }

  // Summary statistics
  console.log(`\n${colors.bold}SUMMARY${colors.reset}`);
  const trivial = analyses.filter((a) => a.difficulty === 'trivial').length;
  const easy = analyses.filter((a) => a.difficulty === 'easy').length;
  const medium = analyses.filter((a) => a.difficulty === 'medium').length;
  const hard = analyses.filter((a) => a.difficulty === 'hard').length;
  const unsolvable = analyses.filter((a) => !a.solvable).length;

  console.log(`Total levels: ${analyses.length}`);
  console.log(`  Trivial (1-2 moves): ${trivial}`);
  console.log(`  Easy (3-4 moves): ${easy}`);
  console.log(`  Medium (5-7 moves): ${medium}`);
  console.log(`  Hard (8+ moves): ${hard}`);
  if (unsolvable > 0) {
    console.log(`  ${colors.red}Unsolvable: ${unsolvable}${colors.reset}`);
  }

  // Identify potential issues
  console.log(`\n${colors.bold}POTENTIAL ISSUES${colors.reset}`);

  const trivialLevels = analyses.filter((a) => a.difficulty === 'trivial');
  if (trivialLevels.length > 0) {
    console.log(`${colors.yellow}⚠ Very easy levels (1-2 moves):${colors.reset}`);
    for (const l of trivialLevels) {
      console.log(`  - Level ${l.id} (${l.name}): ${l.solutionMoves} move${l.solutionMoves === 1 ? '' : 's'}`);
    }
  }

  const unsolvableLevels = analyses.filter((a) => !a.solvable);
  if (unsolvableLevels.length > 0) {
    console.log(`${colors.red}✗ Unsolvable levels:${colors.reset}`);
    for (const l of unsolvableLevels) {
      console.log(`  - Level ${l.id} (${l.name})`);
    }
  }

  // Group by move count to find similar difficulty
  console.log(`\n${colors.bold}BY MOVE COUNT${colors.reset}`);
  const byMoves = new Map<number, LevelAnalysis[]>();
  for (const analysis of analyses) {
    if (!byMoves.has(analysis.solutionMoves)) {
      byMoves.set(analysis.solutionMoves, []);
    }
    byMoves.get(analysis.solutionMoves)!.push(analysis);
  }

  for (const [moves, levelsWithMoves] of Array.from(byMoves.entries()).sort((a, b) => a[0] - b[0])) {
    if (levelsWithMoves.length > 1) {
      console.log(`${moves} moves: ${levelsWithMoves.map((l) => `${l.id}(W${l.world})`).join(', ')}`);
    }
  }
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'trivial':
      return colors.red;
    case 'easy':
      return colors.yellow;
    case 'medium':
      return colors.green;
    case 'hard':
      return colors.cyan;
    default:
      return colors.reset;
  }
}

analyzeLevels();
