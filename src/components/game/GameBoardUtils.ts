/**
 * Pure utility functions extracted from GameBoard.tsx
 * Reduces cognitive complexity and improves testability
 */

import type { Level } from '@/game/types';
import type { GameModeConfig } from '@/game/modes/types';

/**
 * Get particle burst color for win animation
 */
export function getParticleBurstColor(index: number): string {
  const colors = ['#22c55e', '#a5b4fc', '#fbbf24'];
  return colors[index % 3];
}

/**
 * Get particle shape for burst effect
 */
export function getParticleBurstShape(index: number): 'star' | 'circle' {
  return index % 2 === 0 ? 'star' : 'circle';
}

/**
 * Get wall compression status label
 */
export function getWallCompressionLabel(percent: number, active: boolean): string {
  if (!active) return 'WAITING';
  if (percent > 66) return '⚠ CRITICAL';
  if (percent > 33) return 'WARNING';
  return 'ACTIVE';
}

/**
 * Get wall compression color based on percentage
 */
export function getWallCompressionColor(percent: number): string {
  if (percent > 66) return '#ef4444';
  if (percent > 33) return '#f59e0b';
  return '#22c55e';
}

/**
 * Compute grid-based dimensions (gap and padding)
 */
export function computeGridDimensions(maxDim: number): {
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
export function computeBoardDimensions(
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
  const maxAvailW = Math.min(vw * 0.97, 460);
  const maxAvailH = Math.max(vh - reserved, 160);

  const tileSizeByW = Math.floor((maxAvailW - padding * 2 - gap * (gridCols - 1)) / gridCols);
  const tileSizeByH = Math.floor((maxAvailH - padding * 2 - gap * (gridRows - 1)) / gridRows);
  const tileSize = Math.max(1, Math.min(tileSizeByW, tileSizeByH));

  const boardWidth = tileSize * gridCols + padding * 2 + gap * (gridCols - 1);
  const boardHeight = tileSize * gridRows + padding * 2 + gap * (gridRows - 1);

  return { tileSize, boardWidth, boardHeight, gap, padding };
}

/**
 * Compute time strings for display
 */
export function computeTimeStrings(
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
export function computeLevelNavigation(
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
export function computeLevelDisplayNum(modeLevels: Level[], currentLevelId: number): number {
  return modeLevels.findIndex((l) => l.id === currentLevelId) + 1;
}

interface OverlayPropsContext {
  readonly score: number;
  readonly targetScore: number | undefined;
  readonly moves: number;
  readonly maxMoves: number;
  readonly isUnlimited: boolean;
  readonly lossReason: string | null;
  readonly mode: GameModeConfig;
  readonly elapsedSeconds: number;
}

/**
 * Compute overlay properties (titles, button states)
 */
export function computeOverlayProps(context: OverlayPropsContext): {
  reachedTarget: boolean;
  outOfTaps: boolean;
  winTitle: string;
  lossTitle: string;
  statsText: string;
} {
  const { score, targetScore, moves, maxMoves, isUnlimited, lossReason, mode, elapsedSeconds } =
    context;
  const reachedTarget = score >= (targetScore ?? Infinity);
  const outOfTaps = !isUnlimited && moves >= maxMoves && !reachedTarget;
  const winTitle = outOfTaps ? 'OUT OF TAPS' : (mode.overlayText?.win ?? 'CONNECTED');
  const lossTitle = lossReason ?? mode.overlayText?.loss ?? 'CRUSHED';

  // Determine stats text based on mode type
  let statsText = '';
  const hasScore = targetScore !== undefined && targetScore > 0;
  if (hasScore) {
    statsText = `${score} pts · ${moves} taps`;
  } else {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
    statsText = `${moves} moves · ${timeStr}`;
  }

  return { reachedTarget, outOfTaps, winTitle, lossTitle, statsText };
}

/**
 * Compute compression percentage
 */
export function computeCompressionPercent(wallOffset: number, gridSize: number): number {
  const maxOff = Math.floor(gridSize / 2);
  return Math.round((wallOffset / maxOff) * 100);
}
