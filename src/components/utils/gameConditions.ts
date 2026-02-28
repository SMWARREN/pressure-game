/**
 * Game condition utilities
 * Logic for determining game states and outcomes
 */

export interface WinConditionParams {
  moves: number;
  score?: number;
  targetScore?: number;
  maxMoves?: number;
  timeLeft?: number;
}

/**
 * Determine if win conditions have been met
 */
export function checkReachedTarget(params: WinConditionParams): boolean {
  const { score, targetScore } = params;
  if (targetScore === undefined || score === undefined) return false;
  return score >= targetScore;
}

/**
 * Check if out of moves in move-limited modes
 */
export function checkOutOfTaps(params: WinConditionParams): boolean {
  const { moves, maxMoves } = params;
  if (maxMoves === undefined || maxMoves <= 0) return false;
  return moves >= maxMoves;
}

/**
 * Check if time is up in timed modes
 */
export function checkOutOfTime(timeLeft?: number): boolean {
  if (timeLeft === undefined) return false;
  return timeLeft <= 0;
}

/**
 * Generate win title based on game mode
 */
export function getWinTitle(targetScore?: number, maxMoves?: number): string {
  if (targetScore !== undefined) return 'TARGET REACHED';
  if (maxMoves !== undefined) return 'MOVES CLEARED';
  return 'CONNECTED';
}

/**
 * Generate loss title based on reason
 */
export function getLossTitle(reason?: string): string {
  if (reason === 'crushed') return 'CRUSHED';
  if (reason === 'outOfMoves') return 'OUT OF MOVES';
  if (reason === 'outOfTime') return 'TIME UP';
  return 'LOST';
}
