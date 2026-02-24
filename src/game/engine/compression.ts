// PRESSURE - Compression System
// Handles wall compression mechanics for the game engine.

import type { Tile, Level, Position } from '../types';
import type { WallAdvanceResult, EngineContext } from './types';
import { getModeById } from '../modes';

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

    return override !== null ? override : true;
  }

  /**
   * Advance walls by one step, crushing tiles that are now inside the wall boundary.
   */
  advance(tiles: Tile[], wallOffset: number, level: Level, ctx: EngineContext): WallAdvanceResult {
    const gridSize = level.gridSize;
    const maxOffset = Math.floor(gridSize / 2);
    const newOffset = wallOffset + 1;

    // Can't advance beyond the maximum
    if (newOffset > maxOffset) {
      return { tiles, newOffset: wallOffset, gameOver: false, lossReason: null };
    }

    // Crush tiles that are now inside the wall boundary
    const newTiles = tiles.map((tile) => {
      const dist = Math.min(tile.x, tile.y, gridSize - 1 - tile.x, gridSize - 1 - tile.y);

      if (dist < newOffset && tile.type !== 'wall' && tile.type !== 'crushed') {
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

    // Check if all goal nodes were crushed
    const allGoalsCrushed =
      level.goalNodes.length > 0 &&
      level.goalNodes.every(
        (g: Position) => newTiles.find((t) => t.x === g.x && t.y === g.y)?.type === 'crushed'
      );

    if (allGoalsCrushed) {
      return {
        tiles: newTiles,
        newOffset,
        gameOver: true,
        lossReason: null,
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
  getMaxOffset(gridSize: number): number {
    return Math.floor(gridSize / 2);
  }

  /**
   * Check if a position is inside the wall boundary
   */
  isInsideWall(x: number, y: number, gridSize: number, wallOffset: number): boolean {
    const dist = Math.min(x, y, gridSize - 1 - x, gridSize - 1 - y);
    return dist < wallOffset;
  }

  /**
   * Get all positions that would be crushed at a given wall offset
   */
  getCrushedPositions(gridSize: number, wallOffset: number): Position[] {
    const positions: Position[] = [];

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (this.isInsideWall(x, y, gridSize, wallOffset)) {
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
