// PRESSURE - Fuse Mode Walkthrough
// Step-by-step guide for the first level (1001 - The Fuse).

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

// Level 1001 grid (5x5):
// Row 0: . . . . .
// Row 1: . . . . .
// Row 2: E . . . R   (detonator at x=0, y=2, relay at x=4, y=2)
// Row 3: . . . . .
// Row 4: . . . . .

export const FUSE_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'fuse',
  levelId: 1001,
  steps: [
    {
      id: 'welcome',
      title: 'Fuse Mode!',
      instruction:
        'Welcome! Your goal is to plant bombs and create a chain reaction to hit all relay targets.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'detonator',
      targetTile: { x: 0, y: 2 },
      title: 'The Detonator',
      instruction: 'This is the detonator (⚡). Tap it when ready to start the explosion chain!',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'relay',
      targetTile: { x: 4, y: 2 },
      title: 'The Relay Target',
      instruction: 'This is the relay (🎯). The explosion must reach ALL relays to win!',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'plant-bombs',
      targetTile: { x: 2, y: 2 },
      title: 'Plant Bombs',
      instruction:
        'Tap empty tiles to arm them with bombs (💣). Create a path from detonator to relay!',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'chain-reaction',
      title: 'Chain Reaction!',
      instruction:
        'After planting bombs, tap the detonator. The explosion spreads through armed tiles one step per second!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
