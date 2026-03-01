// PRESSURE - Compression System
// Handles wall compression mechanics for the game engine.

import type { Tile, Level, Position, CompressionDirection } from '../types';
import type { WallAdvanceResult, EngineContext } from './types';
import { getModeById } from '../modes';

/**
 * Check if a position should be crushed based on compression direction.
 * Uses separate col/row dimensions to support non-square grids correctly.
 */
function shouldCrushAtPosition(
  x: number,
  y: number,
  gridCols: number,
  gridRows: number,
  wallOffset: number,
  direction: CompressionDirection
): boolean {
  if (direction === 'none') return false;

  // Calculate distance from each edge using correct axis dimensions
  const distFromTop = y;
  const distFromBottom = gridRows - 1 - y;
  const distFromLeft = x;
  const distFromRight = gridCols - 1 - x;

  // Direction predicates: check if tile is within crush zone based on direction
  const directionalChecks: Record<CompressionDirection, boolean> = {
    'none': false,
    'all': Math.min(distFromTop, distFromBottom, distFromLeft, distFromRight) < wallOffset,
    'top': distFromTop < wallOffset,
    'bottom': distFromBottom < wallOffset,
    'left': distFromLeft < wallOffset,
    'right': distFromRight < wallOffset,
    'top-bottom': distFromTop < wallOffset || distFromBottom < wallOffset,
    'left-right': distFromLeft < wallOffset || distFromRight < wallOffset,
    'top-left': distFromTop < wallOffset || distFromLeft < wallOffset,
    'top-right': distFromTop < wallOffset || distFromRight < wallOffset,
    'bottom-left': distFromBottom < wallOffset || distFromLeft < wallOffset,
    'bottom-right': distFromBottom < wallOffset || distFromRight < wallOffset,
    'top-left-right': distFromTop < wallOffset || distFromLeft < wallOffset || distFromRight < wallOffset,
    'bottom-left-right': distFromBottom < wallOffset || distFromLeft < wallOffset || distFromRight < wallOffset,
    'left-top-bottom': distFromLeft < wallOffset || distFromTop < wallOffset || distFromBottom < wallOffset,
    'right-top-bottom': distFromRight < wallOffset || distFromTop < wallOffset || distFromBottom < wallOffset,
  };

  return directionalChecks[direction];
}

/**
 * Compression system that handles wall advancement and crushing mechanics.
 */
export class CompressionSystem {
  /**
   * Resolve whether compression is enabled for the current context.
   * Priority: level.compressionEnabled → mode.wallCompression → compressionOverride
   */
  resolveEnabled(level: Level | null, modeId: string, override: boolean | null): boolean {
    if (level?.compressionEnabled !== undefined) return level.compressionEnabled;

    const mode = getModeById(modeId);
    if (mode.wallCompression === 'always') return true;
    if (mode.wallCompression === 'never') return false;

    return override ?? true;
  }

  /**
   * Advance walls by one step, crushing tiles that are now inside the wall boundary.
   */
  advance(tiles: Tile[], wallOffset: number, level: Level, ctx: EngineContext): WallAdvanceResult {
    const gridCols = level.gridCols ?? level.gridSize;
    const gridRows = level.gridRows ?? level.gridSize;
    // maxOffset is the smaller of the two half-dimensions so walls don't overshoot
    const maxOffset = Math.floor(Math.min(gridCols, gridRows) / 2);
    const newOffset = wallOffset + 1;
    const direction: CompressionDirection = level.compressionDirection ?? 'all';

    // Can't advance beyond the maximum
    if (newOffset > maxOffset) {
      return { tiles, newOffset: wallOffset, gameOver: false, lossReason: null };
    }

    // Crush tiles that are now inside the wall boundary based on compression direction
    const newTiles = tiles.map((tile) => {
      // Use direction-aware crush check with correct per-axis dimensions
      const shouldCrush = shouldCrushAtPosition(
        tile.x,
        tile.y,
        gridCols,
        gridRows,
        newOffset,
        direction
      );

      if (shouldCrush && tile.type !== 'wall' && tile.type !== 'crushed') {
        return { ...tile, type: 'crushed' as const, justCrushed: true };
      }
      return tile;
    });

    // Check mode-specific loss condition
    const mode = getModeById(ctx.modeId);
    if (mode.checkLoss) {
      const state = ctx.getState();
      const { lost, reason } = mode.checkLoss(newTiles, newOffset, state.moves, level.maxMoves, {
        score: state.score,
        targetScore: level.targetScore,
      });

      if (lost) {
        return {
          tiles: newTiles,
          newOffset,
          gameOver: true,
          lossReason: reason ?? null,
        };
      }
    }

    // Check if any goal node was crushed - game over if even one goal is destroyed
    const anyGoalCrushed = level.goalNodes.some(
      (g: Position) => newTiles.find((t) => t.x === g.x && t.y === g.y)?.type === 'crushed'
    );

    if (anyGoalCrushed) {
      return {
        tiles: newTiles,
        newOffset,
        gameOver: true,
        lossReason: 'Goal destroyed!',
      };
    }

    return {
      tiles: newTiles,
      newOffset,
      gameOver: false,
      lossReason: null,
    };
  }

  /**
   * Get the maximum wall offset for a given grid size
   */
  getMaxOffset(gridCols: number, gridRows: number): number {
    return Math.floor(Math.min(gridCols, gridRows) / 2);
  }

  /**
   * Check if a position is inside the wall boundary (all-sides default).
   * For directional compression, use shouldCrushAtPosition directly.
   */
  isInsideWall(
    x: number,
    y: number,
    gridCols: number,
    gridRows: number,
    wallOffset: number
  ): boolean {
    const dist = Math.min(x, y, gridCols - 1 - x, gridRows - 1 - y);
    return dist < wallOffset;
  }

  /**
   * Get all positions that would be crushed at a given wall offset (all-sides).
   */
  getCrushedPositions(gridCols: number, gridRows: number, wallOffset: number): Position[] {
    const positions: Position[] = [];
    for (let x = 0; x < gridCols; x++) {
      for (let y = 0; y < gridRows; y++) {
        if (this.isInsideWall(x, y, gridCols, gridRows, wallOffset)) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }
}

/**
 * Create a compression system instance
 */
export function createCompressionSystem(): CompressionSystem {
  return new CompressionSystem();
}
