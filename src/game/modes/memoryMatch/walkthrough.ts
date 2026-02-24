// PRESSURE - Memory Match Mode Walkthrough
// Memory card game tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const MEMORY_MATCH_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'memory_match',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Memory Match!',
      instruction: 'Test your memory! Flip tiles to find matching pairs.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'flip',
      title: 'Flip Tiles',
      instruction: "Tap a tile to reveal what's underneath. Remember what you see!",
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'pairs',
      title: 'Find Pairs',
      instruction: 'Find two tiles with the same symbol to make a match. Match all pairs to win!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'combo',
      title: 'Build Combos',
      instruction: 'Find multiple matches in a row to build combos and earn bonus points!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
