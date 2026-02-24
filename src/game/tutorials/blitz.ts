// PRESSURE - Blitz Mode Tutorial

import { TutorialStep } from '../modes/types';

export const BLITZ_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🔥',
    iconColor: '#f97316',
    title: 'Welcome to Blitz',
    subtitle: 'SPEED IS EVERYTHING',
    demo: 'fixed-path',
    body: 'Blitz is the most unforgiving mode. The walls never stop — not between moves, not ever.\n\nRotate the orange tiles, connect all goal nodes, and get out before the walls arrive.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap Fast',
    subtitle: 'EVERY SECOND COUNTS',
    demo: 'rotatable',
    body: "Tap an orange tile to rotate it 90°. There's no move limit, but there's no undo either.\n\nEvery tap is permanent. Make it count.",
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Protect the Nodes',
    subtitle: 'ONE CRUSH = GAME OVER',
    demo: 'node',
    body: "A single wall touching a single goal node ends your run instantly. No second chances, no recovery.\n\nKeep your nodes connected and out of the walls' path.",
  },
  {
    icon: '💀',
    iconColor: '#ef4444',
    title: 'Walls Never Stop',
    subtitle: 'RELENTLESS PRESSURE',
    demo: 'walls',
    body: "In Classic mode the walls pause between ticks. In Blitz they advance constantly on a short, merciless timer.\n\nScan the board before you tap. There's no undoing a wrong rotation.",
  },
  {
    icon: '✦',
    iconColor: '#f97316',
    title: 'Survive!',
    subtitle: 'CONNECT OR DIE',
    demo: 'blitz-ready',
    body: 'No undo. Walls never stop. One crushed node ends it all.\n\nThink fast. Move faster.',
  },
];