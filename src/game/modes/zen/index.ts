// PRESSURE - Zen Mode
// Pure puzzle, no walls, no pressure. Just connect the pipes.

import { GameModeConfig, TapResult, WinResult } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { PRESSURE_LEVELS } from '../shared/levels';
import { ZEN_TUTORIAL_STEPS } from './tutorial';
import { renderZenDemo } from './demo';
import { ZEN_WALKTHROUGH } from './walkthrough';

export const ZEN_WORLDS = [
  { id: 1, name: 'Breathe',   tagline: 'Learn the basics',        color: '#22c55e', icon: '◈' },
  { id: 2, name: 'Flow',      tagline: 'Find your rhythm',        color: '#34d399', icon: '◆' },
  { id: 3, name: 'Calm',      tagline: 'Pure puzzle',             color: '#6ee7b7', icon: '⬟' },
  { id: 4, name: 'Drift',     tagline: 'Larger grids, no rush',   color: '#10b981', icon: '◇' },
  { id: 5, name: 'Current',   tagline: 'Winding corridors',       color: '#059669', icon: '⬡' },
  { id: 6, name: 'Deep',      tagline: 'Complex networks',        color: '#047857', icon: '✧' },
  { id: 7, name: 'Peace',     tagline: 'Wide open puzzles',       color: '#065f46', icon: '⬢' },
  { id: 8, name: 'Nirvana',   tagline: 'The full canvas',         color: '#064e3b', icon: '✦' },
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
};
