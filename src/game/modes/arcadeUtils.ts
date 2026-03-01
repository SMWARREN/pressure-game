/**
 * PRESSURE - Arcade Mode Utilities
 * Shared functions for arcade modes: Candy, Gem Blast, Shopping Spree
 * Reduces duplication of shuffle, deadlock, and gravity utilities.
 */

import type { Tile } from '../types';
import { findGroup, buildTileMap } from './arcadeShared';

// ── Reshuffle (Fisher-Yates) ──────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle of symbols while keeping tile positions.
 * Optionally marks refilled tiles as new for animation.
 */
export interface ReshuffleOptions {
  readonly markNew?: boolean; // Mark shuffled tiles as isNew (default: false)
  readonly filterFn?: (tile: Tile) => boolean; // Custom filter (default: canRotate)
}

export function reshuffleTiles(tiles: Tile[], options?: ReshuffleOptions): Tile[] {
  const { markNew = false, filterFn = (t: Tile) => t.canRotate } = options ?? {};

  const activeTiles = tiles.filter(filterFn);
  const symbols = activeTiles.map((t) => t.displayData?.symbol as string);

  // Fisher-Yates shuffle
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }

  let idx = 0;
  return tiles.map((t) => {
    if (!filterFn(t)) return t;

    return {
      ...t,
      displayData: {
        ...t.displayData,
        symbol: symbols[idx++],
        ...(markNew && { isNew: true }),
      },
    };
  });
}

// ── Deadlock Detection ────────────────────────────────────────────────────────

/**
 * Check if there are any valid moves using simple neighbor matching.
 * Looks for 2+ adjacent tiles with same symbol (horizontal/vertical only).
 */
export function hasAdjacentMatch(tiles: Tile[]): boolean {
  const map = buildTileMap(tiles);
  for (const t of tiles) {
    if (!t.canRotate) continue;
    const sym = t.displayData?.symbol;
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
    ] as [number, number][]) {
      const nb = map.get(`${t.x + dx},${t.y + dy}`);
      if (nb?.canRotate && nb.displayData?.symbol === sym) return true;
    }
  }
  return false;
}

/**
 * Check if there are any valid moves using group detection.
 * Uses findGroup to locate 2+ connected tiles with same symbol.
 */
export function hasValidGroup(tiles: Tile[]): boolean {
  return tiles.some((t) => {
    if (!t.canRotate || !t.displayData?.symbol) return false;
    const group = findGroup(t.x, t.y, tiles);
    return group.length >= 2;
  });
}
