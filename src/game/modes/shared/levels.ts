// PRESSURE - Shared Level Pool
// One source of truth for Classic, Blitz, and Zen.
// Each mode applies its own ruleset on top of the same puzzles:
//   Classic  → compression active, move limit enforced
//   Blitz    → compression active, no move limit, no undo
//   Zen      → compression disabled (wallCompression: 'never'), no limit

import type { Level } from '../../types';
import { CLASSIC_LEVELS } from '../classic/levels';
import { STREAM_EDITED_LEVEL, RIPPLE_EDITED_LEVEL } from '../zen/levels';
import { generateWorld } from '../../levels/procedural';

function buildSharedLevels(): Level[] {
  const levels: Level[] = [
    // ── Worlds 1–3: 20 hand-authored levels ─────────────────────────────
    ...CLASSIC_LEVELS,

    // ── World 4 extra: hand-crafted showcase levels ───────────────────────
    // These were zen-only before; now shared. compressionDelay is irrelevant
    // for Zen (wallCompression:'never'), and gives Classic/Blitz real pressure.
    { ...STREAM_EDITED_LEVEL,  compressionDelay: 6000, world: 4 },
    { ...RIPPLE_EDITED_LEVEL,  compressionDelay: 6000, world: 4 },
  ];

  // ── World 4: Sideswipe — 6×8, left pressure, intro to directional ────
  levels.push(
    ...generateWorld({
      worldId: 4,
      levelCount: 6,
      startId: 1001,
      gridCols: 6,
      gridRows: 8,
      nodeCount: 2,
      difficulty: 'medium',
      compressionDirection: 'left',
      interiorWalls: 1,
      branches: 2,
      names: ['Sideswipe', 'Leftwall', 'Drift', 'Shoreline', 'Current', 'Eddy'],
    })
  );

  // ── World 5: Descent — 7×10, top pressure ────────────────────────────
  levels.push(
    ...generateWorld({
      worldId: 5,
      levelCount: 6,
      startId: 1007,
      gridCols: 7,
      gridRows: 10,
      nodeCount: 2,
      difficulty: 'medium',
      compressionDirection: 'top',
      interiorWalls: 2,
      branches: 2,
      lockedFraction: 0.2,
      names: ['Descent', 'Ceiling', 'Topfall', 'Lowground', 'Canopy', 'Headspace'],
    })
  );

  // ── World 6: Crossfire — 8×10, left+right squeeze ────────────────────
  levels.push(
    ...generateWorld({
      worldId: 6,
      levelCount: 6,
      startId: 1013,
      gridCols: 8,
      gridRows: 10,
      nodeCount: 3,
      difficulty: 'hard',
      compressionDirection: 'left-right',
      interiorWalls: 2,
      branches: 2,
      lockedFraction: 0.2,
      names: ['Corridor', 'Crossfire', 'Bottleneck', 'Choke', 'Gauntlet', 'Vise'],
    })
  );

  // ── World 7: Squeeze — 9×11, top+bottom pinch ────────────────────────
  levels.push(
    ...generateWorld({
      worldId: 7,
      levelCount: 6,
      startId: 1019,
      gridCols: 9,
      gridRows: 11,
      nodeCount: 3,
      difficulty: 'hard',
      compressionDirection: 'top-bottom',
      interiorWalls: 3,
      branches: 3,
      lockedFraction: 0.25,
      names: ['Pinch', 'Compress', 'Clamp', 'Narrow', 'Flat', 'Crush'],
    })
  );

  // ── World 8: Singularity — 10×12, all-sides, 4 nodes ─────────────────
  levels.push(
    ...generateWorld({
      worldId: 8,
      levelCount: 6,
      startId: 1025,
      gridCols: 10,
      gridRows: 12,
      nodeCount: 4,
      difficulty: 'expert',
      interiorWalls: 3,
      branches: 3,
      lockedFraction: 0.3,
      names: ['Fracture', 'Collapse', 'Cascade', 'Singularity', 'Abyss', 'Zero'],
    })
  );

  return levels;
}

export const PRESSURE_LEVELS: Level[] = buildSharedLevels();
