// PRESSURE - Zen Mode
// Pure puzzle, no walls, no pressure. Just connect the pipes.

import { GameModeConfig, TapResult, WinResult } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { CLASSIC_LEVELS } from '../classic/levels';
import { ZEN_LEVELS_SET_2, STREAM_EDITED_LEVEL, RIPPLE_EDITED_LEVEL } from './levels';
import { ZEN_TUTORIAL_STEPS } from './tutorial';
import { renderZenDemo } from './demo';
import { ZEN_WALKTHROUGH } from './walkthrough';

// Combine classic levels with Zen-specific levels (including custom levels)
const ALL_ZEN_LEVELS = [
  ...CLASSIC_LEVELS,
  ...ZEN_LEVELS_SET_2,
  STREAM_EDITED_LEVEL,
  RIPPLE_EDITED_LEVEL,
];

export const ZEN_WORLDS = [
  { id: 1, name: 'Breathe', tagline: 'Learn the basics', color: '#22c55e', icon: '◈' },
  { id: 2, name: 'Squeeze', tagline: 'Find your flow', color: '#34d399', icon: '◆' },
  { id: 3, name: 'Crush', tagline: 'Pure challenge', color: '#6ee7b7', icon: '⬟' },
  { id: 4, name: 'Flow', tagline: 'Medium puzzles', color: '#10b981', icon: '◇' },
  { id: 5, name: 'Peace', tagline: 'Larger grids', color: '#059669', icon: '⬡' },
  { id: 6, name: 'Nirvana', tagline: 'Ultimate challenges', color: '#047857', icon: '✧' },
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
  renderDemo: renderZenDemo,
  getLevels: () => ALL_ZEN_LEVELS,
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
};
