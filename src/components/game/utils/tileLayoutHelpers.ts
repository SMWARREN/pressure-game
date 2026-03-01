/**
 * Tile layout and sizing utilities
 * Pure functions for computing dimensions and spacing
 */

/**
 * Get symbol size based on game mode and tile size
 */
function getSymbolSize(
  isOutbreak: boolean,
  tileSize: number,
  obOwned: boolean,
  obFrontier: boolean
): string {
  if (!isOutbreak) return '1.2rem';
  if (obOwned) {
    if (tileSize <= 36) return '0.6rem';
    if (tileSize <= 48) return '0.72rem';
    return '0.9rem';
  }
  if (obFrontier) {
    if (tileSize <= 36) return '0.65rem';
    if (tileSize <= 48) return '0.78rem';
    return '0.95rem';
  }
  if (tileSize <= 36) return '0.62rem';
  if (tileSize <= 48) return '0.75rem';
  return '0.9rem';
}

/**
 * Get gap value based on grid size
 */
function getGapValue(gridSize: number): number {
  if (gridSize >= 9) return 2;
  if (gridSize > 5) return 3;
  return 4;
}

/**
 * Get padding value based on grid size
 */
function getPaddingValue(gridSize: number): number {
  if (gridSize >= 9) return 4;
  if (gridSize > 5) return 8;
  return 10;
}

/**
 * Calculate tile size for a given viewport and grid
 * Used by ReplayOverlay, LevelEditor, etc. for responsive grids
 */
function calculateTileSize(
  viewportWidth: number,
  gridSize: number,
  maxWidth: number = 460,
  margin: number = 0
): number {
  const gap = getGapValue(gridSize);
  const available = Math.min(viewportWidth * 0.9, maxWidth) - gap * (gridSize - 1) - margin;
  return Math.floor(available / gridSize);
}

/**
 * Calculate total board width (tiles + gaps + padding)
 */
function calculateBoardWidth(
  tileSize: number,
  gridSize: number,
  padding: number = 0
): number {
  const gap = getGapValue(gridSize);
  return tileSize * gridSize + gap * (gridSize - 1) + padding * 2;
}

export {
  getSymbolSize,
  getGapValue,
  getPaddingValue,
  calculateTileSize,
  calculateBoardWidth,
};
