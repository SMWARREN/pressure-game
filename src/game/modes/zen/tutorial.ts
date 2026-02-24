// PRESSURE - Zen Mode Tutorial Steps

import { TutorialStep } from '../types';

export const ZEN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🧘',
    iconColor: '#6366f1',
    title: 'Relax & Connect',
    subtitle: 'NO PRESSURE',
    demo: 'zen-ready',
    body: "Take your time. There's no timer, no walls closing in. Just you and the pipes.",
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
    body: 'Green glowing tiles are goal nodes. All of them must be connected through a continuous path to win.',
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
    demo: 'zen-ready',
    body: 'Enjoy the calm. Connect at your own pace.',
  },
];
