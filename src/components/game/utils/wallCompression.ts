/**
 * Wall compression utilities
 * Pure functions for wall status display
 */

/**
 * Get wall compression status label
 */
function getWallCompressionLabel(percent: number, active: boolean): string {
  if (!active) return 'WAITING';
  if (percent > 66) return '⚠ CRITICAL';
  if (percent > 33) return 'WARNING';
  return 'ACTIVE';
}

/**
 * Get wall compression color based on percentage
 */
function getWallCompressionColor(percent: number): string {
  if (percent > 66) return '#ef4444';
  if (percent > 33) return '#f59e0b';
  return '#22c55e';
}

/**
 * Compute compression percentage
 */
function computeCompressionPercent(wallOffset: number, gridSize: number): number {
  const maxOff = Math.floor(gridSize / 2);
  return Math.round((wallOffset / maxOff) * 100);
}

export { getWallCompressionLabel, getWallCompressionColor, computeCompressionPercent };
