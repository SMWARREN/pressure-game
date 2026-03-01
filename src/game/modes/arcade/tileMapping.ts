/**
 * Tile spatial mapping utilities
 * Functions for O(1) grid position lookups
 */

import type { Tile } from '../../types';

/**
 * Build a spatial map of tiles for O(1) lookup by grid position.
 */
function buildTileMap(tiles: Tile[]): Map<string, Tile> {
  const m = new Map<string, Tile>();
  for (const t of tiles) m.set(`${t.x},${t.y}`, t);
  return m;
}

export { buildTileMap };
