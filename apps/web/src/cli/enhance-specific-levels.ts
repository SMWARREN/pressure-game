// Enhance specific levels (14, 15, 16) by adding strategic decoy tiles
// Usage: npx tsx apps/web/src/cli/enhance-specific-levels.ts [--apply]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyLevel } from '@/game/levels';
import type { Level, Tile } from '@/game/types';

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

// Connection patterns for decoy tiles (random valid pipe configurations)
const CONNECTION_PATTERNS: ('up' | 'down' | 'left' | 'right')[][] = [
  ['up', 'down'],
  ['left', 'right'],
  ['up', 'right'],
  ['up', 'left'],
  ['down', 'right'],
  ['down', 'left'],
  ['up', 'right', 'down'],
  ['up', 'right', 'left'],
  ['down', 'right', 'left'],
  ['up', 'down', 'left'],
];

function findEmptyPositions(level: Level): Array<{ x: number; y: number }> {
  const occupied = new Set<string>();

  for (const tile of level.tiles) {
    occupied.add(`${tile.x},${tile.y}`);
  }

  const gridSize = (level as any).gridSize || 6;
  const empty: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!occupied.has(`${x},${y}`)) {
        empty.push({ x, y });
      }
    }
  }

  return empty;
}

function addDecoyTiles(level: Level, count: number): Level {
  const empty = findEmptyPositions(level);
  if (empty.length < count) {
    console.warn(`  ⚠ Only ${empty.length} empty spaces, requested ${count}`);
    count = empty.length;
  }

  // Pick random empty positions (spread them out)
  const selected: Array<{ x: number; y: number }> = [];
  const remaining = [...empty];

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[idx]);
    remaining.splice(idx, 1);
  }

  // Add decoy tiles
  const newTiles: Tile[] = [...level.tiles];
  for (let i = 0; i < selected.length; i++) {
    const pos = selected[i];
    const connections = CONNECTION_PATTERNS[Math.floor(Math.random() * CONNECTION_PATTERNS.length)];
    const decoy: Tile = {
      id: `decoy-${pos.x}-${pos.y}-${i}`,
      x: pos.x,
      y: pos.y,
      type: 'path',
      connections: [...connections],
      isGoalNode: false,
      canRotate: true,
    };
    newTiles.push(decoy);
  }

  return {
    ...level,
    tiles: newTiles,
  };
}

function enhanceLevel(level: Level, levelNum: number, targetDecoys: number): Level | null {
  console.log(`  Enhancing Level ${levelNum} (${level.name})...`);

  const originalVerif = verifyLevel(level);
  console.log(`    Original: ${originalVerif.minMoves} moves, solvable: ${originalVerif.solvable}`);

  let enhanced = level;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const candidate = addDecoyTiles(enhanced, targetDecoys);
    const candidateVerif = verifyLevel(candidate);

    if (candidateVerif.solvable) {
      const decoysAdded = candidate.tiles.length - level.tiles.length;
      console.log(
        `    ✓ Enhanced: ${candidateVerif.minMoves} moves, ${decoysAdded} decoys added, solvable`
      );
      return candidate;
    }

    attempts++;
  }

  console.log(`    ✗ Failed to enhance after ${maxAttempts} attempts`);
  return null;
}

function main(): void {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');

  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ENHANCE LEVELS 14-16${colors.reset}`);
  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`
  );

  if (!applyChanges) {
    console.log(`${colors.yellow}DRY RUN${colors.reset} - add --apply to write changes\n`);
  }

  // Load world-3.json
  const worldPacksDir = path.join(__dirname, '../../../../src/game/modes/shared/world-packs');
  const world3Path = path.join(worldPacksDir, 'world-3.json');

  if (!fs.existsSync(world3Path)) {
    console.error(`${colors.red}✗ world-3.json not found${colors.reset}`);
    process.exit(1);
  }

  const levels: Level[] = JSON.parse(fs.readFileSync(world3Path, 'utf-8'));
  const targetLevelIds = [14, 15, 16];
  let modified = false;

  for (const targetId of targetLevelIds) {
    const idx = levels.findIndex((l) => l.id === targetId);
    if (idx === -1) {
      console.log(`${colors.yellow}⚠ Level ${targetId} not found${colors.reset}`);
      continue;
    }

    const level = levels[idx];
    const enhanced = enhanceLevel(level, targetId, 2); // Add 2 decoys

    if (enhanced && applyChanges) {
      levels[idx] = enhanced;
      modified = true;
    }
  }

  // Write back if changes were made
  if (modified) {
    fs.writeFileSync(world3Path, JSON.stringify(levels, null, 2));
    console.log(`\n${colors.green}✓ Wrote enhanced levels to world-3.json${colors.reset}`);
  } else if (!applyChanges) {
    console.log(`\n${colors.cyan}Run with --apply to write changes${colors.reset}`);
  }
}

main();
