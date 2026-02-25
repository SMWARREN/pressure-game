// PRESSURE - Game Store (Zustand v5)
// Pure state management - all game mechanics delegated to the PressureEngine.
// The store is now a thin wrapper that coordinates state with the engine.

import { create } from 'zustand';
import { GameState, GameActions, Level } from './types';
import { getModeById } from './modes';
import { checkConnected, getConnectedTiles, createTileMap } from './modes/utils';
import { getEngine, initEngine, type PressureEngine, type SoundEffect } from './engine';

// Re-export utilities so existing imports don't break
export { checkConnected, getConnectedTiles, createTileMap };

/* ═══════════════════════════════════════════════════════════════════════════
   STORE
   The store is now a thin state container. All mechanics (timers, audio,
   persistence, compression) are handled by the PressureEngine.
═══════════════════════════════════════════════════════════════════════════ */

export const useGameStore = create<GameState & GameActions>((set, get) => {
  // Initialize the engine with store access
  const engine = initEngine(get, set);

  // Get initial state from engine (loads from persistence)
  const initialState = engine.getInitialState();

  return {
    ...initialState,

    setGameMode: (modeId: string) => {
      const { seenTutorials } = get();
      const alreadySeen = seenTutorials.includes(modeId);
      set({ currentModeId: modeId, status: alreadySeen ? 'menu' : 'tutorial', currentLevel: null });
      engine.persist({ ...get(), currentModeId: modeId });
    },

    toggleAnimations: () => {
      set((s) => {
        const next = !s.animationsEnabled;
        engine.persist({ ...s, animationsEnabled: next });
        return { animationsEnabled: next };
      });
    },

    setCompressionOverride: (enabled: boolean | null) => {
      set({ compressionOverride: enabled });
    },

    loadLevel: (level: Level) => {
      engine.clearTimers();
      const levelState = engine.getInitialLevelState(level);
      set(levelState);
    },

    restartLevel: () => {
      engine.clearTimers();
      const { currentLevel } = get();
      if (currentLevel) get().loadLevel(currentLevel);
    },

    startGame: () => {
      const { currentLevel, status, currentModeId, compressionOverride } = get();
      if (!currentLevel) return;
      if (status === 'playing' || status === 'won' || status === 'lost') return;

      // Clear any existing timers before starting a new game
      engine.clearTimers();

      const compressionEnabled = engine.resolveCompressionEnabled(
        currentLevel,
        currentModeId,
        compressionOverride
      );

      engine.playSound('start');
      set({
        status: 'playing',
        elapsedSeconds: 0,
        timeUntilCompression: currentLevel.compressionDelay,
        showingWin: false,
        compressionActive: compressionEnabled,
        _winCheckPending: false,
      });

      // Check if already solved (e.g., pre-solved demo levels)
      const alreadyWon = get().checkWin();
      if (!alreadyWon && get().status === 'playing') {
        engine.startTimer();
      }
    },

    tapTile: (x: number, y: number) => {
      const state = get();
      const { tiles, status, moves, currentLevel, showingWin, currentModeId, modeState } = state;

      if (status !== 'playing' || showingWin) return;

      const mode = getModeById(currentModeId);

      if (mode.useMoveLimit !== false && currentLevel && moves >= currentLevel.maxMoves) return;

      // Calculate timeLeft for timed levels and pass to mode
      const timeLimit = currentLevel?.timeLimit;
      const timeLeft = timeLimit ? Math.max(0, timeLimit - state.elapsedSeconds) : undefined;
      const modeStateWithTime = { ...modeState, timeLeft, levelId: currentLevel?.id, world: currentLevel?.world };

      const result = mode.onTileTap(x, y, tiles, currentLevel?.gridSize ?? 5, modeStateWithTime);
      if (!result || !result.valid) return;

      engine.playSound('rotate');

      const prevTiles =
        mode.supportsUndo !== false
          ? tiles.map((t) => ({ ...t, connections: [...t.connections] }))
          : null;

      // Calculate new elapsed time with time bonus
      const newElapsedSeconds = result.timeBonus
        ? Math.max(0, state.elapsedSeconds - result.timeBonus)
        : state.elapsedSeconds;

      // Calculate updated timeLeft for timed levels
      const updatedTimeLeft = timeLimit ? Math.max(0, timeLimit - newElapsedSeconds) : undefined;

      set((s) => ({
        tiles: result.tiles,
        moves: s.moves + 1,
        score: s.score + (result.scoreDelta ?? 0),
        // Time bonus: reduce elapsed time (adds time to countdown)
        elapsedSeconds: newElapsedSeconds,
        history: prevTiles ? [...s.history, prevTiles] : s.history,
        lastRotatedPos: { x, y },
        modeState: {
          ...(result.customState ?? s.modeState),
          scoreDelta: result.scoreDelta,
          timeBonus: result.timeBonus,
          timeLeft: updatedTimeLeft,
        },
      }));

      // Clear justRotated flag after animation
      engine.setTimeout(() => {
        set((s) => ({
          tiles: s.tiles.map((t) => (t.justRotated ? { ...t, justRotated: false } : t)),
        }));
      }, 300);

      // Clear "new tile" glow after it has had time to show
      engine.setTimeout(() => {
        set((s) => {
          if (!s.tiles.some((t) => t.displayData?.isNew)) return {};
          return {
            tiles: s.tiles.map((t) =>
              t.displayData?.isNew ? { ...t, displayData: { ...t.displayData, isNew: false } } : t
            ),
          };
        });
      }, 1500);

      get().checkWin();

      // Check for move-limit loss
      const afterWin = get();
      if (
        afterWin.status === 'playing' &&
        mode.checkLoss &&
        afterWin.currentLevel &&
        mode.useMoveLimit !== false &&
        afterWin.moves >= afterWin.currentLevel.maxMoves
      ) {
        const { lost, reason } = mode.checkLoss(
          afterWin.tiles,
          afterWin.wallOffset,
          afterWin.moves,
          afterWin.currentLevel.maxMoves,
          { score: afterWin.score, targetScore: afterWin.currentLevel.targetScore }
        );
        if (lost) {
          set({ status: 'lost', lossReason: reason ?? null });
          engine.stopTimer();
          engine.playSound('lose');
        }
      }
    },

    checkWin: () => {
      const { tiles, currentLevel, status, showingWin, moves, currentModeId, _winCheckPending } =
        get();

      if (!currentLevel || status !== 'playing' || showingWin || _winCheckPending) return false;

      const mode = getModeById(currentModeId);
      const modeState = { score: get().score, targetScore: currentLevel.targetScore };
      const { won } = mode.checkWin(
        tiles,
        currentLevel.goalNodes,
        moves,
        currentLevel.maxMoves,
        modeState
      );

      if (!won) return false;

      // Use engine to handle win
      engine.handleWin(tiles, currentLevel.goalNodes);
      return true;
    },

    undoMove: () => {
      const { history, status, currentModeId } = get();
      const mode = getModeById(currentModeId);
      if (mode.supportsUndo === false) return;
      if (status !== 'playing' || history.length === 0) return;

      const prev = history[history.length - 1];
      engine.playSound('undo');
      set((s) => ({
        tiles: prev,
        moves: Math.max(0, s.moves - 1),
        history: s.history.slice(0, -1),
        lastRotatedPos: null,
      }));
    },

    advanceWalls: () => {
      engine.advanceWalls();
    },

    tickTimer: () => {
      const updates = engine.onTick();
      if (updates) {
        set(updates);
      }
    },

    // Legacy alias — tickTimer now handles compression
    tickCompressionTimer: () => {},

    triggerShake: () => {
      set({ screenShake: true });
      engine.setTimeout(() => set({ screenShake: false }), 400);
    },

    goToMenu: () => {
      engine.clearTimers();
      set({
        status: 'menu',
        currentLevel: null,
        compressionActive: false,
        showingWin: false,
        _winCheckPending: false,
      });
    },

    replayTutorial: () => {
      set({ status: 'tutorial', currentLevel: null });
    },

    pauseGame: () => {
      engine.stopTimer();
    },

    resumeGame: () => {
      const { status } = get();
      if (status === 'playing') {
        engine.startTimer();
      }
    },

    replayWalkthrough: () => {
      const { currentModeId } = get();
      const mode = getModeById(currentModeId);
      const walkthrough = mode.walkthrough;
      if (walkthrough) {
        // Clear the walkthrough seen flag from localStorage
        localStorage.removeItem(`walkthrough-${walkthrough.modeId}-${walkthrough.levelId}`);
        // Load the first level of this mode (where walkthrough is shown)
        const levels = mode.getLevels();
        const firstLevel = levels.find((l) => l.id === walkthrough.levelId) ?? levels[0];
        if (firstLevel) {
          engine.clearTimers();
          const levelState = engine.getInitialLevelState(firstLevel);
          // Set a flag to trigger walkthrough replay and reset moves to 0
          set({ ...levelState, status: 'idle', _replayWalkthrough: Date.now() });
        }
      }
    },

    completeTutorial: () => {
      const state = get();
      const newSeenTutorials = [...new Set([...state.seenTutorials, state.currentModeId])];
      engine.persist({ ...state, showTutorial: false, seenTutorials: newSeenTutorials });
      set({ showTutorial: false, seenTutorials: newSeenTutorials, status: 'menu' });
    },

    addGeneratedLevel: (level: Level) => {
      set((state) => {
        const generatedLevels = [...state.generatedLevels, level];
        engine.persist({ ...state, generatedLevels });
        return { generatedLevels };
      });
    },

    deleteGeneratedLevel: (id: number) => {
      set((state) => {
        const generatedLevels = state.generatedLevels.filter((l) => l.id !== id);
        engine.persist({ ...state, generatedLevels });
        return { generatedLevels };
      });
    },
  };
});

// Export engine access for advanced use cases
export { getEngine, type PressureEngine, type SoundEffect };
