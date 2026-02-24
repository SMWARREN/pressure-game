// PRESSURE - Candy Mode Tutorial Steps

import { TutorialStep } from '../types';

export const CANDY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🍬',
    iconColor: '#f472b6',
    title: 'Match & Clear',
    subtitle: 'YOUR GOAL',
    demo: 'candy-group',
    body: 'Tap groups of 2+ same-colored candies to clear them. Bigger groups = more points!',
  },
  {
    icon: '📊',
    iconColor: '#ef4444',
    title: 'Scoring',
    subtitle: 'BIGGER IS BETTER',
    demo: 'candy-score',
    body: 'Score = tiles² × 5. A group of 2 scores 20 pts. A group of 5 scores 125 pts!',
  },
  {
    icon: '⬇️',
    iconColor: '#a5b4fc',
    title: 'Gravity',
    subtitle: 'TILES FALL',
    demo: 'candy-gravity',
    body: 'When you clear candies, the ones above fall down and new candies appear at the top.',
  },
  {
    icon: '🎯',
    iconColor: '#f472b6',
    title: 'Target Score',
    subtitle: 'REACH THE GOAL',
    demo: 'candy-ready',
    body: 'Each level has a target score. Reach it before running out of taps to win!',
  },
];
