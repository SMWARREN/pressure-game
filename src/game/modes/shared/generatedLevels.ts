// PRESSURE - Pre-generated Levels (Fully Dynamic)
// This file loads all levels from world-pack JSON files.
//
// WORLD PACKS SYSTEM:
// - All levels (Worlds 1-8+) live in src/game/modes/shared/world-packs/world-N.json
// - Files are automatically loaded and merged via Vite glob at build time
// - No code changes needed when adding worlds!
//
// TO ADD A NEW WORLD:
// 1. Create world-N.json in world-packs/ with your levels
// 2. Update each mode's world-metadata.json to add the world definition
// 3. Run: npm run build
// 4. World appears automatically in all modes
//
// TO REGENERATE WORLDS 1-7:
// - Edit pressure-levels.json (source file)
// - Run: npm run split:levels
// - This splits pressure-levels.json into world-1.json ... world-7.json

import type { Level } from '../../types';

// Cache for lazy loading
let cachedLevels: Level[] | null = null;

/**
 * Get all pressure levels from world-packs.
 * Levels are auto-discovered from world-packs/*.json via Vite glob at build time.
 * Levels are loaded on first call, then cached.
 *
 * To add a new world: drop world-N.json in world-packs/ and rebuild.
 */
export function getPressureLevels(): Level[] {
  if (cachedLevels) return cachedLevels;

  // Auto-discover and load all world-packs/*.json
  const worldPackModules = import.meta.glob<any>('./world-packs/*.json', { eager: true });
  const allLevels: Level[] = [];

  for (const [_path, module] of Object.entries(worldPackModules)) {
    const levels = (module.default as any as Level[]) || [];
    allLevels.push(...levels);
  }

  // Sort by world ID, then by level ID to ensure consistent ordering
  cachedLevels = allLevels.sort((a, b) => a.world - b.world || a.id - b.id);
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
