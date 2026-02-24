// PRESSURE - Classic Mode Tutorial

import { TutorialStep } from '../modes/types';

export const CLASSIC_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '⚡',
    iconColor: '#a78bfa',
    title: 'Welcome to Pressure',
    subtitle: 'THE PIPE PUZZLE',
    demo: 'fixed-path',
    body: 'The board is full of pipe tiles. Blue tiles are locked in place — they anchor the path.\n\nTap the orange tiles to rotate them and complete the connection.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap to Rotate',
    subtitle: 'YOUR MAIN MOVE',
    demo: 'rotatable',
    body: 'Tap any orange tile and it rotates 90° clockwise. Align the openings so pipe flows continuously from node to node.\n\nOne tap can change everything.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Goal Nodes',
    subtitle: 'CONNECT THEM ALL',
    demo: 'node',
    body: "Every green glowing tile is a goal node. Connect them all through an unbroken pipe path — that's your win condition.\n\nMiss even one and the puzzle stays open.",
  },
  {
    icon: '🧱',
    iconColor: '#ef4444',
    title: 'The Walls Are Closing',
    subtitle: 'ACT FAST',
    demo: 'walls',
    body: "Red walls advance from every edge on a timer. Any tile they reach gets crushed.\n\nIf a wall crushes a goal node, it's game over. Solve the puzzle before they meet in the middle.",
  },
  {
    icon: '🎮',
    iconColor: '#6366f1',
    title: 'Undo & Hints',
    subtitle: 'YOUR TOOLS',
    demo: 'controls',
    body: 'Tap ⎌ to undo your last rotation. Tap 💡 to reveal the next correct move.\n\nBoth cost precious time — the walls keep moving while you think.',
  },
  {
    icon: '✦',
    iconColor: '#fbbf24',
    title: "You're Ready!",
    subtitle: 'CONNECT BEFORE THE CRUSH',
    demo: 'ready',
    body: 'Rotate the orange tiles. Connect all goal nodes. Beat the walls.\n\nThe clock is already ticking.',
  },
];
