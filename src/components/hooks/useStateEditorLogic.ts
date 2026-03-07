/**
 * Custom hook to manage StateEditor's complex state and callback logic.
 * Extracted from StateEditor component to reduce cognitive complexity.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { useEngine } from '@/game/contexts/GameEngineProvider';
import type { Tile, Direction, Level, GameStatus } from '@/game/types';

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

export interface StatePreset {
  readonly name: string;
  readonly timestamp: number;
  readonly state: {
    readonly tiles: Tile[];
    readonly moves: number;
    readonly score: number;
    readonly elapsedSeconds: number;
    readonly wallOffset: number;
    timeUntilCompression: number;
    modeState?: Record<string, unknown>;
    currentLevel: Level | null;
    status: GameStatus;
  };
}

/**
 * Custom hook to manage preset save/load functionality.
 */
export function usePresetManagement() {
  const engine = useEngine();
  const [presets, setPresets] = useState<StatePreset[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const setState = useGameStore.setState;

  // Load presets from engine
  useEffect(() => {
    try {
      const saved = engine.getEditorPresets();
      if (Array.isArray(saved)) {
        setPresets(saved as StatePreset[]);
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  }, [engine]);

  // Save presets to engine
  const savePresetsToStorage = useCallback(
    (newPresets: StatePreset[]) => {
      setPresets(newPresets);
      engine.setEditorPresets(newPresets);
    },
    [engine]
  );

  // Show message temporarily
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  // Load preset
  const loadPreset = useCallback(
    (preset: StatePreset) => {
      setState({
        tiles: preset.state.tiles,
        moves: preset.state.moves,
        score: preset.state.score,
        elapsedSeconds: preset.state.elapsedSeconds,
        wallOffset: preset.state.wallOffset,
        timeUntilCompression: preset.state.timeUntilCompression,
        modeState: preset.state.modeState,
        currentLevel: preset.state.currentLevel,
        status: preset.state.status ?? 'idle',
      });
      showMessage(`Preset "${preset.name}" loaded!`);
    },
    [setState, showMessage]
  );

  // Delete preset
  const deletePreset = useCallback(
    (name: string) => {
      const newPresets = presets.filter((p) => p.name !== name);
      savePresetsToStorage(newPresets);
      showMessage(`Preset "${name}" deleted`);
    },
    [presets, savePresetsToStorage, showMessage]
  );

  return {
    presets,
    message,
    savePresetsToStorage,
    showMessage,
    loadPreset,
    deletePreset,
  };
}
