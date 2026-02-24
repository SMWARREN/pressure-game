import { TutorialStep } from '../types';

export const MEMORY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🧠',
    iconColor: '#818cf8',
    title: 'Hidden Tiles',
    subtitle: 'MEMORY MATCH',
    demo: 'memory-hidden',
    body: 'All tiles start face-down. Every symbol has exactly one twin hiding somewhere on the board. Your job: find them all!',
  },
  {
    icon: '👆',
    iconColor: '#34d399',
    title: 'Flip & Peek',
    subtitle: 'TAP TO REVEAL',
    demo: 'memory-flip',
    body: 'Tap any tile to flip it face-up and see its symbol. Then tap a second tile — if they match, both tiles lock in permanently!',
  },
  {
    icon: '❌',
    iconColor: '#f87171',
    title: 'No Match',
    subtitle: 'REMEMBER WHERE!',
    demo: 'memory-nomatch',
    body: "If the two tiles don't match, they flip back face-down. Remember their positions — you'll need that info on future turns!",
  },
  {
    icon: '🔥',
    iconColor: '#fb923c',
    title: 'Combo Bonus',
    subtitle: 'CHAIN YOUR MATCHES',
    demo: 'memory-combo',
    body: 'Match pairs back-to-back for a combo multiplier! First match = 1×, second consecutive = 2×, third = 3×... up to 5× for big scores!',
  },
  {
    icon: '🏆',
    iconColor: '#fbbf24',
    title: 'Clear the Board',
    subtitle: 'WIN CONDITION',
    demo: 'memory-ready',
    body: 'Match all pairs before you run out of moves to win. Fewer flips = higher score. Good luck — keep those symbols in mind!',
  },
];
