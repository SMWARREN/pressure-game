// GEM BLAST MODE — Tutorial Steps

import type { TutorialStep } from '../types';

export const GEM_BLAST_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '💎',
    iconColor: '#06b6d4',
    title: 'Tap Matching Gems',
    subtitle: 'Clear groups to score',
    demo: 'gemblast-tap',
    body: 'Tap a connected group of 2+ matching gems to clear them. Bigger groups score exponentially more!',
  },
  {
    icon: '✨',
    iconColor: '#8b5cf6',
    title: 'Cascade Chains',
    subtitle: 'Chain reactions',
    demo: 'gemblast-cascade',
    body: 'When gems fall, new groups may form and AUTO-CLEAR with a cascade multiplier. Chain reactions can stack up to ×5!',
  },
  {
    icon: '💥',
    iconColor: '#f97316',
    title: 'Blast Gems',
    subtitle: 'Detonate colors',
    demo: 'gemblast-blast',
    body: 'Blast gems detonate an entire random color when matched! Use them to trigger massive chain reactions.',
  },
  {
    icon: '🎯',
    iconColor: '#10b981',
    title: 'Hit the Target',
    subtitle: 'Win the level',
    demo: 'gemblast-ready',
    body: 'Reach the target score before running out of moves (or time in later worlds). Plan your taps for maximum cascades!',
  },
];