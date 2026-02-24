// PRESSURE - Quantum Chain Mode Tutorial Steps

import { TutorialStep } from '../types';

export const QUANTUM_CHAIN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '⛓️',
    iconColor: '#8b5cf6',
    title: 'Build Math Chains',
    subtitle: 'YOUR GOAL',
    demo: 'quantum-chain',
    body: 'Create chains of numbers and operators to hit target values. Think math!',
  },
  {
    icon: '🔢',
    iconColor: '#3b82f6',
    title: 'Start with Numbers',
    subtitle: 'BLUE TILES',
    demo: 'quantum-start',
    body: 'Tap a blue number tile to start your chain. This is your starting value.',
  },
  {
    icon: '➕',
    iconColor: '#8b5cf6',
    title: 'Extend the Chain',
    subtitle: 'ALTERNATE TYPES',
    demo: 'quantum-extend',
    body: 'After a number, tap an operator (+, -, ×). After an operator, tap a number. Keep alternating!',
  },
  {
    icon: '🎯',
    iconColor: '#f59e0b',
    title: 'Hit Targets',
    subtitle: 'MATCH THE VALUE',
    demo: 'quantum-target',
    body: 'When your chain\'s result matches a target tile, you score! Clear all targets to win.',
  },
  {
    icon: '⚡',
    iconColor: '#ef4444',
    title: 'Flux Tiles',
    subtitle: 'SPECIAL POWER',
    demo: 'quantum-flux',
    body: 'Flux tiles (×2) double adjacent numbers. Use them strategically for big scores!',
  },
];