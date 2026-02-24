// PRESSURE - Blitz Mode Tutorial Steps

import { TutorialStep } from '../types';

export const BLITZ_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🔥',
    iconColor: '#f97316',
    title: 'Beat the Clock',
    subtitle: 'RACE THE TIMER',
    demo: 'blitz-ready',
    body: 'Complete each level before time runs out! The timer is ticking — every second counts.',
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
    icon: '💀',
    iconColor: '#ef4444',
    title: 'Wall Compression',
    subtitle: 'THE PRESSURE',
    demo: 'walls',
    body: 'Walls close in from all sides! If they crush the playable area before you connect all nodes, you lose.',
  },
  {
    icon: '⚡',
    iconColor: '#fbbf24',
    title: 'Ready!',
    subtitle: "LET'S GO",
    demo: 'blitz-ready',
    body: 'Think fast, rotate faster. Survive the pressure!',
  },
];