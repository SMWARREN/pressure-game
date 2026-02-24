// PRESSURE - Candy Mode Walkthrough
// Match-3 style gameplay tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const CANDY_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'candy',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Candy Mode!',
      instruction: "Welcome to Candy mode! Instead of pipes, you'll match colorful candies.",
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'match-groups',
      title: 'Match Groups',
      instruction:
        'Tap on groups of 2 or more same-colored candies to clear them. Bigger groups = more points!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'target-score',
      title: 'Target Score',
      instruction: 'Each level has a target score. Reach it before running out of taps to win!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'gravity',
      title: 'Gravity Falls',
      instruction:
        'When you clear candies, the ones above fall down and new candies appear at the top!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
