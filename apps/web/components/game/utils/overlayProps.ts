/**
 * Overlay properties computation
 * Pure functions for win/loss overlay display logic
 */

import type { GameModeConfig } from '@/game/modes/types';

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
function computeOverlayProps(context: OverlayPropsContext): {
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

  // Always show moves + score (if any) + time
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
  const parts: string[] = [`${moves} move${moves === 1 ? '' : 's'}`];
  if (score > 0) parts.push(`${score} pts`);
  if (elapsedSeconds > 0) parts.push(timeStr);
  const statsText = parts.join(' · ');

  return { reachedTarget, outOfTaps, winTitle, lossTitle, statsText };
}

export { computeOverlayProps, type OverlayPropsContext };
