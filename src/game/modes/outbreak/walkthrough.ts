// PRESSURE - Outbreak Mode Walkthrough
// Virus containment puzzle tutorial.

import { WalkthroughConfig } from '../../../components/WalkthroughOverlay';

export const OUTBREAK_WALKTHROUGH: WalkthroughConfig = {
  modeId: 'outbreak',
  levelId: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Outbreak Mode!',
      instruction: 'A virus is spreading! Contain the outbreak by surrounding infected cells.',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'infected',
      title: 'Infected Cells',
      instruction: 'The red cells are infected. They will spread if not contained!',
      position: 'center',
      advanceOn: 'manual',
    },
    {
      id: 'contain',
      title: 'Build Barriers',
      instruction:
        'Rotate the pipe tiles to create barriers around the infected cells. Stop the spread!',
      position: 'center',
      advanceOn: 'manual',
    },
  ],
};
