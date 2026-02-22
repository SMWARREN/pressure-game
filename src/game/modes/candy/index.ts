// CANDY MODE
// Tap tiles to cycle through candy symbols. Win when all tiles match their target.
// Uses the tileRenderer plugin to completely replace the pipe visual with candy icons.
// No walls, no pipe connections — pure pattern matching.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile, Position } from '../../types';
import { CANDY_LEVELS, CANDY_WORLDS, CANDY_SYMBOLS } from './levels';

// ── Win tile helper ───────────────────────────────────────────────────────────

function getMatchedTiles(tiles: Tile[]): Set<string> {
  return new Set(
    tiles
      .filter((t) => t.canRotate && t.displayData?.symbol === t.displayData?.target)
      .map((t) => `${t.x},${t.y}`)
  );
}

function allMatched(tiles: Tile[]): boolean {
  const candyTiles = tiles.filter((t) => t.canRotate && t.displayData?.target !== undefined);
  if (candyTiles.length === 0) return false;
  return candyTiles.every((t) => t.displayData?.symbol === t.displayData?.target);
}

// ── Candy Mode Config ─────────────────────────────────────────────────────────

export const CandyMode: GameModeConfig = {
  id: 'candy',
  name: 'Candy',
  description: 'Tap to cycle candies. Match all targets to win.',
  icon: '🍬',
  color: '#f472b6',
  wallCompression: 'never',
  supportsUndo: true,
  useMoveLimit: true,
  getLevels: () => CANDY_LEVELS,
  worlds: CANDY_WORLDS,
  supportsWorkshop: false,

  tileRenderer: {
    type: 'candy',
    hidePipes: true,
    symbolSize: '1.5rem',

    getColors(tile, ctx) {
      if (tile.type === 'wall') {
        return {
          background: 'linear-gradient(145deg, #0e0e1c 0%, #090912 100%)',
          border: '1px solid #131325',
        };
      }
      if (tile.type === 'crushed') {
        return {
          background: 'linear-gradient(145deg, #1a0000 0%, #0d0000 100%)',
          border: '1px solid #2a0505',
          boxShadow: 'inset 0 0 12px rgba(239,68,68,0.15)',
        };
      }
      if (!tile.canRotate) {
        return { background: 'rgba(10,10,20,0.3)', border: '1px solid transparent' };
      }

      const isMatch = tile.displayData?.symbol === tile.displayData?.target;

      if (isMatch) {
        return {
          background: 'linear-gradient(145deg, #14532d 0%, #0f3d21 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 0 14px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        };
      }

      if (ctx.inDanger) {
        return {
          background: 'linear-gradient(145deg, #3d1a1a 0%, #2d1010 100%)',
          border: '2px solid #ef4444',
          boxShadow: '0 0 12px rgba(239,68,68,0.4)',
        };
      }

      return {
        background: 'linear-gradient(145deg, #2d1a3d 0%, #1e1028 100%)',
        border: `2px solid ${ctx.isHint ? '#f9a8d4' : '#f472b6'}`,
        boxShadow: ctx.isHint ? '0 0 16px rgba(249,168,212,0.5)' : '0 0 8px rgba(244,114,182,0.2)',
      };
    },

    getSymbol(tile, _ctx) {
      if (tile.type === 'wall' || tile.type === 'empty') return null;
      if (!tile.canRotate) return null;
      return (tile.displayData?.symbol as string) ?? '?';
    },
  },

  onTileTap(x, y, tiles): TapResult | null {
    const tile = tiles.find((t) => t.x === x && t.y === y);
    if (!tile?.canRotate) return null;

    const current = (tile.displayData?.symbol as string) ?? CANDY_SYMBOLS[0];
    const idx = CANDY_SYMBOLS.indexOf(current);
    const next = CANDY_SYMBOLS[(idx + 1) % CANDY_SYMBOLS.length];

    const newTiles = tiles.map((t) => {
      if (t.x === x && t.y === y) {
        return { ...t, justRotated: true, displayData: { ...t.displayData, symbol: next } };
      }
      return { ...t, justRotated: false };
    });

    return { tiles: newTiles, valid: true };
  },

  checkWin(tiles, _goalNodes: Position[]): WinResult {
    const won = allMatched(tiles);
    return { won, reason: won ? 'All candies matched!' : undefined };
  },

  checkLoss(tiles, _wallOffset, moves, maxMoves): LossResult {
    const lost = moves >= maxMoves && !allMatched(tiles);
    return { lost, reason: lost ? 'Out of moves!' : undefined };
  },

  getWinTiles(tiles, _goalNodes: Position[]): Set<string> {
    return getMatchedTiles(tiles);
  },

  statsLabels: {
    moves: 'TAPS',
  },
  statsDisplay: [{ type: 'moves' }],
};
