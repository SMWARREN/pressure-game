// GEM BLAST MODE — Walkthrough Configuration

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const GEM_BLAST_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'gemBlast',
  levelId: 401,
  steps: [
    {
      id: 'welcome',
      title: 'Gem Blast!',
      instruction: 'Welcome to Gem Blast! Clear gems by tapping connected groups of 2 or more.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'tap-group',
      title: 'Tap Groups',
      instruction: 'Tap a group of matching gems to clear them and score points. Bigger groups = more points!',
      position: 'center',
      advanceOn: 'tap',
    },
    {
      id: 'cascade',
      title: 'Cascade Chains',
      instruction: 'When gems fall, new groups may form and AUTO-CLEAR with a cascade multiplier. Chain reactions can stack up to ×5!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'target',
      title: 'Hit the Target',
      instruction: 'Reach the target score before running out of moves (or time in later worlds). Plan your taps for maximum cascades!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};