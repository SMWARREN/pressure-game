// Shared addon for Candy + Shopping Spree unlimited modes
// Centralizes blocker (ice/thief) spawning logic to avoid duplication

import { Level } from '@/game/types';

/**
 * How many blockers to spawn based on intensity + time remaining.
 * Used for both ice cubes (Candy) and thieves (Shopping Spree).
 */
export function getBlockerCount(features: Level['features'], timeLeft: number): number {
  const intensity = features?.blockerIntensity ?? 0;
  if (intensity === 0) return 0;

  if (intensity === 1) {
    // Moderate: progressive spawning in the final seconds
    return timeLeft < 5 ? 2 : timeLeft < 10 ? 2 : timeLeft < 15 ? 1 : 0;
  }

  // intensity === 2 (aggressive)
  return timeLeft < 5 ? 3 : timeLeft < 10 ? 2 : timeLeft < 20 ? 1 : 0;
}

/**
 * Min group size needed to earn a time bonus.
 * Allows difficulty tuning without hardcoding logic per level.
 */
export function getMinGroupForTime(features: Level['features']): number {
  return features?.minGroupForTime ?? 3;
}
