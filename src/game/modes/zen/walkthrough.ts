// PRESSURE - Zen Mode Walkthrough
// Relaxed, no pressure mode tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const ZEN_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'zen',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Zen Mode',
      instruction:
        "Relax! In Zen mode, there's no time pressure and no walls closing in. Take your time.",
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'no-walls',
      title: 'No Walls',
      instruction:
        'Notice there are no red walls squeezing the board. You can think as long as you want.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'goal',
      title: 'Connect & Enjoy',
      instruction: 'Connect all the green goal nodes by rotating pipes. Tap any tile to rotate it.',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
