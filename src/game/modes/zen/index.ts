// PRESSURE - Zen Mode
// Pure puzzle, no walls, no pressure. Just connect the pipes.

import { GameModeConfig, TapResult, WinResult } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { CLASSIC_LEVELS } from '../classic/levels';
import { ZEN_TUTORIAL_STEPS } from '../../tutorials';

export const ZEN_WORLDS = [
  { id: 1, name: 'Breathe', tagline: 'Learn the basics', color: '#22c55e', icon: '◈' },
  { id: 2, name: 'Squeeze', tagline: 'Find your flow', color: '#34d399', icon: '◆' },
  { id: 3, name: 'Crush', tagline: 'Pure challenge', color: '#6ee7b7', icon: '⬟' },
];

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
  getLevels: () => CLASSIC_LEVELS,
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
};
