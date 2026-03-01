/**
 * Consolidated Tile Layout Calculations
 *
 * Centralizes responsive tile sizing, gap, and padding calculations.
 * Reduces parameter count in functions dealing with grid layout.
 * Consolidates logic from GameBoard, GameGrid, and sample grids.
 */

export interface TileLayoutContext {
  viewportWidth: number;
  viewportHeight: number;
  gridSize: number;
  gridCols?: number;
  gridRows?: number;
  animationsEnabled?: boolean;
}

/**
 * Calculate the tile size (in pixels) based on viewport and grid dimensions.
 * Uses responsive design: fills ~97% of viewport width, capped at 460px.
 */
export function calculateTileSize(ctx: TileLayoutContext): number {
  const { viewportWidth, gridSize, gridCols } = ctx;
  const cols = gridCols ?? gridSize;
  const maxByWidth = Math.min(viewportWidth * 0.97, 460);
  return Math.floor(maxByWidth / cols);
}

/**
 * Calculate gap between tiles (in pixels) based on grid size.
 * Larger grids use smaller gaps for better visual density.
 */
export function calculateGap(gridSize: number): number {
  if (gridSize >= 9) return 2;
  if (gridSize > 5) return 3;
  return 4;
}

/**
 * Calculate padding around the grid (in pixels) based on grid size.
 * Larger grids use smaller padding to maximize playable area.
 */
export function calculatePadding(gridSize: number): number {
  if (gridSize >= 9) return 4;
  if (gridSize > 5) return 8;
  return 10;
}

/**
 * Calculate total board dimensions given a context and tile size.
 * Useful for positioning overlays or centered elements.
 */
export function calculateBoardDimensions(ctx: TileLayoutContext, tileSize: number) {
  const cols = ctx.gridCols ?? ctx.gridSize;
  const rows = ctx.gridRows ?? ctx.gridSize;
  const gap = calculateGap(ctx.gridSize);
  const padding = calculatePadding(ctx.gridSize);

  const boardWidth = cols * tileSize + (cols - 1) * gap + 2 * padding;
  const boardHeight = rows * tileSize + (rows - 1) * gap + 2 * padding;

  return { boardWidth, boardHeight };
}

/**
 * Get all layout measurements in one call for convenience.
 * Returns an object with tileSize, gap, padding, and board dimensions.
 */
export function getLayoutMeasurements(ctx: TileLayoutContext) {
  const tileSize = calculateTileSize(ctx);
  const gap = calculateGap(ctx.gridSize);
  const padding = calculatePadding(ctx.gridSize);
  const boardDimensions = calculateBoardDimensions(ctx, tileSize);

  return {
    tileSize,
    gap,
    padding,
    ...boardDimensions,
  };
}
