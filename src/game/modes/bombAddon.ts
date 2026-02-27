// PRESSURE - Bomb Addon
// Bomb tiles that explode and clear surrounding tiles

import type { Tile } from '../types';
import type { TileColors } from './types';

export const BOMB_SYMBOL = '💣';

export function isBomb(tile: Tile): boolean {
  return (
    tile.displayData?.symbol === BOMB_SYMBOL ||
    tile.displayData?.isBomb === true
  );
}

export function makeBombTile(x: number, y: number, activeSymbols: string[]): Tile {
  return {
    id: `bomb-${x}-${y}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'path',
    x,
    y,
    connections: [],
    canRotate: true,
    isGoalNode: false,
    justRotated: true,
    displayData: { symbol: BOMB_SYMBOL, activeSymbols, isNew: true, isBomb: true },
  };
}

export function applyBombExplosion(
  group: Tile[],
  _allTiles: Tile[],
  _gridSize: number
): { extraClearedKeys: Set<string>; bonusScore: number } {
  const bombsInGroup = group.filter(isBomb);
  if (bombsInGroup.length === 0) {
    return { extraClearedKeys: new Set(), bonusScore: 0 };
  }

  const extraClearedKeys = new Set<string>();
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  for (const bomb of bombsInGroup) {
    for (const [dx, dy] of directions) {
      const nx = bomb.x + dx;
      const ny = bomb.y + dy;
      if (nx >= 0 && nx < _gridSize && ny >= 0 && ny < _gridSize) {
        extraClearedKeys.add(`${nx},${ny}`);
      }
    }
  }

  return {
    extraClearedKeys,
    bonusScore: bombsInGroup.length * 100,
  };
}

export function getBombColors(_tile: Tile): TileColors {
  return {
    background: 'linear-gradient(145deg, #3d0a0a 0%, #1a0505 100%)',
    border: '2px solid #ef4444',
    boxShadow: '0 0 18px rgba(239,68,68,0.8), 0 0 6px rgba(239,68,68,0.5)',
  };
}