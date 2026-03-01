// PRESSURE - Game Store (Zustand v5)
// Pure state management - all game mechanics delegated to the PressureEngine.
// The store is now a thin wrapper that coordinates state with the engine.

import { create } from 'zustand';
import { GameState, GameActions, Level, Direction, Tile } from './types';
import { getModeById } from './modes';
import type { TapResult } from './modes/types';
import { checkConnected, getConnectedTiles, createTileMap } from './modes/utils';
import type { PressureEngine, SoundEffect } from './engine';
import { createPressureEngine } from './engine';
import {
  UNDO_DELAY_MS,
  HISTORY_TRIM_DELAY_MS,
  SCREEN_SHAKE_DURATION_MS,
} from './constants/timings';
import { GRID_SIZE_MIN, GRID_SIZE_MAX } from './constants/grid';

// Re-export utilities so existing imports don't break
export { checkConnected, getConnectedTiles, createTileMap };

/* ═══════════════════════════════════════════════════════════════════════════
   ENGINE INSTANCE
   Created at module load time. GameEngineProvider will initialize it with
   store access (getState/setState) when React mounts.
═══════════════════════════════════════════════════════════════════════════ */

let engine: PressureEngine | null = createPressureEngine();

export function _setEngineInstance(engineInstance: PressureEngine | null) {
  engine = engineInstance;
}

function getEngine(): PressureEngine {
  if (!engine) {
    console.error('[store] Engine is null! Attempting to use before initialization.');
    console.error('[store] Check: Is GameEngineProvider mounted? Did initialization complete?');
    throw new Error('Engine not initialized. Make sure GameEngineProvider is mounted.');
  }
  return engine;
}

