// PRESSURE - Pre-generated Procedural Levels
// This file loads pre-generated levels from JSON to avoid runtime generation blocking.
// Run: npm run generate:pressure to regenerate the JSON file

import type { Level } from '../../types';
import { CLASSIC_LEVELS } from '../classic/levels';
import pressureLevelsJson from './pressure-levels.json';

// Cache for lazy loading
let cachedLevels: Level[] | null = null;

/**
 * Get all pressure levels - combines hand-authored Classic levels with pre-generated procedural levels.
 * Levels are loaded from JSON file on first call, then cached.
 */
export function getPressureLevels(): Level[] {
  if (cachedLevels) return cachedLevels;

  // Cast the JSON data to Level[] type and combine with hand-authored Classic levels
  const procedural = pressureLevelsJson as Level[];
  cachedLevels = [...CLASSIC_LEVELS, ...procedural];
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
