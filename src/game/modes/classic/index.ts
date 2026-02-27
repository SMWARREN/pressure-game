// PRESSURE - Classic Mode
// The original pipe puzzle with closing walls.
// Connect all goal nodes before the walls crush them.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import { rotateTileTap, checkConnected } from '../utils';
import { PRESSURE_LEVELS } from '../shared/levels';
import { CLASSIC_TUTORIAL_STEPS } from './tutorial';
import { renderClassicDemo } from './demo';
import { CLASSIC_WALKTHROUGH } from './walkthrough';

export const CLASSIC_WORLDS = [
  { id: 1, name: 'Breathe',     tagline: 'Learn the basics',           color: '#22c55e', icon: '◈' },
  { id: 2, name: 'Squeeze',     tagline: 'Feel the walls',             color: '#f59e0b', icon: '◆' },
  { id: 3, name: 'Crush',       tagline: 'Survive or die',             color: '#ef4444', icon: '⬟' },
  { id: 4, name: 'Directional', tagline: 'Walls pick a side',          color: '#f97316', icon: '▲' },
  { id: 5, name: 'Lateral',     tagline: 'Horizontal pressure',        color: '#dc2626', icon: '◀' },
  { id: 6, name: 'Squeeze',     tagline: 'Top and bottom close in',    color: '#b91c1c', icon: '⬛' },
  { id: 7, name: 'Corridor',    tagline: 'Left and right close in',    color: '#991b1b', icon: '▬' },
  { id: 8, name: 'Singularity', tagline: 'The largest grid. No mercy', color: '#7f1d1d', icon: '✦' },
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
  getLevels: () => PRESSURE_LEVELS,
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

  checkLoss(tiles, _wallOffset, moves, maxMoves): LossResult {
    const crushedGoal = tiles.some((t: Tile) => t.isGoalNode && t.type === 'crushed');
    if (crushedGoal) return { lost: true, reason: 'A goal was crushed' };
    if (maxMoves !== undefined && moves >= maxMoves) return { lost: true, reason: 'Out of moves!' };
    return { lost: false };
  },

  statsLabels: {
    moves: 'MOVES',
    compression: 'PRESSURE',
  },
  statsDisplay: [{ type: 'moves' }, { type: 'compressionBar' }, { type: 'countdown' }],
  walkthrough: CLASSIC_WALKTHROUGH,
};
