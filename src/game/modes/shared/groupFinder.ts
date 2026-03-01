/**
 * Shared Group Finder Utility
 *
 * Consolidated DFS-based group finding for arcade modes (Candy, Voltage, GemBlast, ShoppingSpree).
 * Finds all connected tiles matching a condition starting from a given position.
 */

import { Tile } from '../../types';
import { buildTileMap } from '../arcadeShared';

/**
 * Find the full connected group of tiles matching a condition, starting at (x, y).
 * Uses depth-first search with a tile map for O(1) lookups.
 *
 * @param x - Starting x coordinate
 * @param y - Starting y coordinate
 * @param tiles - All tiles in the grid
 * @param matchFn - Function to determine if a tile matches the group criteria
 * @returns Array of tiles in the connected group (empty if start tile doesn't match)
 */
export function findGroup(
  x: number,
  y: number,
  tiles: Tile[],
  matchFn: (tile: Tile) => boolean
): Tile[] {
  const map = buildTileMap(tiles);
  const start = map.get(`${x},${y}`);

  // Start tile must be rotatable (interactive) and match the criteria
  if (!start?.canRotate || !matchFn(start)) {
    return [];
  }

  const visited = new Set<string>();
  const stack: Tile[] = [start];
  const group: Tile[] = [];

  while (stack.length > 0) {
    const cur = stack.pop()!;
    const key = `${cur.x},${cur.y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    group.push(cur);

    // Check 4 adjacent cells (up, down, left, right)
    for (const [dx, dy] of [
      [0, -1], // up
      [0, 1],  // down
      [-1, 0], // left
      [1, 0],  // right
    ] as [number, number][]) {
      const neighbor = map.get(`${cur.x + dx},${cur.y + dy}`);

      if (
        neighbor?.canRotate &&
        !visited.has(`${neighbor.x},${neighbor.y}`) &&
        matchFn(neighbor)
      ) {
        stack.push(neighbor);
      }
    }
  }

  return group;
}
