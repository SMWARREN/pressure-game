// PRESSURE - Blitz Mode
// Walls close fast and never stop. No move limit — solve it before you're crushed.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { PRESSURE_LEVELS } from '../shared/levels';
import { Tile } from '../../types';
import { BLITZ_TUTORIAL_STEPS } from './tutorial';
import { renderBlitzDemo } from './demo';
import { BLITZ_WALKTHROUGH } from './walkthrough';
import { getModeColorPalette } from '../modeColorFactory';
import worldMetadata from './world-metadata.json';

export const BLITZ_WORLDS = worldMetadata;

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

  getColorContext: () => getModeColorPalette('blitz'),
};
