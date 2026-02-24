// PRESSURE - Shopping Spree Mode Walkthrough
// Price matching puzzle tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const SHOPPING_SPREE_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'shopping_spree',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Shopping Spree!',
      instruction: "Match items with their prices! It's like a shopping memory game.",
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'items',
      title: 'Items & Prices',
      instruction: 'Some tiles show items, others show prices. Find matching pairs!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'match',
      title: 'Make Matches',
      instruction: 'Tap groups of tiles that match (same item type or same price) to clear them.',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
