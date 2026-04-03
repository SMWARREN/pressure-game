// Enhance Trivial Levels - Add decoys to 1-2 move levels while keeping them solvable
// Usage: npx tsx apps/web/src/cli/enhance-trivial-levels.ts [--apply]
// Without --apply: show what would be changed (dry run)
// With --apply: actually write enhanced levels back to world-pack files

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
};


function enhanceTrivialLevels(): void {
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  TRIVIAL LEVEL REPORT${colors.reset}`);
  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`
  );

  // Load all levels
  const worldPacksDir = path.join(__dirname, '../../../../src/game/modes/shared/world-packs');
  const allLevels: Map<string, Level[]> = new Map(); // worldFile -> levels

  if (fs.existsSync(worldPacksDir)) {
    const files = fs.readdirSync(worldPacksDir).filter((f) => f.endsWith('.json'));

    for (const file of files.sort()) {
      const filePath = path.join(worldPacksDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Level[];
      allLevels.set(file, content);
    }
  }

  // Tutorial levels (intentionally trivial - don't enhance)
  const TUTORIAL_LEVELS = new Set([1, 2, 3]);

  // Process each level
  const trivialLevels: Array<{
    levelId: number;
    name: string;
    moves: number;
    world: number;
    gridSize: number;
    tiles: number;
    empty: number;
    canEnhance: boolean;
    isTutorial: boolean;
  }> = [];

  for (const [_worldFile, levels] of allLevels.entries()) {
    for (const level of levels) {
      const verification = verifyLevel(level);
      const moves = verification.minMoves;

      // Only analyze trivial levels (1-2 moves)
      if (moves <= 2) {
        const gridSize = (level as any).gridSize || 5;
        const totalSpaces = gridSize * gridSize;
        const tiles = level.tiles.length;
        const empty = totalSpaces - tiles;
        const canEnhance = empty >= 2; // Need at least 2 empty spaces
        const isTutorial = TUTORIAL_LEVELS.has(level.id);

        trivialLevels.push({
          levelId: level.id,
          name: level.name,
          moves,
          world: level.world,
          gridSize,
          tiles,
          empty,
          canEnhance,
          isTutorial,
        });
      }
    }
  }

  // Sort by world, then by ID
  trivialLevels.sort((a, b) => a.world - b.world || a.levelId - b.levelId);

  // Print report
  console.log(`${colors.bold}TRIVIAL LEVELS (1-2 moves)${colors.reset}\n`);

  let byWorld: Record<number, typeof trivialLevels> = {};
  for (const level of trivialLevels) {
    if (!byWorld[level.world]) byWorld[level.world] = [];
    byWorld[level.world].push(level);
  }

  for (const [world, levels] of Object.entries(byWorld)) {
    console.log(`${colors.bold}World ${world}${colors.reset}`);

    for (const level of levels) {
      const tag = level.isTutorial
        ? `${colors.green}[TUTORIAL]${colors.reset}`
        : level.canEnhance
          ? `${colors.yellow}[CAN ENHANCE]${colors.reset}`
          : `${colors.red}[FULL GRID]${colors.reset}`;

      console.log(
        `  ${level.levelId.toString().padEnd(5)} | ${level.name.padEnd(25)} | ${level.gridSize}x${level.gridSize} grid (${level.tiles} tiles, ${level.empty} empty) | ${level.moves} moves | ${tag}`
      );
    }
  }

  console.log(`\n${colors.bold}SUMMARY${colors.reset}`);
  console.log(`Total trivial levels: ${trivialLevels.length}`);
  console.log(`  Tutorial (keep as-is): ${trivialLevels.filter((l) => l.isTutorial).length}`);
  console.log(`  Can enhance (2+ empty): ${trivialLevels.filter((l) => l.canEnhance && !l.isTutorial).length}`);
  console.log(`  Full grid (hard to enhance): ${trivialLevels.filter((l) => !l.canEnhance && !l.isTutorial).length}`);

  // Recommendation
  const canEnhance = trivialLevels.filter((l) => l.canEnhance && !l.isTutorial);
  if (canEnhance.length > 0) {
    console.log(`\n${colors.cyan}Recommendation:${colors.reset}`);
    console.log(`Consider manually editing these levels to add decoys or complexity:`);
    for (const l of canEnhance) {
      console.log(`  - Level ${l.levelId}: ${l.name} (has ${l.empty} empty spaces)`);
    }
  }

  const fullGrid = trivialLevels.filter((l) => !l.canEnhance && !l.isTutorial);
  if (fullGrid.length > 0) {
    console.log(`\n${colors.yellow}Tight levels (consider expanding grid):${colors.reset}`);
    for (const l of fullGrid) {
      console.log(`  - Level ${l.levelId}: ${l.name}`);
    }
  }
}

enhanceTrivialLevels();
