// PRESSURE - Zen Mode
// Pure puzzle, no walls, no pressure. Just connect the pipes.

import { GameModeConfig, TapResult, WinResult } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { PRESSURE_LEVELS } from '../shared/levels';
import { ZEN_TUTORIAL_STEPS } from './tutorial';
import { renderZenDemo } from './demo';
import { ZEN_WALKTHROUGH } from './walkthrough';
import { getModeColorPalette } from '../modeColorFactory';
import worldMetadata from './world-metadata.json';

export const ZEN_WORLDS = worldMetadata;

export const ZenMode: GameModeConfig = {
  id: 'zen',
  name: 'Zen',
  description: 'No walls, no pressure. Pure puzzle.',
  icon: '🧘',
  color: '#34d399',
  wallCompression: 'never',
  supportsUndo: true,
  useMoveLimit: false,
  tutorialSteps: ZEN_TUTORIAL_STEPS,
  renderDemo: renderZenDemo,
  getLevels: () => PRESSURE_LEVELS,
  worlds: ZEN_WORLDS,
  supportsWorkshop: true,

  onTileTap(x, y, tiles): TapResult | null {
    const newTiles = rotateTileTap(x, y, tiles);
    if (!newTiles) return null;
    return { tiles: newTiles, valid: true };
  },

  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes);
    return { won, reason: won ? 'Connected!' : undefined };
  },

  statsLabels: {
    moves: 'MOVES',
  },
  // Zen mode has no walls, no timer - just show moves
  statsDisplay: [{ type: 'moves' }],
  walkthrough: ZEN_WALKTHROUGH,

  getColorContext: () => getModeColorPalette('zen'),
};
