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

/**
 * Check if all goal nodes are reachable from goals[0] via valid bidirectional pipe connections.
 * Delegates to getConnectedTiles to avoid duplicating traversal logic.
 */
export function checkConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true;
  const visited = getConnectedTiles(tiles, goals);
  return goals.every((g) => visited.has(`${g.x},${g.y}`));
}

/**
 * Get all tile positions reachable from goals[0] via valid bidirectional pipe connections.
 * Used for win-glow highlighting. DFS — same semantics as checkConnected but returns visited set.
 */
export function getConnectedTiles(tiles: Tile[], goals: Position[]): Set<string> {
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
