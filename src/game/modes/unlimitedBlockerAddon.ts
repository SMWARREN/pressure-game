// Shared addon for Candy + Shopping Spree unlimited modes
// Centralizes blocker (ice/thief) spawning logic to avoid duplication

import { Level } from '@/game/types';

/**
 * Blocker spawning for moderate intensity (replaces nested ternary)
 */
function getModerateBlockerCount(timeLeft: number): number {
  if (timeLeft < 5) return 2;
  if (timeLeft < 10) return 2;
  if (timeLeft < 15) return 1;
  return 0;
}

/**
 * Blocker spawning for aggressive intensity (replaces nested ternary)
 */
function getAggressiveBlockerCount(timeLeft: number): number {
  if (timeLeft < 5) return 3;
  if (timeLeft < 10) return 2;
  if (timeLeft < 20) return 1;
  return 0;
}

/**
 * How many blockers to spawn based on intensity + time remaining.
 * Used for both ice cubes (Candy) and thieves (Shopping Spree).
 */
export function getBlockerCount(features: Level['features'], timeLeft: number): number {
  const intensity = features?.blockerIntensity ?? 0;
  if (intensity === 0) return 0;

  if (intensity === 1) {
    // Moderate: progressive spawning in the final seconds
    return getModerateBlockerCount(timeLeft);
  }

  // intensity === 2 (aggressive)
  return getAggressiveBlockerCount(timeLeft);
}

/**
 * Min group size needed to earn a time bonus.
 * Allows difficulty tuning without hardcoding logic per level.
 */
export function getMinGroupForTime(features: Level['features']): number {
  return features?.minGroupForTime ?? 3;
}
