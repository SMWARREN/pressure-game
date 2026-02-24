// PRESSURE - Unlimited Level Utilities
// Shared functionality for all game modes with unlimited/endless levels.

const HIGH_SCORE_KEY = 'pressure_unlimited_highscores';

/**
 * Get all high scores for unlimited levels across all modes.
 * Returns a map of "modeId:levelId" -> score
 */
export function getUnlimitedHighScores(): Record<string, number> {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Get the high score for a specific unlimited level.
 */
export function getUnlimitedHighScore(modeId: string, levelId: number): number | null {
  const scores = getUnlimitedHighScores();
  const key = `${modeId}:${levelId}`;
  return scores[key] ?? null;
}

/**
 * Set a high score for an unlimited level (only if higher than existing).
 */
export function setUnlimitedHighScore(modeId: string, levelId: number, score: number): void {
  const scores = getUnlimitedHighScores();
  const key = `${modeId}:${levelId}`;
  if (!scores[key] || score > scores[key]) {
    scores[key] = score;
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
  }
}