function getOrCreateEngine(): PressureEngine {
  if (!engine) {
    console.error('[store] ❌ Engine is null when accessing getOrCreateEngine()');
    console.error('[store] Did LoadingScreen appear? Did GameEngineProvider initialize?');
    throw new Error('Engine not initialized');
  }
  return engine;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORE HELPERS
   Extract complex logic to reduce cognitive complexity in store methods.
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Build the mode state with timing and grid info for a tile tap.
 */
function buildModeStateForTap(
  modeState: any,
  currentLevel: Level | null,
  elapsedSeconds: number
): any {
  const timeLimit = currentLevel?.timeLimit;
  const timeLeft = timeLimit ? Math.max(0, timeLimit - elapsedSeconds) : undefined;
  return {
    ...modeState,
    timeLeft,
    levelId: currentLevel?.id,
    world: currentLevel?.world,
    features: currentLevel?.features,
    gridCols: currentLevel?.gridCols ?? currentLevel?.gridSize,
    gridRows: currentLevel?.gridRows ?? currentLevel?.gridSize,
  };
}

/**
 * Build the editor state for exiting editor mode.
 */
function buildEditorExitState(): any {
  return {
    enabled: false,
    tool: null,
    selectedTile: null,
    moveSource: null,
    gridSize: null,
    savedState: null,
  };
}

/**
 * Handle restoring tiles and level after editor mode exit.
 */
function restoreEditorState(
  savedState: any,
  currentLevel: Level | null,
  wasPlaying: boolean,
  status: string
): { tiles: any[]; currentLevel: Level | null; timerAction: 'start' | 'none' } {
  const { tiles, goalNodes, gridSize } = savedState;
  const restoredLevel = currentLevel
    ? { ...currentLevel, gridSize, goalNodes }
    : null;

  const timerAction = wasPlaying && status === 'playing' ? 'start' : 'none';

  return {
    tiles: tiles.map((t: any) => ({ ...t, connections: [...t.connections] })),
    currentLevel: restoredLevel,
    timerAction,
  };
}

/**
 * Build the tile update state after a successful tap with new elapsed time.
 */
function buildTileUpdateState(
  s: GameState,
  result: TapResult,
  newElapsedSeconds: number,
  timeLimit: number | undefined
): Partial<GameState> {
  const updatedTimeLeft = timeLimit ? Math.max(0, timeLimit - newElapsedSeconds) : undefined;
  return {
    tiles: result.tiles,
    moves: s.moves + 1,
    score: s.score + (result.scoreDelta ?? 0),
    elapsedSeconds: newElapsedSeconds,
    modeState: {
      ...(result.customState ?? s.modeState),
      scoreDelta: result.scoreDelta,
      timeBonus: result.timeBonus,
      timeLeft: updatedTimeLeft,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORE
   The store is now a thin state container. All mechanics (timers, audio,
   persistence, compression) are handled by the PressureEngine.
═══════════════════════════════════════════════════════════════════════════ */

export const useGameStore = create<GameState & GameActions>((set, get) => {
  // Provide initial state structure — engine will hydrate real state via EngineProvider
  const initialState: GameState = {
    currentLevel: null,
    tiles: [],
    wallOffset: 0,
    compressionActive: false,
    compressionDelay: 10000,
    moves: 0,
    status: 'menu',
    completedLevels: [],
    bestMoves: {},
    history: [],
    lastRotatedPos: null,
    showTutorial: false,
    seenTutorials: [],
    generatedLevels: [],
    elapsedSeconds: 0,
    screenShake: false,
    timeUntilCompression: 0,
    wallsJustAdvanced: false,
    showingWin: false,
    connectedTiles: new Set(),
    currentModeId: 'classic',
    compressionOverride: null,
    animationsEnabled: true,
    score: 0,
    lossReason: null,
    modeState: {},
    _winCheckPending: false,
    isPaused: false,
    showArcadeHub: false,
    showPressureHub: false,
    lastPlayedLevelId: {},
    selectedWorld: 1,
    editor: {
      enabled: false,
      tool: null,
      selectedTile: null,
      moveSource: null,
      connectionPreset: null,
      gridSize: null,
      compressionDirection: 'all',
      savedState: null,
    },
    featuredLevel: null,
  };

  return {
    ...initialState,

    setGameMode: (modeId: string) => {
      const { seenTutorials } = get();
      // Check if in test/harness mode (E2E tests with ?levelId=X)
      const isTestMode =
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('levelId');
      const alreadySeen = seenTutorials.includes(modeId) || isTestMode;
      set({
        currentModeId: modeId,
        status: alreadySeen ? 'menu' : 'tutorial',
        currentLevel: null,
        showArcadeHub: false,
        showPressureHub: false,
      });
      getEngine().persist({ ...get(), currentModeId: modeId });
    },

    toggleAnimations: () => {
      set((s) => {
        const next = !s.animationsEnabled;
        getEngine().persist({ ...s, animationsEnabled: next });
        return { animationsEnabled: next };
      });
    },

    setCompressionOverride: (enabled: boolean | null) => {
      set({ compressionOverride: enabled });
    },

    loadLevel: (level: Level) => {
      const eng = getOrCreateEngine();
      eng.clearTimers();
      const levelState = eng.getInitialLevelState(level);
      // Save the world so returning to menu goes back to the same world
      set({ ...levelState, selectedWorld: level.world });
    },

    setSelectedWorld: (world: number) => {
      set({ selectedWorld: world });
    },

    restartLevel: () => {
      getEngine().clearTimers();
      const { currentLevel } = get();
      if (currentLevel) get().loadLevel(currentLevel);
    },

    startGame: () => {
      const { currentLevel, status, currentModeId, compressionOverride } = get();
      if (!currentLevel) return;
      if (status === 'playing' || status === 'won' || status === 'lost') return;

      const eng = getOrCreateEngine();

      // Clear any existing timers before starting a new game
      eng.clearTimers();

      const compressionEnabled = eng.resolveCompressionEnabled(
        currentLevel,
        currentModeId,
        compressionOverride
      );

      eng.playSound('start');
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
        eng.startTimer();
      }
    },

    isTapValid: (status, showingWin) => {
      return status === 'playing' && !showingWin;
    },

    hasMovesRemaining: (mode, currentLevel, moves) => {
      return mode.useMoveLimit === false || !currentLevel || moves < currentLevel.maxMoves;
    },

    shouldCheckMoveLimitLoss: (afterWin, mode) => {
      return !!(
        afterWin.status === 'playing' &&
        !afterWin.showingWin &&
        !afterWin._winCheckPending &&
        mode.checkLoss &&
        afterWin.currentLevel &&
        mode.useMoveLimit !== false &&
        afterWin.moves >= afterWin.currentLevel.maxMoves
      );
    },

    clearJustRotated: () => {
      set((s) => ({
        tiles: s.tiles.map((t) => (t.justRotated ? { ...t, justRotated: false } : t)),
      }));
    },

    clearNewTileGlow: () => {
      set((s) => {
        if (!s.tiles.some((t) => t.displayData?.isNew)) return {};
        return {
          tiles: s.tiles.map((t) =>
            t.displayData?.isNew ? { ...t, displayData: { ...t.displayData, isNew: false } } : t
          ),
        };
      });
    },

    tapTile: (x: number, y: number) => {
      const state = get();
      const { tiles, status, moves, currentLevel, showingWin, currentModeId, modeState, elapsedSeconds } = state;

      // Validate tap is allowed
      if (!get().isTapValid(status, showingWin)) return;

      const mode = getModeById(currentModeId);
      if (!get().hasMovesRemaining(mode, currentLevel, moves)) return;

      // Build mode state with timing info
      const modeStateWithTime = buildModeStateForTap(modeState, currentLevel, elapsedSeconds);

      // Call mode tap handler
      const result = mode.onTileTap(x, y, tiles, currentLevel?.gridSize ?? 5, modeStateWithTime);
      if (!result?.valid) return;

      getEngine().playSound('rotate');

      // Store previous tiles for undo if supported
      const prevTiles =
        mode.supportsUndo !== false
          ? tiles.map((t) => ({ ...t, connections: [...t.connections] }))
          : null;

      // Calculate new elapsed time with time bonus
      const newElapsedSeconds = result.timeBonus
        ? Math.max(0, elapsedSeconds - result.timeBonus)
        : elapsedSeconds;

      // Update state
      set((s) => {
        const tileUpdateState = buildTileUpdateState(s, result, newElapsedSeconds, currentLevel?.timeLimit);
        return {
          ...tileUpdateState,
          history: prevTiles ? [...s.history, prevTiles] : s.history,
          lastRotatedPos: { x, y },
        };
      });

      // Clear justRotated flag after animation
      getEngine().setTimeout(() => {
        get().clearJustRotated();
      }, UNDO_DELAY_MS);

      // Clear "new tile" glow after it has had time to show
      getEngine().setTimeout(() => {
        get().clearNewTileGlow();
      }, HISTORY_TRIM_DELAY_MS);

      get().checkWin();

      // Check for move-limit loss (only if not already winning)
      const afterWin = get();
      if (get().shouldCheckMoveLimitLoss(afterWin, mode)) {
        const { lost, reason } = mode.checkLoss!(
          afterWin.tiles,
          afterWin.wallOffset,
          afterWin.moves,
          afterWin.currentLevel!.maxMoves,
          { score: afterWin.score, targetScore: afterWin.currentLevel!.targetScore }
        );
        if (lost) {
          set({ status: 'lost', lossReason: reason ?? null });
          getEngine().stopTimer();
          getEngine().playSound('lose');
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
      getEngine().handleWin(tiles, currentLevel.goalNodes);
      return true;
    },

    undoMove: () => {
      const { history, status, currentModeId } = get();
      const mode = getModeById(currentModeId);
      if (mode.supportsUndo === false) return;
      if (status !== 'playing' || history.length === 0) return;

      const prev = history[history.length - 1];
      getEngine().playSound('undo');
      set((s) => ({
        tiles: prev,
        moves: Math.max(0, s.moves - 1),
        history: s.history.slice(0, -1),
        lastRotatedPos: null,
      }));
    },

    advanceWalls: () => {
      getEngine().advanceWalls();
    },

    tickTimer: () => {
      const updates = getEngine().onTick();
      if (updates) {
        set(updates);
      }
    },

    // Legacy alias — tickTimer now handles compression
    tickCompressionTimer: () => {
      // No-op, replaced by tickTimer
    },

    triggerShake: () => {
      set({ screenShake: true });
      getEngine().setTimeout(() => set({ screenShake: false }), SCREEN_SHAKE_DURATION_MS);
    },

    goToMenu: () => {
      getEngine().clearTimers();
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
      const { status } = get();
      if (status === 'playing') {
        getEngine().stopTimer();
        set({ isPaused: true });
      }
    },

    resumeGame: () => {
      const { isPaused } = get();
      if (isPaused) {
        set({ isPaused: false });
        getEngine().startTimer();
      }
    },

    openArcadeHub: () => {
      set({ showArcadeHub: true });
    },

    closeArcadeHub: () => {
      set({ showArcadeHub: false });
    },

    openPressureHub: () => {
      set({ showPressureHub: true });
    },

    closePressureHub: () => {
      set({ showPressureHub: false });
    },

    setFeaturedLevel: (level: Level | null) => {
      set({ featuredLevel: level });
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
          getEngine().clearTimers();
          const levelState = getEngine().getInitialLevelState(firstLevel);
          // Set a flag to trigger walkthrough replay and reset moves to 0
          set({ ...levelState, status: 'idle', _replayWalkthrough: Date.now() });
        }
      }
    },

    completeTutorial: () => {
      const state = get();
      const newSeenTutorials = [...new Set([...state.seenTutorials, state.currentModeId])];
      getEngine().persist({ ...state, showTutorial: false, seenTutorials: newSeenTutorials });
      set({ showTutorial: false, seenTutorials: newSeenTutorials, status: 'menu' });
    },

    addGeneratedLevel: (level: Level) => {
      set((state) => {
        const generatedLevels = [...state.generatedLevels, level];
        getEngine().persist({ ...state, generatedLevels });
        return { generatedLevels };
      });
    },

    deleteGeneratedLevel: (id: number) => {
      set((state) => {
        const generatedLevels = state.generatedLevels.filter((l) => l.id !== id);
        getEngine().persist({ ...state, generatedLevels });
        return { generatedLevels };
      });
    },

    editorEnterMode: () => {
      const state = get();
      const wasPlaying = state.status === 'playing';
      getEngine().stopTimer();
      const savedState = {
        tiles: state.tiles.map((t) => ({ ...t, connections: [...t.connections] })),
        goalNodes: state.currentLevel ? [...state.currentLevel.goalNodes] : [],
        gridSize: state.currentLevel?.gridSize ?? 5,
        wasPlaying,
      };
      set((s) => ({
        editor: {
          ...s.editor,
          enabled: true,
          tool: 'select' as const,
          selectedTile: null,
          moveSource: null,
          gridSize: savedState.gridSize,
          savedState,
        },
        isPaused: true,
      }));
    },

    editorExitMode: () => {
      const state = get();
      const wasPlaying = state.editor.savedState?.wasPlaying ?? false;

      if (state.editor.savedState) {
        const { tiles, currentLevel, timerAction } = restoreEditorState(
          state.editor.savedState,
          state.currentLevel,
          wasPlaying,
          state.status
        );

        if (timerAction === 'start') {
          getEngine().startTimer();
        }

        set((s) => ({
          tiles,
          currentLevel,
          editor: { ...s.editor, ...buildEditorExitState() },
          isPaused: false,
        }));
      } else {
        if (wasPlaying && state.status === 'playing') {
          getEngine().startTimer();
        }

        set((s) => ({
          editor: { ...s.editor, ...buildEditorExitState() },
          isPaused: false,
        }));
      }
    },

    toggleEditor: () => {
      const state = get();
      if (state.editor.enabled) {
        get().editorExitMode();
      } else {
        get().editorEnterMode();
      }
    },

    editorResizeGrid: (delta: number) => {
      const { currentLevel, editor, tiles } = get();
      if (!currentLevel || !editor.enabled) return;

      const newSize = Math.max(
        GRID_SIZE_MIN,
        Math.min(GRID_SIZE_MAX, (editor.gridSize ?? currentLevel.gridSize) + delta)
      );
      if (newSize === (editor.gridSize ?? currentLevel.gridSize)) return;

      // Filter out tiles that would be outside the new grid
      const newTiles = tiles.filter((t) => t.x < newSize && t.y < newSize);

      // Update goal nodes to remove any outside new grid
      const newGoalNodes = currentLevel.goalNodes.filter((g) => g.x < newSize && g.y < newSize);

      set((s) => ({
        tiles: newTiles,
        currentLevel: { ...currentLevel, gridSize: newSize, goalNodes: newGoalNodes },
        editor: { ...s.editor, gridSize: newSize },
      }));
    },

    setEditorTool: (tool) => {
      set((s) => ({ editor: { ...s.editor, tool, selectedTile: null, moveSource: null } }));
    },

    editorRotateTile: (clockwise = true) => {
      const { editor, tiles } = get();
      const selected = editor.selectedTile;
      if (!selected) return;

      const idx = tiles.findIndex((t) => t.x === selected.x && t.y === selected.y);
      if (idx < 0) return;

      const tile = tiles[idx];
      if (!tile.canRotate) return;

      const dirOrder: Direction[] = ['up', 'right', 'down', 'left'];
      const newConnections = tile.connections.map((conn) => {
        const i = dirOrder.indexOf(conn);
        if (i < 0) return conn;
        const newIdx = clockwise ? (i + 1) % 4 : (i + 3) % 4;
        return dirOrder[newIdx];
      });

      const newTiles = [...tiles];
      newTiles[idx] = { ...tile, connections: newConnections };
      set({ tiles: newTiles });
    },

    setEditorSelectedTile: (pos) => {
      set((s) => ({ editor: { ...s.editor, selectedTile: pos } }));
    },

    editorHandleEraserTool: (x: number, y: number, existing: Tile | null, _existingIdx: number, tiles: Tile[], currentLevel: Level) => {
      if (!existing) return;
      const newTiles = tiles.filter((t) => t.id !== existing.id);
      let newGoalNodes = currentLevel.goalNodes;
      if (existing.isGoalNode) {
        newGoalNodes = newGoalNodes.filter((g) => !(g.x === x && g.y === y));
      }
      set((s) => ({
        tiles: newTiles,
        currentLevel: { ...currentLevel, goalNodes: newGoalNodes },
        editor: { ...s.editor, selectedTile: null },
      }));
    },

    editorHandleSelectTool: (x: number, y: number, existing: Tile | null) => {
      if (existing) {
        set((s) => ({ editor: { ...s.editor, selectedTile: { x, y } } }));
      }
    },

    editorHandleMoveTool: (x: number, y: number, existing: Tile | null) => {
      const editor = get().editor;
      const moveSource = editor.moveSource;
      if (!moveSource) {
        if (existing) {
          set((s) => ({ editor: { ...s.editor, moveSource: { x, y }, selectedTile: { x, y } } }));
        }
      } else if (moveSource.x === x && moveSource.y === y) {
        set((s) => ({ editor: { ...s.editor, moveSource: null, selectedTile: null } }));
      } else {
        get().editorMoveTile(moveSource.x, moveSource.y, x, y);
        set((s) => ({ editor: { ...s.editor, moveSource: null, selectedTile: null } }));
      }
    },

    editorHandleRotateTool: (_x: number, _y: number, existing: Tile | null, existingIdx: number, tiles: Tile[]) => {
      if (!existing?.canRotate) return;
      const dirOrder: Direction[] = ['up', 'right', 'down', 'left'];
      const newConnections = existing.connections.map((conn) => {
        const i = dirOrder.indexOf(conn);
        if (i < 0) return conn;
        return dirOrder[(i + 1) % 4];
      });
      const newTiles = [...tiles];
      newTiles[existingIdx] = { ...existing, connections: newConnections };
      set({ tiles: newTiles });
    },

    editorHandleNodeTool: (x: number, y: number, existing: Tile | null, existingIdx: number, tiles: Tile[], currentLevel: Level) => {
      const goalNodes = currentLevel.goalNodes;
      if (existing && existing.type === 'node') {
        const newTiles = [...tiles];
        const isGoal = !existing.isGoalNode;
        newTiles[existingIdx] = { ...existing, isGoalNode: isGoal };
        let newGoalNodes = [...goalNodes];
        if (isGoal) {
          if (!newGoalNodes.some((g) => g.x === x && g.y === y)) {
            newGoalNodes.push({ x, y });
          }
        } else {
          newGoalNodes = newGoalNodes.filter((g) => !(g.x === x && g.y === y));
        }
        set((s) => ({
          tiles: newTiles,
          currentLevel: { ...currentLevel, goalNodes: newGoalNodes },
          editor: { ...s.editor, selectedTile: { x, y } },
        }));
      } else {
        const newTile: Tile = {
          id: `node-${x}-${y}-${Date.now()}`,
          type: 'node',
          x,
          y,
          connections: ['up', 'down', 'left', 'right'] as Direction[],
          isGoalNode: true,
          canRotate: false,
        };
        let newTiles: Tile[];
        if (existing) {
          newTiles = [...tiles];
          newTiles[existingIdx] = newTile;
        } else {
          newTiles = [...tiles, newTile];
        }
        const newGoalNodes = [...goalNodes, { x, y }];
        set((s) => ({
          tiles: newTiles,
          currentLevel: { ...currentLevel, goalNodes: newGoalNodes },
          editor: { ...s.editor, selectedTile: { x, y } },
        }));
      }
    },

    editorHandleWallTool: (x: number, y: number, existing: Tile | null, existingIdx: number, tiles: Tile[]) => {
      if (existing && (existing.type === 'wall' || existing.type === 'node')) {
        return;
      }
      const newTile: Tile = {
        id: `wall-${x}-${y}-${Date.now()}`,
        type: 'wall',
        x,
        y,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      };
      let newTiles: Tile[];
      if (existing) {
        newTiles = [...tiles];
        newTiles[existingIdx] = newTile;
      } else {
        newTiles = [...tiles, newTile];
      }
      set((s) => ({ tiles: newTiles, editor: { ...s.editor, selectedTile: { x, y } } }));
    },

    editorHandlePathTool: (x: number, y: number, existing: Tile | null, existingIdx: number, tiles: Tile[]) => {
      const newTile: Tile = {
        id: `path-${x}-${y}-${Date.now()}`,
        type: 'path',
        x,
        y,
        connections: ['left', 'right'] as Direction[],
        isGoalNode: false,
        canRotate: true,
        isDecoy: false,
      };
      let newTiles: Tile[];
      if (existing) {
        newTiles = [...tiles];
        newTiles[existingIdx] = newTile;
      } else {
        newTiles = [...tiles, newTile];
      }
      set((s) => ({ tiles: newTiles, editor: { ...s.editor, selectedTile: { x, y } } }));
    },

    editorHandleDecoyTool: (x: number, y: number, existing: Tile | null, existingIdx: number, tiles: Tile[]) => {
      const newTile: Tile = {
        id: `decoy-${x}-${y}-${Date.now()}`,
        type: 'path',
        x,
        y,
        connections: ['left', 'right'] as Direction[],
        isGoalNode: false,
        canRotate: true,
        isDecoy: true,
      };
      let newTiles: Tile[];
      if (existing) {
        newTiles = [...tiles];
        newTiles[existingIdx] = newTile;
      } else {
        newTiles = [...tiles, newTile];
      }
      set((s) => ({ tiles: newTiles, editor: { ...s.editor, selectedTile: { x, y } } }));
    },

    editorUpdateTile: (x, y) => {
      const { tiles, editor, currentLevel } = get();
      if (!editor.tool || !currentLevel) return;

      const existingIdx = tiles.findIndex((t) => t.x === x && t.y === y);
      const existing = existingIdx >= 0 ? tiles[existingIdx] : null;

      const toolHandlers: Record<string, () => void> = {
        eraser: () => get().editorHandleEraserTool(x, y, existing, existingIdx, tiles, currentLevel),
        select: () => get().editorHandleSelectTool(x, y, existing),
        move: () => get().editorHandleMoveTool(x, y, existing),
        rotate: () => get().editorHandleRotateTool(x, y, existing, existingIdx, tiles),
        node: () => get().editorHandleNodeTool(x, y, existing, existingIdx, tiles, currentLevel),
        wall: () => get().editorHandleWallTool(x, y, existing, existingIdx, tiles),
        path: () => get().editorHandlePathTool(x, y, existing, existingIdx, tiles),
        decoy: () => get().editorHandleDecoyTool(x, y, existing, existingIdx, tiles),
      };

      const handler = toolHandlers[editor.tool];
      if (handler) handler();
    },

    editorMoveTile: (fromX, fromY, toX, toY) => {
      const { tiles, currentLevel } = get();
      if (!currentLevel) return;

      const fromIdx = tiles.findIndex((t) => t.x === fromX && t.y === fromY);
      const toIdx = tiles.findIndex((t) => t.x === toX && t.y === toY);

      if (fromIdx < 0) return;

      const newTiles = [...tiles];
      const movingTile = { ...newTiles[fromIdx], x: toX, y: toY };

      // If there's a tile at destination, swap positions
      if (toIdx >= 0) {
        const destTile = { ...newTiles[toIdx], x: fromX, y: fromY };
        newTiles[fromIdx] = destTile;
        newTiles[toIdx] = movingTile;
      } else {
        // Just move the tile
        newTiles[fromIdx] = movingTile;
      }

      set({ tiles: newTiles });
    },

    editorToggleGoalNode: (x, y) => {
      const { tiles, currentLevel } = get();
      if (!currentLevel) return;

      const idx = tiles.findIndex((t) => t.x === x && t.y === y);
      if (idx < 0) return;

      const tile = tiles[idx];
      if (tile.type !== 'node') return;

      const newTiles = [...tiles];
      const isGoal = !tile.isGoalNode;
      newTiles[idx] = { ...tile, isGoalNode: isGoal };

      // Update goalNodes list
      let newGoalNodes = [...currentLevel.goalNodes];
      if (isGoal) {
        if (!newGoalNodes.some((g) => g.x === x && g.y === y)) {
          newGoalNodes.push({ x, y });
        }
      } else {
        newGoalNodes = newGoalNodes.filter((g) => !(g.x === x && g.y === y));
      }

      set({
        tiles: newTiles,
        currentLevel: { ...currentLevel, goalNodes: newGoalNodes },
      });
    },

    exportLevel: () => {
      const { tiles, currentLevel, currentModeId } = get();
      if (!currentLevel) return '';

      const levelData = {
        name: currentLevel.name + ' (edited)',
        world: currentLevel.world,
        gridSize: currentLevel.gridSize,
        tiles: tiles.map((t) => ({
          type: t.type,
          x: t.x,
          y: t.y,
          connections: t.connections,
          isGoalNode: t.isGoalNode,
          canRotate: t.canRotate,
        })),
        goalNodes: currentLevel.goalNodes,
        maxMoves: currentLevel.maxMoves,
        compressionDelay: currentLevel.compressionDelay,
        modeId: currentModeId,
      };

      return JSON.stringify(levelData, null, 2);
    },
  };
});

// Export type helpers
export type { PressureEngine, SoundEffect };
