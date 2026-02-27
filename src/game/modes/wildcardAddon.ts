// PRESSURE - Wildcard Addon
// Wildcard tiles that match any symbol for group matching

import type { Tile } from '../types';
import type { TileColors } from './types';

export const WILDCARD_SYMBOL = '⭐';

export function isWildcard(tile: Tile): boolean {
  return (
    tile.displayData?.symbol === WILDCARD_SYMBOL ||
    tile.displayData?.isWildcard === true
  );
}

export function makeWildcardTile(x: number, y: number, activeSymbols: string[]): Tile {
  return {
    id: `wc-${x}-${y}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'path',
    x,
    y,
    connections: [],
    canRotate: true,
    isGoalNode: false,
    justRotated: true,
    displayData: { symbol: WILDCARD_SYMBOL, activeSymbols, isNew: true, isWildcard: true },
  };
}

export function getWildcardColors(_tile: Tile): TileColors {
  return {
    background: 'linear-gradient(145deg, #2d2800 0%, #1a1500 100%)',
    border: '2px solid #fbbf24',
    boxShadow: '0 0 18px rgba(251,191,36,0.8), 0 0 6px rgba(251,191,36,0.5)',
  };
}