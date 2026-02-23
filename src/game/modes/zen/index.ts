// PRESSURE - Zen Mode
// Pure puzzle, no walls, no pressure. Just connect the pipes.

import { GameModeConfig, TapResult, WinResult, TutorialStep } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { LEVELS } from '../../levels';

export const ZEN_WORLDS = [
  { id: 1, name: 'Breathe', tagline: 'Learn the basics', color: '#22c55e', icon: '◈' },
  { id: 2, name: 'Squeeze', tagline: 'Find your flow', color: '#34d399', icon: '◆' },
  { id: 3, name: 'Crush', tagline: 'Pure challenge', color: '#6ee7b7', icon: '⬟' },
];

export const ZEN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🧘',
    iconColor: '#34d399',
    title: 'Welcome to Zen',
    subtitle: 'NO RUSH, NO WALLS',
    demo: 'fixed-path',
    body: 'No walls. No timer. No pressure. Zen mode strips the puzzle down to its essence.\n\nBlue tiles are fixed anchors. Rotate the orange ones to complete the path.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap to Rotate',
    subtitle: 'EXPERIMENT FREELY',
    demo: 'rotatable',
    body: 'Tap any orange tile to rotate it 90° clockwise. Try every orientation — nothing here punishes experimentation.\n\nWhen the openings align, the pipe connects.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Connect the Nodes',
    subtitle: 'YOUR ONLY GOAL',
    demo: 'node',
    body: 'The green glowing tiles are goal nodes. Link every single one through a continuous, unbroken pipe path.\n\nNo walls. No clock. One clean solution.',
  },
  {
    icon: '♾️',
    iconColor: '#34d399',
    title: 'No Limits',
    subtitle: 'TAKE YOUR TIME',
    demo: 'controls',
    body: "Undo as many times as you want. Use the hint whenever you're stuck. Zen mode rewards patience and observation, not speed.",
  },
  {
    icon: '✦',
    iconColor: '#34d399',
    title: 'Find Your Flow',
    subtitle: 'PURE PUZZLE ZEN',
    demo: 'zen-ready',
    body: "Rotate. Connect. Solve. There's no rush and nowhere to be.\n\nFind the path.",
  },
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
  getLevels: () => LEVELS,
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
