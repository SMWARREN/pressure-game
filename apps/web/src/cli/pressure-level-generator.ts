// PRESSURE - Level Pre-Generator CLI
// Pre-generates procedural levels to JSON to avoid runtime generation blocking.
// Run with: npm run generate:pressure

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateWorld, type WorldConfig } from '../game/levels/procedural';
import { CLASSIC_LEVELS } from '../game/modes/classic/levels';
import { STREAM_EDITED_LEVEL, RIPPLE_EDITED_LEVEL } from '../game/modes/zen/levels';

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
  console.log(`${colors.bold}${colors.cyan}  PRESSURE LEVEL GENERATOR${colors.reset}`);
  console.log(
    `${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`
  );

  const levels: any[] = [];

  // World 1-3: Hand-authored classic levels
  console.log(`${colors.yellow}Loading classic levels...${colors.reset}`);
  levels.push(...CLASSIC_LEVELS);
  console.log(`  ${colors.green}✓ ${CLASSIC_LEVELS.length} classic levels${colors.reset}`);

  // World 4 extra: hand-crafted showcase levels
  levels.push(
    { ...STREAM_EDITED_LEVEL, compressionDelay: 6000, world: 4 },
    { ...RIPPLE_EDITED_LEVEL, compressionDelay: 6000, world: 4 }
  );

  // World configs for procedural generation
  // Tuned parameters for better solvability across all modes
  const worldConfigs: WorldConfig[] = [
    {
      worldId: 4,
      levelCount: 8,
      startId: 1001,
      gridCols: 6,
      gridRows: 8,
      nodeCount: 2,
      difficulty: 'easy',
      compressionDirection: 'left',
      interiorWalls: 0,
      branches: 1,
      names: ['Sideswipe', 'Drift', 'Current', 'Ripple', 'Wave', 'Flow', 'Breeze', 'Echo'],
    },
    {
      worldId: 5,
      levelCount: 8,
      startId: 1009,
      gridCols: 7,
      gridRows: 10,
      nodeCount: 2,
      difficulty: 'medium',
      compressionDirection: 'top',
      interiorWalls: 1,
      branches: 2,
      names: ['Descent', 'Topfall', 'Canopy', 'Peak', 'Valley', 'Summit', 'Base', 'Depth'],
    },
    {
      worldId: 6,
      levelCount: 8,
      startId: 1017,
      gridCols: 8,
      gridRows: 10,
      nodeCount: 2,
      difficulty: 'medium',
      compressionDirection: 'left-right',
      interiorWalls: 1,
      branches: 2,
      names: [
        'Corridor',
        'Bottleneck',
        'Gauntlet',
        'Pinch',
        'Squeeze',
        'Bind',
        'Compress',
        'Compact',
      ],
    },
    {
      worldId: 7,
      levelCount: 6,
      startId: 1025,
      gridCols: 6,
      gridRows: 9,
      nodeCount: 2,
      difficulty: 'easy',
      compressionDirection: 'bottom',
      interiorWalls: 0,
      branches: 1,
      names: ['Zenith', 'Ascend', 'Soar', 'Rise', 'Elevate', 'Skyward'],
    },
  ];

  // Generate each world
  for (const config of worldConfigs) {
    console.log(
      `${colors.yellow}Generating World ${config.worldId} (${config.names?.[0] ?? 'Procedural'})...${colors.reset}`
    );
    const worldLevels = generateWorld(config);
    levels.push(...worldLevels);
    console.log(`  ${colors.green}✓ ${worldLevels.length} levels generated${colors.reset}`);
  }

  // Remove isGenerated flag since these are now standard pre-generated levels
  const cleanedLevels = levels.map((level) => {
    const { isGenerated, ...rest } = level;
    return rest;
  });

  // Write to JSON file
  const outputPath = path.join(__dirname, '../game/modes/shared/pressure-levels.json');
  fs.writeFileSync(outputPath, JSON.stringify(cleanedLevels, null, 2));
  console.log(`\n${colors.green}✓ Written ${levels.length} levels to ${outputPath}${colors.reset}`);

  // Summary
  console.log(`\n${colors.bold}SUMMARY${colors.reset}`);
  console.log(`Total levels: ${levels.length}`);
  const byWorld: Record<number, number> = {};
  for (const l of levels) {
    byWorld[l.world] = (byWorld[l.world] ?? 0) + 1;
  }
  for (const [world, count] of Object.entries(byWorld)) {
    console.log(`  World ${world}: ${count} levels`);
  }
}

main().catch(console.error);
