import { TutorialStep } from '../types';

export const MIRROR_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🪞',
    iconColor: '#a78bfa',
    title: 'The Mirror Grid',
    subtitle: 'MIRROR FORGE',
    demo: 'mirror-grid',
    body: "The board is split in two by an invisible mirror. Every tile on the LEFT has a twin on the RIGHT. They always stay symmetrical — one is the other's reflection.",
  },
  {
    icon: '♾️',
    iconColor: '#34d399',
    title: 'Tap Once, Move Twice',
    subtitle: 'SYNCHRONIZED ROTATION',
    demo: 'mirror-tap',
    body: 'Tap any tile and BOTH it AND its mirror twin rotate simultaneously! The mirror tile spins in the opposite direction to maintain symmetry.',
  },
  {
    icon: '🔗',
    iconColor: '#a78bfa',
    title: 'Connect Across',
    subtitle: 'PIPE THROUGH THE CENTER',
    demo: 'mirror-connect',
    body: 'Route pipes from goal nodes on the left through the center column to goal nodes on the right. Both halves must be fully connected to win!',
  },
  {
    icon: '💡',
    iconColor: '#fbbf24',
    title: 'Plan Symmetrically',
    subtitle: 'THINK IN PAIRS',
    demo: 'mirror-plan',
    body: 'Every move you make on the left affects the right. Use this to your advantage — one clever tap can solve two problems at once!',
  },
  {
    icon: '💎',
    iconColor: '#f472b6',
    title: 'Forge the Path',
    subtitle: 'CONNECT ALL NODES',
    demo: 'mirror-ready',
    body: "Connect all goal nodes before your moves run out. The mirror never lies — master it and you'll solve both sides in half the taps!",
  },
];
