// PRESSURE - Classic Mode
// The original pipe puzzle with closing walls.
// Connect all goal nodes before the walls crush them.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import { rotateTileTap, checkConnected } from '../utils';
import { CLASSIC_LEVELS } from './levels';
import { CLASSIC_TUTORIAL_STEPS } from './tutorial';
import { renderClassicDemo } from './demo';

export const CLASSIC_WORLDS = [
  { id: 1, name: 'Breathe', tagline: 'Learn the basics', color: '#22c55e', icon: '◈' },
  { id: 2, name: 'Squeeze', tagline: 'Feel the walls', color: '#f59e0b', icon: '◆' },
  { id: 3, name: 'Crush', tagline: 'Survive or die', color: '#ef4444', icon: '⬟' },
];

export const ClassicMode: GameModeConfig = {
  id: 'classic',
  name: 'Pressure',
  description: 'Connect all nodes before the walls close in.',
  icon: '⚡',
  color: '#a78bfa',
  wallCompression: 'always',
  supportsUndo: true,
  useMoveLimit: true,
  tutorialSteps: CLASSIC_TUTORIAL_STEPS,
  renderDemo: renderClassicDemo,
  getLevels: () => CLASSIC_LEVELS,
  worlds: CLASSIC_WORLDS,
  supportsWorkshop: true,

  onTileTap(x, y, tiles): TapResult | null {
    const newTiles = rotateTileTap(x, y, tiles);
    if (!newTiles) return null;
    return { tiles: newTiles, valid: true };
  },

  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes);
    return { won, reason: won ? 'All nodes connected!' : undefined };
  },

  checkLoss(tiles): LossResult {
    const crushedGoal = tiles.some((t: Tile) => t.isGoalNode && t.type === 'crushed');
    return {
      lost: crushedGoal,
      reason: crushedGoal ? 'A goal was crushed' : undefined,
    };
  },

  statsLabels: {
    moves: 'MOVES',
    compression: 'PRESSURE',
  },
  statsDisplay: [{ type: 'moves' }, { type: 'compressionBar' }, { type: 'countdown' }],
};
