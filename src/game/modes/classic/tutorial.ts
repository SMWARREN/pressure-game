// PRESSURE - Classic Mode Tutorial Steps

import { TutorialStep } from '../types';

export const CLASSIC_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🔌',
    iconColor: '#818cf8',
    title: 'Connect the Pipes',
    subtitle: 'YOUR GOAL',
    demo: 'fixed-path',
    body: 'Connect all goal nodes by rotating the pipe tiles. Fixed blue tiles show the path — your job is to fill in the gaps.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap to Rotate',
    subtitle: 'YOUR MAIN MOVE',
    demo: 'rotatable',
    body: 'Tap any rotatable tile to spin it 90° clockwise. Line up the openings so the pipe flows from node to node.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Goal Nodes',
    subtitle: 'CONNECT THEM ALL',
    demo: 'node',
    body: 'Green glowing tiles are goal nodes. All of them must be connected through a continuous path to win the level.',
  },
  {
    icon: '🎮',
    iconColor: '#6366f1',
    title: 'Controls',
    subtitle: 'UNDO & HINTS',
    demo: 'controls',
    body: 'Use Undo (⎌) to take back a move, or tap Hint (💡) to highlight the next suggested rotation.',
  },
  {
    icon: '✦',
    iconColor: '#fbbf24',
    title: 'Ready!',
    subtitle: "LET'S GO",
    demo: 'ready',
    body: 'Connect all nodes to win. Good luck!',
  },
];