import { TutorialStep } from '../types';

export const GRAVITY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🔢',
    iconColor: '#38bdf8',
    title: 'Falling Numbers',
    subtitle: 'GRAVITY DROP',
    demo: 'gravity-board',
    body: "Numbered tiles (1–6) fill the grid from the top. New tiles fall every time you commit a chain. Don't let the board overflow!",
  },
  {
    icon: '🔗',
    iconColor: '#818cf8',
    title: 'Chain to Ten',
    subtitle: 'TAP ADJACENT TILES',
    demo: 'gravity-chain',
    body: 'Tap one tile to start, then tap neighbors to extend the chain. Your goal: make the chain sum equal exactly 10 — then double-tap to commit!',
  },
  {
    icon: '💥',
    iconColor: '#f472b6',
    title: 'Commit or Cancel',
    subtitle: 'DOUBLE-TAP TO CLEAR',
    demo: 'gravity-commit',
    body: 'When your chain sums to exactly 10, double-tap the last tile to clear all selected tiles. Tap outside the chain to cancel and start over.',
  },
  {
    icon: '⭐',
    iconColor: '#fbbf24',
    title: 'Special Tiles',
    subtitle: 'WILDCARDS & BOMBS',
    demo: 'gravity-specials',
    body: '⭐ Stars act as any value needed to hit 10. 💣 Bombs clear their entire column instantly. Use them wisely — they fall like any other tile!',
  },
  {
    icon: '🌊',
    iconColor: '#38bdf8',
    title: 'Score & Win',
    subtitle: 'CHAIN FOR BIG POINTS',
    demo: 'gravity-ready',
    body: 'Longer chains score more. Hit your target score before running out of moves. Plan ahead — every tile you drop counts!',
  },
];
