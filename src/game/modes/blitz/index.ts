// PRESSURE - Blitz Mode
// Walls close fast and never stop. No move limit — solve it before you're crushed.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { CLASSIC_LEVELS } from '../classic/levels';
import { Tile } from '../../types';
import { BLITZ_TUTORIAL_STEPS } from '../../tutorials';

export const BLITZ_WORLDS = [
  { id: 1, name: 'Breathe', tagline: 'Warm up', color: '#fb923c', icon: '◈' },
  { id: 2, name: 'Squeeze', tagline: 'Walls never stop', color: '#f97316', icon: '◆' },
  { id: 3, name: 'Crush', tagline: 'No mercy', color: '#ef4444', icon: '⬟' },
];

export const BlitzMode: GameModeConfig = {
  id: 'blitz',
  name: 'Blitz',
  description: 'No move limit. Walls never stop. Solve fast or die.',
  icon: '🔥',
  color: '#f97316',
  wallCompression: 'always',
  supportsUndo: false,
  useMoveLimit: false,
  tutorialSteps: BLITZ_TUTORIAL_STEPS,
  getLevels: () => CLASSIC_LEVELS,
  worlds: BLITZ_WORLDS,
  supportsWorkshop: true,

  onTileTap(x, y, tiles): TapResult | null {
    const newTiles = rotateTileTap(x, y, tiles);
    if (!newTiles) return null;
    return { tiles: newTiles, valid: true };
  },

  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes);
    return { won, reason: won ? 'Survived!' : undefined };
  },

  checkLoss(tiles, _wallOffset, _moves, _maxMoves): LossResult {
    const crushedGoal = tiles.some((t: Tile) => t.isGoalNode && t.type === 'crushed');
    return {
      lost: crushedGoal,
      reason: crushedGoal ? 'A node was crushed!' : undefined,
    };
  },

  statsLabels: {
    moves: 'TAPS',
    compression: 'INCOMING',
  },
};
