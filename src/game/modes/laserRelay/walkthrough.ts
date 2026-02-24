// PRESSURE - Laser Relay Mode Walkthrough
// Step-by-step guide for the first level (801 - First Light).

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

// Level 801 grid (5x5):
// Row 0: . . T . .   (target at x=2, y=0)
// Row 1: . . . . .
// Row 2: S . ? . .   (source at x=0, y=2, mirror at x=2, y=2)
// Row 3: . . . . .
// Row 4: . . . . .

export const LASER_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'laserRelay',
  levelId: 801,
  steps: [
    {
      id: 'welcome',
      title: 'Laser Relay!',
      instruction:
        'Welcome! Your goal is to guide the laser beam from the green source to the red target using mirrors.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'source',
      targetTile: { x: 0, y: 2 },
      title: 'The Source',
      instruction: 'This green tile is the laser source. It shoots a beam to the right (▶).',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'target',
      targetTile: { x: 2, y: 0 },
      title: 'The Target',
      instruction: 'This red tile is the target. You need to bounce the beam here to win!',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'mirror',
      targetTile: { x: 2, y: 2 },
      title: 'Rotate the Mirror',
      instruction:
        'This mirror is currently ╲. Tap it to rotate to ╱ and bounce the beam UP to the target!',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'try-it',
      targetTile: { x: 2, y: 2 },
      title: 'Your Turn!',
      instruction: 'Tap the mirror to rotate it. Watch the beam bounce to the target!',
      position: 'bottom',
      advanceOn: 'tap',
    },
  ],
};
