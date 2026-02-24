// PRESSURE - Quantum Chain Mode Tutorial

import { TutorialStep } from '../modes/types';

export const QUANTUM_CHAIN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🔢',
    iconColor: '#3b82f6',
    title: 'Start the Chain',
    subtitle: 'STEP 1',
    demo: 'quantum-start',
    body: "Tap any blue NUMBER tile to kick off your chain.\n\nThat tile's value becomes the start of your equation.\n\nOnly blue tiles can open a chain — pick your starting number wisely!",
  },
  {
    icon: '➕',
    iconColor: '#8b5cf6',
    title: 'Extend with an Operator',
    subtitle: 'STEP 2',
    demo: 'quantum-extend',
    body: 'After a number, tap an adjacent purple OPERATOR tile (+  −  ×  ÷).\n\nThe tile must touch the last tile you tapped — no jumping!\n\nThe operator tells the chain how to combine your next number.',
  },
  {
    icon: '🎯',
    iconColor: '#f59e0b',
    title: 'Land on the Target',
    subtitle: 'STEP 3',
    demo: 'quantum-target',
    body: "Keep alternating: Number → Operator → Number → …\n\nEnd the chain by tapping a gold TARGET tile. If your result equals the target's number, it locks in with a ✓!\n\nFulfill every target on the board to win the level.",
  },
  {
    icon: '⚛️',
    iconColor: '#ef4444',
    title: 'Quantum Flux Twists Numbers',
    subtitle: 'WATCH OUT',
    demo: 'quantum-flux',
    body: 'Red QUANTUM FLUX tiles silently warp any number tile next to them — doubling it, halving it, or shifting it by a fixed amount.\n\nThe blue tile will show its modified value, not its raw value.\n\nRoute your chain through flux-affected numbers to hit tricky targets.',
  },
  {
    icon: '🔗',
    iconColor: '#8b5cf6',
    title: 'Build Your Chain',
    subtitle: "LET'S GO",
    demo: 'quantum-ready',
    body: 'Tap the wrong tile type and the chain resets instantly — no moves lost, no penalty.\n\nTap any tile already in your chain to cancel it yourself.\n\nExperiment freely: every reset is a free retry.',
  },
];
