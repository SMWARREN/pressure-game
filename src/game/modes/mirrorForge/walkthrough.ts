// PRESSURE - Mirror Forge Mode Walkthrough
// Symmetry puzzle tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const MIRROR_FORGE_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'mirror_forge',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Mirror Forge!',
      instruction: 'Create symmetry! What you do on one side is mirrored on the other.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'mirror',
      title: 'Mirror Effect',
      instruction: 'When you rotate a tile, its mirror counterpart also rotates. Plan ahead!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'connect',
      title: 'Connect Both Sides',
      instruction: 'Connect all goal nodes on both sides of the mirror to win!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
