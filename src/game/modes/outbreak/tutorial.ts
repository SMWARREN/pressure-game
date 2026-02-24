// PRESSURE - Outbreak Mode Tutorial Steps

import { TutorialStep } from '../types';

export const OUTBREAK_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🦠',
    iconColor: '#06b6d4',
    title: 'Spread the Infection',
    subtitle: 'YOUR GOAL',
    demo: 'outbreak-start',
    body: 'Start from your corner and infect the entire grid! Tap adjacent colors to spread.',
  },
  {
    icon: '🔢',
    iconColor: '#f97316',
    title: 'Frontier Numbers',
    subtitle: 'TAP TO CAPTURE',
    demo: 'outbreak-frontier',
    body: "Numbers show how many cells you'll capture. Bigger groups = more territory!",
  },
  {
    icon: '🎨',
    iconColor: '#06b6d4',
    title: 'Tile States',
    subtitle: 'KNOW THE BOARD',
    demo: 'outbreak-colors',
    body: 'Owned tiles show ☣️. Tappable tiles glow with numbers. Blocked tiles are dim.',
  },
  {
    icon: '🧟',
    iconColor: '#ff6b6b',
    title: 'Know the Strains',
    subtitle: 'ZOMBIE TYPES',
    demo: 'outbreak-ready',
    body: 'Each color is a different zombie strain:\n\n🧟 Coral Red — classic walker\n🧟‍♂️ Vivid Green — male zombie\n🧟‍♀️ Sky Blue — female zombie\n💀 Bright Yellow — skull\n🫀 Pink Violet — infected organ\n\nPlan your path by watching the strain icons!',
  },
];
