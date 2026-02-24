// PRESSURE - Outbreak Mode Tutorial

import { TutorialStep } from '../modes/types';

export const OUTBREAK_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🦠',
    iconColor: '#06b6d4',
    title: 'You Are The Infection',
    subtitle: 'MISSION BRIEFING',
    demo: 'outbreak-start',
    body: 'You start with one infected cell in the corner.\n\nYour goal: infect EVERY cell on the board before moves run out.',
  },
  {
    icon: '🔢',
    iconColor: '#51cf66',
    title: 'Numbers Are Your Guide',
    subtitle: 'KEY MECHANIC',
    demo: 'outbreak-frontier',
    body: 'Every cell that borders your territory shows a NUMBER.\n\nThat number = how many cells you absorb in one tap. Always chase the biggest number!',
  },
  {
    icon: '🎨',
    iconColor: '#74c0fc',
    title: 'Read the Board',
    subtitle: 'THREE TILE STATES',
    demo: 'outbreak-colors',
    body: 'Each tile shows its state clearly:\n\n• OWNED (vivid fill + ☣️) — your territory\n• TAPPABLE (bright border + number) — absorb now!\n• BLOCKED (dim + emoji) — not reachable yet',
  },
  {
    icon: '🧟',
    iconColor: '#ff6b6b',
    title: 'Know the Strains',
    subtitle: 'ZOMBIE TYPES',
    demo: 'outbreak-ready',
    body: 'Each color is a different zombie strain:\n\n🧟 Coral Red — classic walker\n🧟‍♂️ Vivid Green — male zombie\n🧟‍♀️ Sky Blue — female zombie\n💀 Bright Yellow — skull\n🫀 Pink Violet — infected organ\n\nPlan your path by watching the strain icons!',
  },
  {
    icon: '🗺️',
    iconColor: '#ffd43b',
    title: 'Think Ahead',
    subtitle: 'STRATEGY',
    demo: 'outbreak-ready',
    body: 'Absorbing one group unlocks new groups of other colors.\n\nAvoid tiny single-cell taps — every wasted move could cost you the game!',
  },
];
