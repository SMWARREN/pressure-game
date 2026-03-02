import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useStats } from '@/game/contexts';
import type { GameEndEvent } from '@/game/stats/types';
import { getSolution } from '@/game/levels';
import type { Level } from '@/game/types';
import { ReplayEngine } from '@/game/stats/replay';
import { useGameStore } from '@/game/store';
import { getModeById } from '@/game/modes';

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
    if (
      !currentLevel ||
      !isPipeMode ||
      editorEnabled ||
      computedSolution !== null ||
      isComputingSolution
    )
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
export function useReplayEngine(replayEvent: GameEndEvent | null, generatedLevels: Level[]) {
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

/**
 * Custom hook to manage notification display and logging.
 */
export function useNotificationSystem() {
  const [notification, setNotification] = useState<{
    text: string;
    key: number;
    isScore: boolean;
  } | null>(null);
  const [notifLog, setNotifLog] = useState<Array<{ id: number; text: string; isScore: boolean }>>(
    []
  );
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((text: string, isScore = false) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    const id = Date.now();
    setNotification({ text, key: id, isScore });
    notifTimeoutRef.current = setTimeout(() => setNotification(null), 1400);
    setNotifLog((prev) => [...prev.slice(-9), { id, text, isScore }]);
  }, []);

  useEffect(() => {
    return () => {
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    };
  }, []);

  return { notification, notifLog, showNotification, setNotifLog };
}

/**
 * Custom hook to manage tap rejection feedback.
 */
export function useTapRejection() {
  const [rejectedPos, setRejectedPos] = useState<{ x: number; y: number } | null>(null);

  const handleRejectedTap = useCallback((x: number, y: number) => {
    setRejectedPos({ x, y });
    setTimeout(() => setRejectedPos(null), 380);
  }, []);

  return { rejectedPos, handleRejectedTap };
}

/**
 * Custom hook to build accepted tap notification.
 */
export function useAcceptedTapNotification(
  currentModeId: string,
  showNotification: (text: string, isScore: boolean) => void
) {
  return useCallback(
    (scoreDelta: number) => {
      const tappedMode = getModeById(currentModeId);
      let notifText: string | null = null;
      if (tappedMode.getNotification) {
        const freshState = useGameStore.getState();
        const notifModeState = { ...(freshState.modeState ?? {}), scoreDelta };
        notifText = tappedMode.getNotification(freshState.tiles, freshState.moves, notifModeState);
      }
      if (!notifText && scoreDelta > 0) notifText = `+${scoreDelta}`;
      if (notifText) showNotification(notifText, scoreDelta > 0);
    },
    [currentModeId, showNotification]
  );
}
