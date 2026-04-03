// PRESSURE - Pre-generated Procedural Levels
// This file loads pre-generated levels from JSON to avoid runtime generation blocking.
// Run: npm run generate:pressure to regenerate the JSON file

import type { Level } from '../../types';
import { CLASSIC_LEVELS } from '../classic/levels';
import { generateLevel } from '../../levels';
import pressureLevelsJson from './pressure-levels.json';

// Cache for lazy loading
let cachedLevels: Level[] | null = null;

/**
 * Generate 10 World 8 (T-Shaped Challenge) levels with T-shaped pieces
 */
function generateWorld8Levels(): Level[] {
  const world8Levels: Level[] = [];

  const configs = [
    { gridSize: 7, nodeCount: 2, difficulty: 'easy' as const },
    { gridSize: 7, nodeCount: 2, difficulty: 'easy' as const },
    { gridSize: 7, nodeCount: 3, difficulty: 'easy' as const },
    { gridSize: 8, nodeCount: 2, difficulty: 'medium' as const },
    { gridSize: 8, nodeCount: 3, difficulty: 'medium' as const },
    { gridSize: 9, nodeCount: 2, difficulty: 'medium' as const },
    { gridSize: 9, nodeCount: 3, difficulty: 'hard' as const },
    { gridSize: 9, nodeCount: 3, difficulty: 'hard' as const },
    { gridSize: 10, nodeCount: 3, difficulty: 'hard' as const },
    { gridSize: 10, nodeCount: 4, difficulty: 'hard' as const },
  ];

  const names = ['Stream', 'Ripple', 'Current', 'Wave', 'Surge', 'Cascade', 'Torrent', 'Maelstrom', 'Whirlpool', 'Tempest'];

  for (let i = 0; i < configs.length; i++) {
    try {
      const config = configs[i];
      const generated = generateLevel({
        gridSize: config.gridSize,
        nodeCount: config.nodeCount,
        difficulty: config.difficulty,
        decoys: config.difficulty === 'hard' ? 2 : 0,
      });

      world8Levels.push({
        ...generated,
        id: 1001 + i,
        name: names[i],
        world: 8,
        compressionDelay: config.difficulty === 'hard' ? 4000 : config.difficulty === 'medium' ? 6500 : 9000,
      });
    } catch (e) {
      console.warn(`[World 8] Failed to generate level ${i + 1}`);
    }
  }

  return world8Levels;
}

/**
 * Get all pressure levels - combines hand-authored Classic levels with procedural levels and World 8.
 * Levels are loaded from JSON file on first call, then cached.
 */
export function getPressureLevels(): Level[] {
  if (cachedLevels) return cachedLevels;

  // Cast the JSON data to Level[] type
  const procedural = pressureLevelsJson as Level[];

  // Generate World 8 levels (T-Shaped Challenge)
  const world8 = generateWorld8Levels();

  // Combine all levels: Classic hand-authored + World 8 generated + Procedural from JSON
  cachedLevels = [...CLASSIC_LEVELS, ...world8, ...procedural];
  return cachedLevels;
}

// Proxy for backwards compatibility with PRESSURE_LEVELS array access
export const PRESSURE_LEVELS: Level[] = new Proxy([] as Level[], {
  get(_target, prop) {
    const levels = getPressureLevels();
    if (prop === 'length') return levels.length;
    if (prop === Symbol.iterator) return levels[Symbol.iterator].bind(levels);
    if (typeof prop === 'string' && !Number.isNaN(Number(prop))) {
      return levels[Number(prop)];
    }
    if (typeof prop === 'symbol') return levels[prop as keyof Level[]];
    const value = (levels as any)[prop];
    if (typeof value === 'function') return value.bind(levels);
    return value;
  },
  has(_target, prop) {
    const levels = getPressureLevels();
    if (typeof prop === 'string') {
      const index = Number(prop);
      if (!Number.isNaN(index)) return index < levels.length;
    }
    return Reflect.has(levels, prop);
  },
});
