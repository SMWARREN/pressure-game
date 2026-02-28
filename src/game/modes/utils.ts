// PRESSURE - Shared Mode Utilities
// Common logic reused across different game modes

import { Tile, Position, Direction } from '../types';

const DIRS: Direction[] = ['up', 'right', 'down', 'left'];
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/**
 * Create a Map from tiles array for O(1) lookups
 */
export function createTileMap(tiles: Tile[]): Map<string, Tile> {
  const map = new Map<string, Tile>();
  for (const tile of tiles) {
    map.set(`${tile.x},${tile.y}`, tile);
  }
  return map;
}

/**
 * Rotate connections array 90 degrees clockwise, `times` steps
 */
export function rotateConnections(conns: Direction[], times: number): Direction[] {
  return conns.map((c) => DIRS[(DIRS.indexOf(c) + times) % 4]);
}

// ═══════════════════════════════════════════════════════════════════════════
// UNION-FIND (Disjoint Set Union) - O(α(n)) connectivity checks
// α is the inverse Ackermann function, effectively O(1) for practical inputs
// ═══════════════════════════════════════════════════════════════════════════

class UnionFind {
  private readonly parent: Map<string, string> = new Map();
  private readonly rank: Map<string, number> = new Map();

  makeSet(key: string): void {
    if (!this.parent.has(key)) {
      this.parent.set(key, key);
      this.rank.set(key, 0);
    }
  }

  find(key: string): string {
    const parent = this.parent.get(key);
    if (!parent) return key;

    // Path compression
    if (parent !== key) {
      this.parent.set(key, this.find(parent));
    }
    return this.parent.get(key) || key;
  }

  union(key1: string, key2: string): void {
    const root1 = this.find(key1);
    const root2 = this.find(key2);

    if (root1 === root2) return;

    // Union by rank
    const rank1 = this.rank.get(root1) || 0;
    const rank2 = this.rank.get(root2) || 0;

    if (rank1 < rank2) {
      this.parent.set(root1, root2);
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
    } else {
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
    }
  }

  connected(key1: string, key2: string): boolean {
    return this.find(key1) === this.find(key2);
  }
}

/**
 * FAST: Check if all goal nodes are connected using Union-Find.
 * Time complexity: O(n * α(n)) ≈ O(n) where n is number of tiles.
 * Much faster than DFS for repeated connectivity checks.
 */
export function checkConnectedFast(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true;

  const tileMap = createTileMap(tiles);
  const uf = new UnionFind();

  // Initialize all tiles in union-find
  for (const tile of tiles) {
    const key = `${tile.x},${tile.y}`;
    uf.makeSet(key);
  }

  // Union connected tiles
  for (const tile of tiles) {
    if (tile.type === 'wall' || tile.type === 'crushed') continue;

    const key = `${tile.x},${tile.y}`;

    for (const d of tile.connections) {
      const nx = tile.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0);
      const ny = tile.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0);
      const nkey = `${nx},${ny}`;

      const neighbor = tileMap.get(nkey);
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue;
      if (neighbor.connections.includes(OPP[d])) {
        uf.union(key, nkey);
      }
    }
  }

  // Check if all goals are in the same set
  const firstGoalKey = `${goals[0].x},${goals[0].y}`;
  for (let i = 1; i < goals.length; i++) {
    const goalKey = `${goals[i].x},${goals[i].y}`;
    if (!uf.connected(firstGoalKey, goalKey)) {
      return false;
    }
  }

  return true;
}

/**
 * FAST: Get connected tiles using Union-Find + single traversal from first goal.
 * Returns all tiles in the same connected component as goals[0].
 */
export function getConnectedTilesFast(tiles: Tile[], goals: Position[]): Set<string> {
  if (goals.length < 2) return new Set();

  const tileMap = createTileMap(tiles);
  const visited = new Set<string>();

  // BFS from first goal - only traverse connected tiles
  const queue: string[] = [`${goals[0].x},${goals[0].y}`];

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (visited.has(key)) continue;
    visited.add(key);

    const tile = tileMap.get(key);
    if (!tile || tile.type === 'wall' || tile.type === 'crushed') continue;

    for (const d of tile.connections) {
      const nx = tile.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0);
      const ny = tile.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0);
      const nkey = `${nx},${ny}`;

      if (visited.has(nkey)) continue;

      const neighbor = tileMap.get(nkey);
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue;
      if (neighbor.connections.includes(OPP[d])) {
        queue.push(nkey);
      }
    }
  }

  return visited;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORIGINAL DFS METHODS (kept for compatibility and highlighting)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if all goal nodes are reachable from goals[0] via valid bidirectional pipe connections.
 * Uses the fast Union-Find implementation for better performance.
 */
export function checkConnected(tiles: Tile[], goals: Position[]): boolean {
  return checkConnectedFast(tiles, goals);
}

/**
 * Get all tile positions reachable from goals[0] via valid bidirectional pipe connections.
 * Used for win-glow highlighting. Uses BFS for better cache locality.
 */
export function getConnectedTiles(tiles: Tile[], goals: Position[]): Set<string> {
  return getConnectedTilesFast(tiles, goals);
}

/**
 * ORIGINAL DFS implementation - kept for reference and fallback
 * Get all tile positions reachable from goals[0] via valid bidirectional pipe connections.
 */
export function getConnectedTilesDFS(tiles: Tile[], goals: Position[]): Set<string> {
  if (goals.length < 2) return new Set();

  const tileMap = createTileMap(tiles);
  const visited = new Set<string>();
  const stack = [`${goals[0].x},${goals[0].y}`];

  while (stack.length > 0) {
    const key = stack.pop()!;
    if (visited.has(key)) continue;
    visited.add(key);

    const tile = tileMap.get(key);
    if (!tile || tile.type === 'wall' || tile.type === 'crushed') continue;

    for (const d of tile.connections) {
      const nx = tile.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0);
      const ny = tile.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0);
      const nkey = `${nx},${ny}`;
      if (visited.has(nkey)) continue;

      const neighbor = tileMap.get(nkey);
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue;
      if (neighbor.connections.includes(OPP[d])) stack.push(nkey);
    }
  }

  return visited;
}

/**
 * Standard tile rotation tap handler - used by pipe-based modes
 */
export function rotateTileTap(x: number, y: number, tiles: Tile[]) {
  const tile = tiles.find((t) => t.x === x && t.y === y);
  if (!tile?.canRotate) return null;

  const newTiles = tiles.map((t) => {
    if (t.x === x && t.y === y) {
      return { ...t, connections: rotateConnections(t.connections, 1), justRotated: true };
    }
    return { ...t, justRotated: false };
  });

  return newTiles;
}
