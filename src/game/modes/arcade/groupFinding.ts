/**
 * Group finding algorithms for arcade modes
 * Flood-fill based group detection with optional wildcard support
 */

import type { Tile } from '../../types';
import { isNotEmpty } from '@/utils/conditionalStyles';
import { isWildcard } from '../wildcardAddon';

/**
 * Find a connected group of tiles with the same symbol starting at (x, y).
 * Uses flood-fill algorithm. Minimum group size is 2.
 */
function findGroup(x: number, y: number, tiles: Tile[]): Tile[] {
  const tile = tiles.find((t) => t.x === x && t.y === y);
  if (!tile?.canRotate || !tile.displayData?.symbol) return [];

  const targetSymbol = tile.displayData.symbol;
  const visited = new Set<string>();
  const group: Tile[] = [];

  function flood(tx: number, ty: number) {
    const key = `${tx},${ty}`;
    if (visited.has(key)) return;

    const current = tiles.find((t) => t.x === tx && t.y === ty);
    if (!current?.canRotate) return;
    if (!current.displayData?.symbol) return;
    if (current.displayData.symbol !== targetSymbol) return;

    visited.add(key);
    group.push(current);

    // Check all 4 directions
    flood(tx - 1, ty);
    flood(tx + 1, ty);
    flood(tx, ty - 1);
    flood(tx, ty + 1);
  }

  flood(x, y);
  return group.length >= 2 ? group : [];
}

/**
 * Find a connected group with wildcard support.
 * Wildcards match any symbol.
 */
function findGroupWithWildcards(x: number, y: number, tiles: Tile[]): Tile[] {
  const tile = tiles.find((t) => t.x === x && t.y === y);
  if (!tile?.canRotate) return [];

  const visited = new Set<string>();
  const group: Tile[] = [];

  // Determine the target symbol (use wildcard's adopted symbol if starting on wildcard)
  let targetSymbol: string | null = null;
  if (isWildcard(tile)) {
    // Wildcard adopts the first non-wildcard neighbor's symbol
    const neighbors = tiles.filter(
      (t) =>
        t.canRotate &&
        t.displayData?.symbol &&
        !isWildcard(t) &&
        Math.abs(t.x - x) <= 1 &&
        Math.abs(t.y - y) <= 1 &&
        !(t.x === x && t.y === y)
    );
    if (isNotEmpty(neighbors)) {
      targetSymbol = (neighbors[0].displayData?.symbol as string) || null;
    }
  } else {
    targetSymbol = (tile.displayData?.symbol as string | undefined) ?? null;
  }

  if (!targetSymbol) return [];

  function flood(tx: number, ty: number) {
    const key = `${tx},${ty}`;
    if (visited.has(key)) return;

    const current = tiles.find((t) => t.x === tx && t.y === ty);
    if (!current?.canRotate) return;
    if (!current.displayData?.symbol) return;

    // Check if this tile matches (either same symbol or wildcard)
    const isMatch = current.displayData.symbol === targetSymbol || isWildcard(current);

    if (!isMatch) return;

    visited.add(key);
    group.push(current);

    // Check all 4 directions
    flood(tx - 1, ty);
    flood(tx + 1, ty);
    flood(tx, ty - 1);
    flood(tx, ty + 1);
  }

  flood(x, y);
  return group.length >= 2 ? group : [];
}

/**
 * Find all groups on the board (for cascade detection in Gem Blast).
 */
function findAllGroups(tiles: Tile[], minSize: number): Tile[][] {
  const visited = new Set<string>();
  const groups: Tile[][] = [];

  for (const tile of tiles) {
    const key = `${tile.x},${tile.y}`;
    if (visited.has(key)) continue;
    if (!tile.canRotate || !tile.displayData?.symbol) continue;

    const group = findGroup(tile.x, tile.y, tiles);
    if (group.length >= minSize) {
      groups.push(group);
      for (const t of group) {
        visited.add(`${t.x},${t.y}`);
      }
    }
  }

  return groups;
}

export { findGroup, findGroupWithWildcards, findAllGroups };
