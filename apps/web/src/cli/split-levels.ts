// Split pressure-levels.json into per-world world-pack files
// Reads monolithic pressure-levels.json and writes world-1.json ... world-N.json
// Usage: npx tsx apps/web/src/cli/split-levels.ts

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

async function main() {
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  LEVEL SPLITTER${colors.reset}`);
  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`
  );

  // Read pressure-levels.json
  const sourcePath = path.join(__dirname, '../../../../src/game/modes/shared/pressure-levels.json');
  console.log(`${colors.yellow}Reading ${sourcePath}...${colors.reset}`);

  const levelsJson = JSON.parse(fs.readFileSync(sourcePath, 'utf-8')) as Level[];
  console.log(`${colors.green}✓ Loaded ${levelsJson.length} levels${colors.reset}\n`);

  // Group levels by world ID
  const worldMap = new Map<number, Level[]>();
  for (const level of levelsJson) {
    if (!worldMap.has(level.world)) {
      worldMap.set(level.world, []);
    }
    worldMap.get(level.world)!.push(level);
  }

  // Output each world to world-packs/
  const outputDir = path.join(__dirname, '../../../../src/game/modes/shared/world-packs');

  // Ensure world-packs directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write each world (sorted by world ID)
  const sortedWorlds = Array.from(worldMap.entries()).sort((a, b) => a[0] - b[0]);
  let totalWritten = 0;

  for (const [worldId, levels] of sortedWorlds) {
    const outputPath = path.join(outputDir, `world-${worldId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(levels, null, 2));
    console.log(`${colors.green}✓ world-${worldId}.json${colors.reset} — ${levels.length} levels`);
    totalWritten += levels.length;
  }

  console.log(
    `\n${colors.bold}COMPLETE${colors.reset}\n${colors.green}✓ Wrote ${totalWritten} levels across ${sortedWorlds.length} world files${colors.reset}`
  );
}

main().catch(console.error);
