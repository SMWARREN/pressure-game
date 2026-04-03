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
import { getModeColorPalette } from '../modeColorFactory';
import worldMetadata from './world-metadata.json';

export const CLASSIC_WORLDS = worldMetadata;

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

  getColorContext: () => getModeColorPalette('classic'),
};
