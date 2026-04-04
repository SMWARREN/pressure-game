// Rename duplicate level names to make them unique
// Usage: npx tsx apps/web/src/cli/rename-duplicate-levels.ts [--apply]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Level } from '@/game/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

const RENAMES: Record<number, string> = {
  // Diagonal Moderate → Diagonal Moderate (1st), Diagonal Hard (2nd in World 3)
  16: 'Diagonal Hard',
  // Rise (World 1) stays, Rise (World 7) → Ascent
  1028: 'Ascent',
  // Wave (World 4) stays, Surge (World 8, 1035) stays, this becomes Whirlwind
  1034: 'Whirlwind',
  // Current (World 4) stays, Stream (World 8, 1031) stays, this becomes Vortex
  1033: 'Vortex',
};

function renameLevel(level: Level): Level {
  if (RENAMES[level.id]) {
    return {
      ...level,
      name: RENAMES[level.id],
    };
  }
  return level;
}

function main(): void {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');

  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  RENAME DUPLICATE LEVEL NAMES${colors.reset}`);
  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`
  );

  if (!applyChanges) {
    console.log(`${colors.yellow}DRY RUN${colors.reset} - add --apply to write changes\n`);
  }

  const worldPacksDir = path.join(__dirname, '../../../../src/game/modes/shared/world-packs');
  let totalRenamed = 0;

  // Process each world pack
  const files = fs.readdirSync(worldPacksDir).filter((f) => f.endsWith('.json'));

  for (const file of files.sort()) {
    const filePath = path.join(worldPacksDir, file);
    const levels: Level[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let modified = false;

    const renamed = levels.map((level) => {
      if (RENAMES[level.id]) {
        console.log(
          `  ${colors.green}✓${colors.reset} Level ${level.id}: "${level.name}" → "${RENAMES[level.id]}"`
        );
        totalRenamed++;
        modified = true;
        return renameLevel(level);
      }
      return level;
    });

    if (modified && applyChanges) {
      fs.writeFileSync(filePath, JSON.stringify(renamed, null, 2));
    }
  }

  console.log(`\n${colors.bold}SUMMARY${colors.reset}`);
  console.log(`Total renamed: ${totalRenamed}`);
  console.log(`\n${colors.bold}RENAMES${colors.reset}`);
  console.log(`  1033: Current → Stream (World 8)`);
  console.log(`  1034: Wave → Surge (World 8)`);
  console.log(`  1028: Rise → Ascent (World 7)`);
  console.log(`  16:   Diagonal Moderate → Diagonal Hard (World 3)`);

  if (!applyChanges && totalRenamed > 0) {
    console.log(`\n${colors.cyan}Run with --apply to write changes${colors.reset}`);
  }
}

main();
