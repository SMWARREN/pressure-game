// PRESSURE - Laser Relay Mode Tutorial Steps

import { TutorialStep } from '../types';

export const LASER_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🔦',
    iconColor: '#22c55e',
    title: 'Guide the Beam',
    subtitle: 'YOUR GOAL',
    demo: 'laser-source',
    body: 'A laser beam shoots from the green source tile. Your job is to redirect it using mirrors until it hits the red target.',
  },
  {
    icon: '╱',
    iconColor: '#38bdf8',
    title: 'Rotate Mirrors',
    subtitle: 'TAP TO TOGGLE',
    demo: 'laser-mirror',
    body: 'Tap a mirror tile to flip its orientation between ╱ (forward slash) and ╲ (backslash). Each mirror bounces the beam 90°.',
  },
  {
    icon: '⚡',
    iconColor: '#06b6d4',
    title: 'Watch the Beam',
    subtitle: 'REAL-TIME TRACE',
    demo: 'laser-beam',
    body: 'The beam traces automatically through the grid. Watch it bounce mirror to mirror — the cyan glow shows its current path.',
  },
  {
    icon: '◎',
    iconColor: '#ef4444',
    title: 'Hit the Target',
    subtitle: 'WIN CONDITION',
    demo: 'laser-target',
    body: 'When the beam reaches the red target ◎, you win! Plan your mirror rotations to route the beam through obstacles.',
  },
  {
    icon: '🎯',
    iconColor: '#fbbf24',
    title: 'Ready!',
    subtitle: "LET'S GO",
    demo: 'laser-ready',
    body: 'Use your rotations wisely — each level has a limit. Think ahead and light up the target!',
  },
];
