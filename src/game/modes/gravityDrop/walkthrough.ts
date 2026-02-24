// PRESSURE - Gravity Drop Mode Walkthrough
// Physics-based puzzle tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const GRAVITY_DROP_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'gravity_drop',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Gravity Drop!',
      instruction: 'Use gravity to your advantage! Drop and rotate pieces to build paths.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'drop',
      title: 'Drop Pieces',
      instruction: 'Pieces fall from above. Tap to rotate them as they fall!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'chain',
      title: 'Chain Reactions',
      instruction:
        'Create chain reactions by connecting multiple pieces. Longer chains = more points!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
