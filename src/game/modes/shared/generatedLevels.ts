// PRESSURE - Pre-generated Procedural Levels
// This file loads pre-generated levels from JSON to avoid runtime generation blocking.
//
// WORLD PACKS SYSTEM:
// - Place generated levels in src/game/modes/shared/world-packs/world-N.json
// - They will be automatically loaded and merged with main levels
// - Run: npm run generate:pressure to generate new levels
//
// TO ADD A NEW WORLD:
// 1. Run: npm run generate:pressure
// 2. File creates src/game/modes/shared/world-packs/world-8.json (or world-9, etc.)
// 3. The level loader auto-merges it - no code changes needed!
//
// MAIN LEVELS:
// - Worlds 1-7: src/game/modes/shared/pressure-levels.json (hand-authored)
// - World 8+: src/game/modes/shared/world-packs/*.json (auto-generated)

import type { Level } from '../../types';
import pressureLevelsJson from './pressure-levels.json';

// Cache for lazy loading
let cachedLevels: Level[] | null = null;

/**
 * Get all pressure levels - combines main levels with auto-discovered world-packs.
 * World-packs are auto-loaded from world-packs/*.json via Vite glob.
 * Levels are loaded from JSON files on first call, then cached.
 *
 * To add a new world: drop world-N.json in world-packs/ and rebuild.
 */
export function getPressureLevels(): Level[] {
  if (cachedLevels) return cachedLevels;

  // Main levels (Worlds 1-7)
  const mainLevels = pressureLevelsJson as any as Level[];

  // Auto-discover and load world-packs/*.json
  const worldPackModules = import.meta.glob<any>('./world-packs/*.json', { eager: true });
  const worldPackLevels: Level[] = [];

  for (const [_path, module] of Object.entries(worldPackModules)) {
    const levels = (module.default as any as Level[]) || [];
    worldPackLevels.push(...levels);
  }

  // Merge all levels
  cachedLevels = [...mainLevels, ...worldPackLevels];
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
