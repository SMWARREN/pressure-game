// PRESSURE - Classic Mode Walkthrough
// Step-by-step guide for the first level.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const CLASSIC_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'classic',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome!',
      instruction:
        "Let's learn how to play! This is a pipe puzzle - your goal is to connect all the green goal nodes.",
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'goal-nodes',
      targetTile: { x: 1, y: 2 },
      title: 'Goal Nodes',
      instruction:
        'These glowing green tiles are goal nodes. You need to connect them all with pipes to win.',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'second-goal',
      targetTile: { x: 3, y: 2 },
      title: 'Second Goal',
      instruction: "Here's the other goal node. We need to connect these two together.",
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'rotatable-tile',
      targetTile: { x: 2, y: 2 },
      title: 'Tap to Rotate',
      instruction:
        'This pipe can be rotated! Tap it to spin 90° clockwise. Try to line up the pipe openings.',
      position: 'bottom',
      advanceOn: 'manual',
    },
    {
      id: 'try-rotating',
      targetTile: { x: 2, y: 2 },
      title: 'Rotate the Pipe',
      instruction: 'Tap this tile now! Rotate it until it connects both goal nodes horizontally.',
      position: 'bottom',
      advanceOn: 'tap',
    },
    {
      id: 'complete',
      title: 'You Got It!',
      instruction:
        'When all nodes are connected, you win! Now press START and try it yourself - connect the nodes to complete the level.',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
