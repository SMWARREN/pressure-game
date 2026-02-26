// PRESSURE - Game Store (Zustand v5)
// Pure state management - all game mechanics delegated to the PressureEngine.
// The store is now a thin wrapper that coordinates state with the engine.

import { create } from 'zustand';
import { GameState, GameActions, Level, Direction, Tile } from './types';
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

  // Get the default world from the current mode
  const currentMode = getModeById(initialState.currentModeId);
  const defaultWorld = currentMode.worlds[0]?.id ?? 1;

  return {
    ...initialState,
    selectedWorld: initialState.selectedWorld ?? defaultWorld,

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
      // Save the world so returning to menu goes back to the same world
      set({ ...levelState, selectedWorld: level.world });
    },

    setSelectedWorld: (world: number) => {
      set({ selectedWorld: world });
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
      const modeStateWithTime = {
        ...modeState,
        timeLeft,
        levelId: currentLevel?.id,
        world: currentLevel?.world,
      };

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
      const { status } = get();
      if (status === 'playing') {
        engine.stopTimer();
        set({ isPaused: true });
      }
    },

    resumeGame: () => {
      const { isPaused } = get();
      if (isPaused) {
        set({ isPaused: false });
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

    toggleEditor: () => {
      set((s) => {
        const next = !s.editor.enabled;

        if (next) {
          // Entering editor mode - save current state
          engine.stopTimer();
          const savedState = {
            tiles: s.tiles.map((t) => ({ ...t, connections: [...t.connections] })),
            goalNodes: s.currentLevel ? [...s.currentLevel.goalNodes] : [],
            gridSize: s.currentLevel?.gridSize ?? 5,
          };
          return {
            editor: {
              ...s.editor,
              enabled: true,
              tool: 'select',
              selectedTile: null,
              moveSource: null,
              gridSize: savedState.gridSize,
              savedState,
            },
            isPaused: true,
          };
        } else {
          // Exiting editor mode - restore saved state if available
          if (s.editor.savedState) {
            const { tiles, goalNodes, gridSize } = s.editor.savedState;
            const restoredLevel = s.currentLevel
              ? {
                  ...s.currentLevel,
                  gridSize,
                  goalNodes,
                }
              : null;
            return {
              tiles: tiles.map((t) => ({ ...t, connections: [...t.connections] })),
              currentLevel: restoredLevel,
              editor: {
                ...s.editor,
                enabled: false,
                tool: null,
                selectedTile: null,
                moveSource: null,
                gridSize: null,
                savedState: null,
              },
              isPaused: false,
            };
          }
          return {
            editor: {
              ...s.editor,
              enabled: false,
              tool: null,
              selectedTile: null,
              moveSource: null,
              gridSize: null,
              savedState: null,
            },
            isPaused: false,
          };
        }
      });
    },

    editorResizeGrid: (delta: number) => {
      const { currentLevel, editor, tiles } = get();
      if (!currentLevel || !editor.enabled) return;

      const newSize = Math.max(4, Math.min(10, (editor.gridSize ?? currentLevel.gridSize) + delta));
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
      newTiles[idx] = { ...tile, connections: newConnections as Direction[] };
      set({ tiles: newTiles });
    },

    setEditorSelectedTile: (pos) => {
      set((s) => ({ editor: { ...s.editor, selectedTile: pos } }));
    },

    editorUpdateTile: (x, y) => {
      const { tiles, editor, currentLevel } = get();
      if (!editor.tool || !currentLevel) return;

      // Find existing tile at position
      const existingIdx = tiles.findIndex((t) => t.x === x && t.y === y);
      const existing = existingIdx >= 0 ? tiles[existingIdx] : null;

      // Eraser mode - remove any tile (including walls, nodes, paths)
      if (editor.tool === 'eraser') {
        if (existing) {
          const newTiles = tiles.filter((t) => t.id !== existing.id);
          // Also remove from goalNodes if it was a goal node
          let newGoalNodes = currentLevel.goalNodes;
          if (existing.isGoalNode) {
            newGoalNodes = newGoalNodes.filter((g) => !(g.x === x && g.y === y));
          }
          set((s) => ({
            tiles: newTiles,
            currentLevel: { ...currentLevel, goalNodes: newGoalNodes },
            editor: { ...s.editor, selectedTile: null },
          }));
        }
        return;
      }

      // Select mode - just select
      if (editor.tool === 'select') {
        if (existing) {
          set((s) => ({ editor: { ...s.editor, selectedTile: { x, y } } }));
        }
        return;
      }

      // Move mode - select source or move to destination
      if (editor.tool === 'move') {
        const moveSource = editor.moveSource;
        if (!moveSource) {
          // First click - select source tile
          if (existing) {
            set((s) => ({ editor: { ...s.editor, moveSource: { x, y }, selectedTile: { x, y } } }));
          }
        } else if (moveSource.x === x && moveSource.y === y) {
          // Clicking same tile - deselect
          set((s) => ({ editor: { ...s.editor, moveSource: null, selectedTile: null } }));
        } else {
          // Second click - move tile to new position
          get().editorMoveTile(moveSource.x, moveSource.y, x, y);
          set((s) => ({ editor: { ...s.editor, moveSource: null, selectedTile: null } }));
        }
        return;
      }

      // Rotate mode - rotate the tile
      if (editor.tool === 'rotate') {
        if (existing && existing.canRotate) {
          const dirOrder: Direction[] = ['up', 'right', 'down', 'left'];
          const newConnections = existing.connections.map((conn) => {
            const i = dirOrder.indexOf(conn);
            if (i < 0) return conn;
            return dirOrder[(i + 1) % 4];
          });
          const newTiles = [...tiles];
          newTiles[existingIdx] = { ...existing, connections: newConnections as Direction[] };
          set({ tiles: newTiles });
        }
        return;
      }

      // Node tool - toggle goal node status or create new node
      if (editor.tool === 'node') {
        // If clicking on an existing node, toggle its goal status
        if (existing && existing.type === 'node') {
          const newTiles = [...tiles];
          const isGoal = !existing.isGoalNode;
          newTiles[existingIdx] = { ...existing, isGoalNode: isGoal };

          // Update goalNodes list
          let newGoalNodes = [...currentLevel.goalNodes];
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
          // Create a new goal node
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

          // Add to goalNodes
          const newGoalNodes = [...currentLevel.goalNodes, { x, y }];

          set((s) => ({
            tiles: newTiles,
            currentLevel: { ...currentLevel, goalNodes: newGoalNodes },
            editor: { ...s.editor, selectedTile: { x, y } },
          }));
        }
        return;
      }

      // Wall tool - create wall tile
      if (editor.tool === 'wall') {
        // Don't replace existing walls or nodes
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
        return;
      }

      // Path tool - create path tile
      if (editor.tool === 'path') {
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
        return;
      }

      // Decoy tool - create decoy path tile (looks like path but isn't part of solution)
      if (editor.tool === 'decoy') {
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
        return;
      }
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

// Export engine access for advanced use cases
export { getEngine, type PressureEngine, type SoundEffect };
