// PRESSURE - Blitz Mode Walkthrough
// Fast-paced timed mode tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const BLITZ_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'blitz',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Blitz Mode!',
      instruction: 'In Blitz mode, you race against the clock! Solve puzzles as fast as you can.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'timer',
      title: 'Watch the Timer',
      instruction: "The timer at the bottom shows how long you've been playing. Faster = better!",
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'goal',
      title: 'Same Goal',
      instruction:
        'Connect all the green goal nodes by rotating pipes. Tap a tile to rotate it 90°.',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
