/**
 * Overlay utility functions
 * Extracted to reduce cognitive complexity and nested ternaries
 */

/**
 * Format elapsed time string for display
 */
export function formatElapsedTime(elapsedSeconds: number): string {
  if (elapsedSeconds <= 0) return '';

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeStr = `${String(secs).padStart(2, '0')}s`;

  if (mins > 0) {
    return `${mins}:${timeStr}`;
  }
  return timeStr;
}

/**
 * Format moves/taps display string
 */
export function formatMovesTaps(moves: number, isTaps: boolean): string {
  const unit = isTaps ? 'tap' : 'move';
  const plural = moves === 1 ? '' : 's';
  return `${moves} ${unit}${plural}`;
}

/**
 * Format score stats for win overlay
 */
export function formatWinStats(
  isScoreMode: boolean,
  finalScore: number | undefined,
  moves: number,
  timeStr: string
): string {
  if (isScoreMode) {
    return `${finalScore ?? 0} pts · ${formatMovesTaps(moves, true)}`;
  }
  const movesText = formatMovesTaps(moves, false);
  if (timeStr) {
    return `${movesText} · ${timeStr}`;
  }
  return movesText;
}

/**
 * Format level record string (wins · attempts)
 */
export function formatLevelRecord(wins: number, attempts: number): string {
  const winsText = `${wins} win${wins === 1 ? '' : 's'}`;
  const attemptsText = `${attempts} attempt${attempts === 1 ? '' : 's'}`;
  return `${winsText} · ${attemptsText}`;
}

/**
 * Format loss stats based on mode type
 */
export function formatLossStats(isScoreMode: boolean, moves: number): string {
  if (isScoreMode) {
    return `${formatMovesTaps(moves, true)}`;
  }
  return `${formatMovesTaps(moves, false)}`;
}
