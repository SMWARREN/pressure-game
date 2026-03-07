// PRESSURE - Quantum Chain Mode Walkthrough
// Math chain puzzle tutorial.

import { WalkthroughConfig } from '../walkthroughTypes';

export const QUANTUM_CHAIN_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'quantum_chain',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Quantum Chain!',
      instruction: 'Build a chain of numbers that adds up to the target! Use math to win.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'numbers',
      title: 'Number Tiles',
      instruction: 'Each tile shows a number. Tap tiles to add them to your chain.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'operators',
      title: 'Operators',
      instruction: 'Some tiles have operators (+, -, ×, ÷). Use them to modify your running total.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'target',
      title: 'Hit the Target',
      instruction: 'Build a chain that equals the target number to win!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
