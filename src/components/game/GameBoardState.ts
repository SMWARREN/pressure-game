/**
 * Custom hooks for GameBoard state management
 * Extracted to reduce cognitive complexity of the main component
 */

import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';
import { getSolution } from '@/game/levels';
import { getUnlimitedHighScore, setUnlimitedHighScore } from '@/game/unlimited';
import type { Level } from '@/game/types';

interface SolutionStep {
  x: number;
  y: number;
  rotations: number;
}

/**
 * Manage hint system (solution computation and visibility)
 */
export function useHintSystem(currentLevel: Level | null, isPipeMode: boolean): {
  solution: SolutionStep[] | null;
  isComputingSolution: boolean;
  hintPos: SolutionStep | null;
  showHint: boolean;
  setShowHint: (show: boolean) => void;
} {
  const [computedSolution, setComputedSolution] = useState<SolutionStep[] | null>(null);
  const [isComputingSolution, setIsComputingSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Compute solution when level changes (lazy computation)
  useEffect(() => {
    if (!currentLevel || !isPipeMode || computedSolution !== null) return;

    setIsComputingSolution(true);
    const timer = setTimeout(() => {
      try {
        const sol = getSolution(currentLevel);
        setComputedSolution(sol);
      } finally {
        setIsComputingSolution(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [currentLevel, isPipeMode, computedSolution]);

  // Reset solution when level changes
  useEffect(() => {
    setComputedSolution(null);
    setIsComputingSolution(false);
    setShowHint(false);
  }, [currentLevel?.id]);

  const solution = computedSolution;
  const hintPos = showHint && solution?.length ? solution[0] : null;

  return { solution, isComputingSolution, hintPos, showHint, setShowHint };
}

/**
 * Manage unlimited level rules dialog and high score tracking
 */
export function useUnlimitedSystem(currentLevel: Level | null, currentModeId: string): {
  isUnlimited: boolean;
  showUnlimitedRules: boolean;
  setShowUnlimitedRules: (show: boolean) => void;
  unlimitedPreviousScore: number | null;
  isNewHighScore: boolean;
  handleUnlimitedStart: () => void;
} {
  const { status, score, startGame } = useGameStore();
  const [showUnlimitedRules, setShowUnlimitedRules] = useState(false);
  const [unlimitedPreviousScore, setUnlimitedPreviousScore] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const isUnlimited = currentLevel?.isUnlimited ?? false;

  // Show rules dialog when unlimited level is loaded
  useEffect(() => {
    if (currentLevel?.isUnlimited && status === 'idle') {
      const highScore = getUnlimitedHighScore(currentModeId, currentLevel.id);
      setUnlimitedPreviousScore(highScore);
      setShowUnlimitedRules(true);
    } else {
      setShowUnlimitedRules(false);
    }
  }, [currentLevel?.id, currentLevel?.isUnlimited, status, currentModeId]);

  // Save unlimited high score and detect new record
  useEffect(() => {
    if (!isUnlimited || !currentLevel) return;
    if (status === 'lost' || status === 'won') {
      const previousBest = getUnlimitedHighScore(currentModeId, currentLevel.id) ?? 0;
      setUnlimitedHighScore(currentModeId, currentLevel.id, score);
      setIsNewHighScore(score > previousBest);
    } else if (status === 'idle') {
      setIsNewHighScore(false);
    }
  }, [status, score, currentModeId, currentLevel, isUnlimited]);

  const handleUnlimitedStart = useCallback(() => {
    setShowUnlimitedRules(false);
    startGame();
  }, [startGame]);

  return {
    isUnlimited,
    showUnlimitedRules,
    setShowUnlimitedRules,
    unlimitedPreviousScore,
    isNewHighScore,
    handleUnlimitedStart,
  };
}

/**
 * Manage notification system
 */
export function useNotificationSystem(): {
  notifLog: Array<{ text: string; key: string; isScore?: boolean }>;
  rejectedPos: { x: number; y: number } | null;
  setRejectedPos: (pos: { x: number; y: number } | null) => void;
  setNotifLog: (log: any[]) => void;
  showNotification: (text: string, isScore?: boolean) => void;
} {
  const [notifLog, setNotifLog] = useState<Array<{ text: string; key: string; isScore?: boolean }>>(
    []
  );
  const [rejectedPos, setRejectedPos] = useState<{ x: number; y: number } | null>(null);

  const showNotification = useCallback((text: string, isScore = false) => {
    const key = `${Date.now()}-${Math.random()}`;
    setNotifLog((prev) => [...prev, { text, key, isScore }]);
    setTimeout(() => {
      setNotifLog((prev) => prev.filter((n) => n.key !== key));
    }, 2500);
  }, []);

  return { notifLog, rejectedPos, setRejectedPos, setNotifLog, showNotification };
}

/* Unused replay system hooks - kept for future use

export function useReplaySystem(generatedLevels: Level[]): {
  replayEvent: GameEndEvent | null;
  setReplayEvent: (event: GameEndEvent | null) => void;
  replayEngine: ReplayEngine | null;
} {
  const [replayEvent, setReplayEvent] = useState<GameEndEvent | null>(null);

  const replayEngine = useMemo(() => {
    if (!replayEvent) return null;
    const level =
      ReplayEngine.findLevel(replayEvent.levelId) ??
      generatedLevels.find((l) => l.id === replayEvent.levelId) ??
      null;
    if (!level) return null;
    return new ReplayEngine(replayEvent, level);
  }, [replayEvent, generatedLevels]);

  return { replayEvent, setReplayEvent, replayEngine };
}

export function useLevelRecord(currentLevel: Level | null): {
  levelRecord:
    | {
        attempts: number;
        wins: number;
      }
    | undefined;
} {
  const stats = useStats();

  const levelRecord = useMemo(() => {
    if (!currentLevel) return undefined;
    const ends = stats
      .getBackend()
      .getAll()
      .filter((e): e is GameEndEvent => e.type === 'game_end' && e.levelId === currentLevel.id);
    return { attempts: ends.length, wins: ends.filter((e) => e.outcome === 'won').length };
  }, [currentLevel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { levelRecord };
}

function getReplayableEvents(stats: any, levelId: number): GameEndEvent[] {
  return stats
    .getBackend()
    .getAll()
    .filter(
      (e: any): e is GameEndEvent =>
        e.type === 'game_end' &&
        e.levelId === levelId &&
        (e.moveLog?.length ?? 0) > 0
    );
}

export function useReplayCallback(
  status: string,
  isUnlimited: boolean,
  currentLevel: Level | null,
  stats: any
): {
  onReplayForOverlay: ((event: GameEndEvent) => void) | undefined;
} {
  const onReplayForOverlay = useMemo(() => {
    const show = status === 'won' || (isUnlimited && status === 'lost');
    if (!show || !currentLevel) return undefined;

    return (setReplayEvent: (event: GameEndEvent) => void) => {
      const allEnds = getReplayableEvents(stats, currentLevel.id);
      if (!allEnds.length) return;

      const bestScore = Math.max(...allEnds.map((e) => e.score ?? 0));
      const best = allEnds.find((e) => e.score === bestScore);
      if (best) {
        setReplayEvent(best);
      }
    };
  }, [status, isUnlimited, currentLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  return { onReplayForOverlay };
}
*/
