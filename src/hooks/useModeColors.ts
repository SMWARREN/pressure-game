/**
 * Hook for components to access the current mode's color context.
 * Views are completely dumb - they just ask for colors, they don't know where they come from.
 */

import { useMemo } from 'react';
import { useGameStore } from '@/game/store';
import { getModeById } from '@/game/modes';
import { ModeColorContext } from '@/game/modes/types';

/**
 * Get the current mode's color context.
 * Returns the colors for whatever mode is currently active.
 * Views use this and never look at global constants.
 */
export function useModeColors(): ModeColorContext {
  const currentModeId = useGameStore((s) => s.currentModeId);

  return useMemo(() => {
    if (!currentModeId) {
      // Fallback if no mode is active
      return getModeById('classic').getColorContext();
    }

    const mode = getModeById(currentModeId);
    return mode.getColorContext();
  }, [currentModeId]);
}

/**
 * Get colors for a specific mode (not the current one).
 * Useful for UI that shows multiple modes (like mode selector).
 */
export function useModeColorsByMode(modeId: string): ModeColorContext {
  return useMemo(() => {
    const mode = getModeById(modeId);
    return mode.getColorContext();
  }, [modeId]);
}
