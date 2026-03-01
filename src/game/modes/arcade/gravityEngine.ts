/**
 * Gravity physics engine for arcade modes
 * Tile falling and refilling logic with feature support
 */

import type { Tile } from '../../types';
import { pickRandom } from '@/utils/conditionalStyles';

/**
 * Apply gravity - tiles fall down to fill empty spaces.
 * Returns new tiles array with updated positions.
 */
function applyGravity(
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
      const symbol = pickRandom(activeSymbols);

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

export { applyGravity };
