/**
 * Board dimension calculations
 * Pure functions for computing board size and layout
 */

/**
 * Compute grid-based dimensions (gap and padding)
 */
function computeGridDimensions(maxDim: number): {
  gap: number;
  padding: number;
} {
  if (maxDim >= 9) {
    return { gap: 2, padding: 4 };
  }
  if (maxDim > 5) {
    return { gap: 3, padding: 8 };
  }
  return { gap: 4, padding: 10 };
}

/**
 * Compute board dimensions (tile size, board width/height)
 */
function computeBoardDimensions(
  vw: number,
  vh: number,
  gridCols: number,
  gridRows: number,
  hasFeatures: boolean
): {
  tileSize: number;
  boardWidth: number;
  boardHeight: number;
  gap: number;
  padding: number;
} {
  const maxDim = Math.max(gridCols, gridRows);
  const { gap, padding } = computeGridDimensions(maxDim);

  const reserved = hasFeatures ? 224 : 200;
  // Use 90% viewport width with safe margins - ensure board never exceeds viewport
  const viewportSafeWidth = vw * 0.9;
  const maxAvailW = Math.min(viewportSafeWidth, 440);
  const maxAvailH = Math.max(vh - reserved, 160);

  const tileSizeByW = Math.floor((maxAvailW - padding * 2 - gap * (gridCols - 1)) / gridCols);
  const tileSizeByH = Math.floor((maxAvailH - padding * 2 - gap * (gridRows - 1)) / gridRows);
  const tileSize = Math.max(1, Math.min(tileSizeByW, tileSizeByH));

  const boardWidth = tileSize * gridCols + padding * 2 + gap * (gridCols - 1);
  const boardHeight = tileSize * gridRows + padding * 2 + gap * (gridRows - 1);

  // Safety check: ensure board width never exceeds 90% of viewport
  const constrainedBoardWidth = Math.min(boardWidth, vw * 0.9);

  return { tileSize, boardWidth: constrainedBoardWidth, boardHeight, gap, padding };
}

export { computeBoardDimensions, computeGridDimensions };
