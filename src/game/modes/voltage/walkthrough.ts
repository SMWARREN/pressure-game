// PRESSURE - Voltage Mode Walkthrough
// Step-by-step guide for the first level (901 - First Charge).

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

// Level 901: 5x5 grid of regular cells, target score 150, 3 discharges allowed
// All cells start at charge 0 and charge up over time

export const VOLTAGE_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'voltage',
  levelId: 901,
  steps: [
    {
      id: 'welcome',
      title: 'Voltage Mode!',
      instruction:
        'Welcome! Cells charge up over time. Tap anywhere to discharge the entire grid and score points!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'watch-charge',
      title: 'Watch the Charge',
      instruction:
        'Each cell shows its charge level with bars. Watch them fill up from ▁ to ▇ as time passes.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'tap-anywhere',
      targetTile: { x: 2, y: 2 },
      title: 'Tap Anywhere!',
      instruction:
        'Tap ANY tile to discharge ALL cells at once! You score points equal to the total charge.',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'timing',
      title: 'Timing is Key',
      instruction:
        'Wait for higher charges for more points, but dont let any cell reach max (8) or its game over!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'try-it',
      targetTile: { x: 2, y: 2 },
      title: 'Your Turn!',
      instruction: 'Wait a few seconds for cells to charge, then tap anywhere to discharge!',
      position: 'bottom',
      advanceOn: 'tap',
    },
  ],
};
