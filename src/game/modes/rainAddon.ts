// PRESSURE - Rain Addon
// Periodic symbol scramble - randomly changes tiles

import type { Tile } from '../types';

export function tickRain(
  tiles: Tile[],
  elapsedSeconds: number,
  lastRainAt: number,
  activeSymbols: string[],
  _gridSize: number
): { tiles: Tile[]; lastRainAt: number } | null {
  // Rain every 10 seconds
  if (elapsedSeconds - lastRainAt < 10) {
    return null;
  }

  // Find all tiles that can be changed
  const changeableTiles = tiles.filter((t) => t.canRotate && t.displayData?.symbol);
  if (changeableTiles.length === 0) {
    return null;
  }

  // Randomly select 2-3 tiles to change
  const numToChange = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...changeableTiles].sort(() => Math.random() - 0.5);
  const toChange = shuffled.slice(0, Math.min(numToChange, shuffled.length));

  // Create new tiles with changed symbols
  const newTiles = tiles.map((tile) => {
    const shouldChange = toChange.some((t) => t.x === tile.x && t.y === tile.y);
    if (shouldChange && tile.displayData?.symbol) {
      const currentSymbol = tile.displayData.symbol;
      const otherSymbols = activeSymbols.filter((s) => s !== currentSymbol);
      const newSymbol = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
      return {
        ...tile,
        displayData: {
          ...tile.displayData,
          symbol: newSymbol,
          isNew: true,
        },
      };
    }
    return tile;
  });

  return {
    tiles: newTiles,
    lastRainAt: elapsedSeconds,
  };
}
