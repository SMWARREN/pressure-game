import { useEffect } from 'react';
import type { GameStatus } from '@/game/types';

/**
 * Pauses the game when a condition is truthy and status is 'playing'.
 * Automatically resumes when condition becomes falsy.
 */
export function usePauseOnCondition(
  condition: unknown,
  status: GameStatus,
  pauseGame: () => void,
  resumeGame: () => void,
) {
  useEffect(() => {
    if (condition && status === 'playing') {
      pauseGame();
    }
    return () => {
      if (condition && status === 'playing') {
        resumeGame();
      }
    };
  }, [condition, status, pauseGame, resumeGame]);
}
