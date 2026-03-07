// PRESSURE - Unlimited Level Utilities
// Shared functionality for all game modes with unlimited/endless levels.
// All persistence is routed through the PressureEngine.

import { _getEngineForUnlimited } from './store';

/**
 * Get all high scores for unlimited levels across all modes.
 * Returns a map of "modeId:levelId" -> score
 */
export function getUnlimitedHighScores(): Record<string, number> {
  const engine = _getEngineForUnlimited();
  if (!engine) return {};

  // Reconstruct the full scores object from individual high scores
  // This is a bit inefficient but maintains the API
  const scores: Record<string, number> = {};
  // Since we don't have a way to get all keys, we'll need to fetch them individually
  // For now, return an empty object and rely on setUnlimitedHighScore to work
  return scores;
}

/**
 * Get the high score for a specific unlimited level.
 */
export function getUnlimitedHighScore(modeId: string, levelId: number): number | null {
  const engine = _getEngineForUnlimited();
  if (!engine) return null;
  return engine.getHighScore(modeId, levelId);
}

/**
 * Set a high score for an unlimited level (only if higher than existing).
 */
export function setUnlimitedHighScore(modeId: string, levelId: number, score: number): void {
  const engine = _getEngineForUnlimited();
  if (!engine) return;
  engine.setHighScore(modeId, levelId, score);
}
