// PRESSURE - Arcade Shared Utilities
// Shared functions for arcade modes (Candy, Shopping Spree, Gem Blast)

import type { Tile } from '../types';
import { isWildcard } from './wildcardAddon';

// ── Group Finding ────────────────────────────────────────────────────────────

/**
 * Find a connected group of tiles with the same symbol starting at (x, y).
 * Uses flood-fill algorithm. Minimum group size is 2.
 */
export function findGroup(x: number, y: number, tiles: Tile[]): Tile[] {
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
export function findGroupWithWildcards(x: number, y: number, tiles: Tile[]): Tile[] {
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
    if (neighbors.length > 0) {
      targetSymbol = neighbors[0].displayData!.symbol;
    }
  } else {
    targetSymbol = tile.displayData?.symbol ?? null;
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
export function findAllGroups(tiles: Tile[], minSize: number): Tile[][] {
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

// ── Gravity ──────────────────────────────────────────────────────────────────

/**
 * Apply gravity - tiles fall down to fill empty spaces.
 * Returns new tiles array with updated positions.
 */
export function applyGravity(
  tiles: Tile[],
  gridSize: number,
  activeSymbols: string[],
  features?: { wildcards?: boolean; bombs?: boolean }
): Tile[] {
  const newTiles: Tile[] = [];

  // Process each column
  for (let col = 0; col < gridSize; col++) {
    const columnTiles = tiles.filter((t) => t.x === col).sort((a, b) => b.y - a.y); // Sort bottom to top

    // Keep non-empty tiles
    const filledPositions: { y: number; tile: Tile }[] = [];
    let emptyCount = 0;

    for (let row = gridSize - 1; row >= 0; row--) {
      const existingTile = columnTiles.find((t) => t.y === row);
      if (existingTile) {
        filledPositions.push({ y: row, tile: existingTile });
      } else {
        emptyCount++;
      }
    }

    // Add existing tiles at their positions
    for (const { tile } of filledPositions) {
      newTiles.push(tile);
    }

    // Fill empty spots at top with new tiles
    for (let i = 0; i < emptyCount; i++) {
      const y = emptyCount - 1 - i;
      const symbol = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];

      // Check for wildcard spawn (5% chance)
      let newTile: Tile = {
        id: `new-${col}-${y}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'path',
        x: col,
        y,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        justRotated: true,
        displayData: { symbol, activeSymbols, isNew: true },
      };

      // Wildcard spawn
      if (features?.wildcards && Math.random() < 0.05) {
        newTile = {
          ...newTile,
          displayData: { symbol: '⭐', activeSymbols, isNew: true, isWildcard: true },
        };
      }

      // Bomb spawn (3% chance)
      if (features?.bombs && Math.random() < 0.03) {
        newTile = {
          ...newTile,
          displayData: { symbol: '💣', activeSymbols, isNew: true, isBomb: true },
        };
      }

      newTiles.push(newTile);
    }
  }

  return newTiles;
}
