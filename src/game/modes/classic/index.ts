// PRESSURE - Classic Mode
// The original pipe puzzle with closing walls.
// Connect all goal nodes before the walls crush them.

import { GameModeConfig, TapResult, WinResult, TutorialStep } from '../types';
import { rotateTileTap, checkConnected } from '../utils';
import { LEVELS } from '../../levels';

export const CLASSIC_WORLDS = [
  { id: 1, name: 'Breathe', tagline: 'Learn the basics', color: '#22c55e', icon: '◈' },
  { id: 2, name: 'Squeeze', tagline: 'Feel the walls', color: '#f59e0b', icon: '◆' },
  { id: 3, name: 'Crush', tagline: 'Survive or die', color: '#ef4444', icon: '⬟' },
];

export const CLASSIC_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '⚡',
    iconColor: '#a78bfa',
    title: 'Welcome to Pressure',
    subtitle: 'THE PIPE PUZZLE',
    demo: 'fixed-path',
    body: "Pipes fill the board. Fixed pipes (blue) can't move — they show you the path.\n\nYour job: connect all the glowing goal nodes.",
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap to Rotate',
    subtitle: 'YOUR MAIN MOVE',
    demo: 'rotatable',
    body: 'Tap any orange tile to rotate it 90°. Line up the pipe openings so the connection flows from node to node.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Goal Nodes',
    subtitle: 'CONNECT THEM ALL',
    demo: 'node',
    body: 'Green glowing tiles are goal nodes. They need to be connected to each other through a continuous pipe path to win.',
  },
  {
    icon: '🧱',
    iconColor: '#ef4444',
    title: 'The Walls Are Closing',
    subtitle: 'ACT FAST',
    demo: 'walls',
    body: 'Red walls close in from all sides on a timer. Tiles caught in the walls get crushed — and if a goal node is crushed, you lose.\n\nEvery move counts.',
  },
  {
    icon: '🎮',
    iconColor: '#6366f1',
    title: 'Undo & Hints',
    subtitle: 'YOUR TOOLS',
    demo: 'controls',
    body: "Stuck? Use Undo (⎌) to take back a move, or tap the Hint (💡) to see the next best rotation. Use them wisely — the walls won't wait.",
  },
  {
    icon: '✦',
    iconColor: '#fbbf24',
    title: "You're Ready!",
    subtitle: 'CONNECT BEFORE THE CRUSH',
    demo: 'ready',
    body: "Connect all nodes before the walls close in. Watch your move count. Good luck — you'll need it.",
  },
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
  getLevels: () => LEVELS,
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

  statsLabels: {
    moves: 'MOVES',
    compression: 'PRESSURE',
  },
  statsDisplay: [
    { type: 'moves' },
    { type: 'compressionBar' },
    { type: 'countdown' },
  ],
};
