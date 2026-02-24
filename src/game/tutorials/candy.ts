// PRESSURE - Candy Mode Tutorial

import { TutorialStep } from '../modes/types';

export const CANDY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🍎',
    iconColor: '#ef4444',
    title: 'Tap to Clear',
    subtitle: 'YOUR MOVE',
    demo: 'candy-group',
    body: 'Tap any candy — every touching tile of the same color explodes away instantly.\n\nYou need at least 2 connected same-color candies. A lone candy? Nothing happens.',
  },
  {
    icon: '✦',
    iconColor: '#f472b6',
    title: 'Go Big or Go Home',
    subtitle: 'SCORING',
    demo: 'candy-score',
    body: 'Score = group size² × 5. Five candies = 125 pts. Ten candies = 500 pts!\n\nSmall clears barely move the needle. Hunt for the biggest clusters you can find.',
  },
  {
    icon: '⬇',
    iconColor: '#a5b4fc',
    title: 'Candies Fall Down',
    subtitle: 'AFTER EACH CLEAR',
    demo: 'candy-gravity',
    body: 'Clear a group and everything above drops to fill the gap. Fresh candies rain in from the top.\n\nThink ahead — one smart clear can set up a monster combo on the next tap.',
  },
  {
    icon: '🍬',
    iconColor: '#f472b6',
    title: 'Beat the Clock',
    subtitle: "LET'S PLAY",
    demo: 'candy-ready',
    body: 'Hit the target score before your taps run out. In later worlds, frozen 🧊 tiles will spread — clear groups fast before the board ices over!\n\nGood luck!',
  },
];
