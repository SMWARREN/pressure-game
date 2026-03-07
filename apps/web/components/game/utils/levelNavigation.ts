/**
 * Level navigation utilities
 * Pure functions for level sequencing and display
 */

import type { Level } from '@/game/types';

/**
 * Compute time strings for display
 */
function computeTimeStrings(
  elapsedSeconds: number,
  timeLimit?: number
): {
  timeStr: string;
  timeLeft?: number;
} {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeStr = `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')}`;
  const timeLeft = timeLimit ? Math.max(0, timeLimit - elapsedSeconds) : undefined;

  return { timeStr, timeLeft };
}

/**
 * Compute level navigation (next level)
 */
function computeLevelNavigation(
  modeLevels: Level[],
  generatedLevels: Level[],
  currentLevelId: number
): {
  allLevels: Level[];
  currentIndex: number;
  nextLevel: Level | null;
} {
  const isInModeLevels = modeLevels.some((l) => l.id === currentLevelId);
  const allLevels = isInModeLevels ? [...modeLevels, ...generatedLevels] : generatedLevels;
  const currentIndex = allLevels.findIndex((l) => l.id === currentLevelId);
  const nextLevel =
    currentIndex >= 0 && currentIndex < allLevels.length - 1 ? allLevels[currentIndex + 1] : null;

  return { allLevels, currentIndex, nextLevel };
}

/**
 * Compute level display number (1-based position in mode's level list)
 */
function computeLevelDisplayNum(modeLevels: Level[], currentLevelId: number): number {
  return modeLevels.findIndex((l) => l.id === currentLevelId) + 1;
}

export { computeTimeStrings, computeLevelNavigation, computeLevelDisplayNum };
