import { useEffect, useState, useCallback, useMemo } from 'react';
import { useStats } from '@/game/contexts';
import type { GameEndEvent } from '@/game/stats/types';
import { getSolution } from '@/game/levels';
import type { Level } from '@/game/types';
import { ReplayEngine } from '@/game/stats/replay';

/**
 * Custom hook to manage solution computation for hint display.
 * Lazily computes solutions only when requested.
 */
export function useSolutionComputation(
  currentLevel: Level | null,
  isPipeMode: boolean,
  editorEnabled: boolean
) {
  const [computedSolution, setComputedSolution] = useState<
    { x: number; y: number; rotations: number }[] | null
  >(null);
  const [isComputingSolution, setIsComputingSolution] = useState(false);

  const computeSolution = useCallback(() => {
    if (!currentLevel || !isPipeMode || editorEnabled || computedSolution !== null || isComputingSolution)
      return;
    setIsComputingSolution(true);
    setTimeout(() => {
      const sol = getSolution(currentLevel);
      setComputedSolution(sol);
      setIsComputingSolution(false);
    }, 0);
  }, [currentLevel, isPipeMode, editorEnabled, computedSolution, isComputingSolution]);

  useEffect(() => {
    setComputedSolution(null);
    setIsComputingSolution(false);
  }, [currentLevel?.id]);

  return { solution: computedSolution, isComputing: isComputingSolution, computeSolution };
}

/**
 * Custom hook to compute level-specific records from stats.
 */
export function useLevelRecord(currentLevel: Level | null) {
  const stats = useStats();

  return useMemo(() => {
    if (!currentLevel) return undefined;
    const ends = stats
      .getBackend()
      .getAll()
      .filter((e): e is GameEndEvent => e.type === 'game_end' && e.levelId === currentLevel.id);
    return { attempts: ends.length, wins: ends.filter((e) => e.outcome === 'won').length };
  }, [currentLevel?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Custom hook to build and manage replay engine.
 */
export function useReplayEngine(
  replayEvent: GameEndEvent | null,
  generatedLevels: Level[]
) {
  return useMemo(() => {
    if (!replayEvent) return null;
    const level =
      ReplayEngine.findLevel(replayEvent.levelId) ??
      generatedLevels.find((l) => l.id === replayEvent.levelId) ??
      null;
    if (!level) return null;
    return new ReplayEngine(replayEvent, level);
  }, [replayEvent]); // eslint-disable-line react-hooks/exhaustive-deps
}
