/**
 * Custom hook to manage StateEditor's complex state and callback logic.
 * Extracted from StateEditor component to reduce cognitive complexity.
 */

import { useCallback, useRef } from 'react';
import { useGameStore } from '@/game/store';
import type { Tile, Direction } from '@/game/types';

export interface HistorySnapshot {
  readonly tiles: Tile[];
  readonly moves: number;
  readonly score: number;
  readonly description: string;
  readonly timestamp: number;
}

interface UseStateEditorLogicProps {
  tiles: Tile[];
  moves: number;
  score: number;
  setDebugHistory: (h: (prev: HistorySnapshot[]) => HistorySnapshot[]) => void;
  setDebugStep: (s: (prev: number) => number) => void;
}

export function useStateEditorLogic({
  tiles,
  moves,
  score,
  setDebugHistory,
  setDebugStep,
}: UseStateEditorLogicProps) {
  const setState = useGameStore.setState;
  const debugIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Capture current state for debug history
  const captureDebugSnapshot = useCallback(
    (description: string) => {
      const snapshot: HistorySnapshot = {
        tiles: tiles.map((t) => ({ ...t, connections: [...t.connections] })),
        moves,
        score,
        description,
        timestamp: Date.now(),
      };
      setDebugHistory((prev) => [...prev.slice(-49), snapshot]); // Keep last 50
      setDebugStep((prev) => prev + 1);
    },
    [tiles, moves, score, setDebugHistory, setDebugStep]
  );

  // Update tile connections
  const updateTileConnections = useCallback(
    (x: number, y: number, connections: Direction[]) => {
      const newTiles = tiles.map((t) => (t.x === x && t.y === y ? { ...t, connections } : t));
      setState({ tiles: newTiles });
      captureDebugSnapshot(`Updated tile (${x},${y}) connections`);
    },
    [tiles, setState, captureDebugSnapshot]
  );

  // Toggle tile property
  const toggleTileProperty = useCallback(
    (x: number, y: number, prop: keyof Tile) => {
      const newTiles = tiles.map((t) => (t.x === x && t.y === y ? { ...t, [prop]: !t[prop] } : t));
      setState({ tiles: newTiles });
      captureDebugSnapshot(`Toggled ${prop} on tile (${x},${y})`);
    },
    [tiles, setState, captureDebugSnapshot]
  );

  return {
    captureDebugSnapshot,
    updateTileConnections,
    toggleTileProperty,
    debugIntervalRef,
  };
}
