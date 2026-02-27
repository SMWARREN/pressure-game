// PRESSURE - Blitz Mode
// Walls close fast and never stop. No move limit — solve it before you're crushed.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { PRESSURE_LEVELS } from '../shared/levels';
import { Tile } from '../../types';
import { BLITZ_TUTORIAL_STEPS } from './tutorial';
import { renderBlitzDemo } from './demo';
import { BLITZ_WALKTHROUGH } from './walkthrough';

export const BLITZ_WORLDS = [
  { id: 1, name: 'Ignite',     tagline: 'Warm up',                   color: '#fb923c', icon: '◈' },
  { id: 2, name: 'Surge',      tagline: 'Walls never stop',          color: '#f97316', icon: '◆' },
  { id: 3, name: 'Overload',   tagline: 'No mercy',                  color: '#ef4444', icon: '⬟' },
  { id: 4, name: 'Vector',     tagline: 'Pick your angle',           color: '#dc2626', icon: '▲' },
  { id: 5, name: 'Lateral',    tagline: 'Sideways burn',             color: '#b91c1c', icon: '◀' },
  { id: 6, name: 'Vise',       tagline: 'Closing from both ends',    color: '#991b1b', icon: '⬛' },
  { id: 7, name: 'Channel',    tagline: 'Side by side annihilation', color: '#7f1d1d', icon: '▬' },
  { id: 8, name: 'Zero Hour',  tagline: 'The full grid unleashed',   color: '#450a0a', icon: '✦' },
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
  renderDemo: renderBlitzDemo,
  getLevels: () => PRESSURE_LEVELS,
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

  checkLoss(tiles): LossResult {
    const crushedGoal = tiles.some((t: Tile) => t.isGoalNode && t.type === 'crushed');
    return {
      lost: crushedGoal,
      reason: crushedGoal ? 'A goal was crushed' : undefined,
    };
  },

  statsLabels: {
    moves: 'TAPS',
    compression: 'INCOMING',
  },
  // Blitz has walls but no move limit - show taps, compression bar, and countdown
  statsDisplay: [{ type: 'moves' }, { type: 'compressionBar' }, { type: 'countdown' }],
  walkthrough: BLITZ_WALKTHROUGH,
};
