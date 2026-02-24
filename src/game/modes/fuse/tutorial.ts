// PRESSURE - Fuse Mode Tutorial Steps

import { TutorialStep } from '../types';

export const FUSE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '💣',
    iconColor: '#f97316',
    title: 'Plant the Bombs',
    subtitle: 'PHASE 1',
    demo: 'fuse-plant',
    body: 'Tap regular tiles to arm them with bombs 💣. You have limited fuses, so plan your path carefully!',
  },
  {
    icon: '⚡',
    iconColor: '#facc15',
    title: 'Chain Reaction',
    subtitle: 'PHASE 2',
    demo: 'fuse-chain',
    body: 'Tap the detonator ⚡ to start the explosion! It spreads through armed tiles, creating a chain reaction.',
  },
  {
    icon: '🎯',
    iconColor: '#60a5fa',
    title: 'Hit All Relays',
    subtitle: 'WIN CONDITION',
    demo: 'fuse-relay',
    body: 'Relay tiles 🎯 are your targets. The explosion must reach ALL of them to win. They conduct automatically!',
  },
  {
    icon: '💥',
    iconColor: '#fb923c',
    title: 'Watch It Burn',
    subtitle: 'CHAIN CASCADE',
    demo: 'fuse-detonate',
    body: 'The explosion spreads one tile per second. Watch your chain cascade through the grid! Blockers ◼ stop the blast.',
  },
  {
    icon: '🔥',
    iconColor: '#ef4444',
    title: 'Ready!',
    subtitle: "LET'S GO",
    demo: 'fuse-ready',
    body: "Arm your path, hit the detonator, and watch the fireworks! Don't let the chain fizzle out before reaching all relays.",
  },
];
