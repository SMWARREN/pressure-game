// PRESSURE - State Editor
// Debug tool for testing game mechanics by manipulating live game state
// Allows inspecting and modifying tiles, moves, time, compression, mode state, etc.
// Includes replay/step-through debugging similar to ReplayOverlay.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../game/store';
import { Tile, Direction, Level, CompressionDirection, GameStatus } from '../game/types';
import { getModeById, GAME_MODES } from '../game/modes';
import GameGrid from './game/GameGrid';

// ─── Types ────────────────────────────────────────────────────────────────

interface StatePreset {
  name: string;
  timestamp: number;
  state: {
    tiles: Tile[];
    moves: number;
    score: number;
    elapsedSeconds: number;
    wallOffset: number;
    timeUntilCompression: number;
    modeState?: Record<string, unknown>;
    currentLevel: Level | null;
    status: GameStatus;
  };
}

interface HistorySnapshot {
  tiles: Tile[];
  moves: number;
  score: number;
  description: string;
  timestamp: number;
}

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

const COMPRESSION_DIRECTIONS: { dir: CompressionDirection; label: string; title: string }[] = [
  { dir: 'all', label: '⬛', title: 'All sides' },
  { dir: 'top', label: '⬇', title: 'From top' },
  { dir: 'bottom', label: '⬆', title: 'From bottom' },
  { dir: 'left', label: '➡', title: 'From left' },
  { dir: 'right', label: '⬅', title: 'From right' },
  { dir: 'top-bottom', label: '↕', title: 'Top & bottom' },
  { dir: 'left-right', label: '↔', title: 'Left & right' },
  { dir: 'top-left', label: '↘', title: 'Top & left' },
  { dir: 'top-right', label: '↙', title: 'Top & right' },
  { dir: 'bottom-left', label: '↗', title: 'Bottom & left' },
  { dir: 'bottom-right', label: '↖', title: 'Bottom & right' },
  { dir: 'none', label: '○', title: 'No walls' },
];

// ─── Component ────────────────────────────────────────────────────────────

export const StateEditor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'tiles' | 'game' | 'mode' | 'debug' | 'windows' | 'presets'
  >('tiles');
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [presets, setPresets] = useState<StatePreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [wasPausedByEditor, setWasPausedByEditor] = useState(false);

  // Debug/Replay state
  const [debugHistory, setDebugHistory] = useState<HistorySnapshot[]>([]);
  const [debugStep, setDebugStep] = useState(-1);
  const [isDebugPlaying, setIsDebugPlaying] = useState(false);
  const [debugSpeed, setDebugSpeed] = useState(0); // 0=800ms, 1=400ms, 2=200ms
  const debugIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DEBUG_SPEEDS = [800, 400, 200];
  const DEBUG_SPEED_LABELS = ['1×', '2×', '4×'];

  // Get current state from store
  const {
    tiles,
    moves,
    score,
    elapsedSeconds,
    wallOffset,
    timeUntilCompression,
    compressionActive,
    currentLevel,
    currentModeId,
    modeState,
    status,
    history,
    connectedTiles,
    animationsEnabled,
    compressionOverride,
    setGameMode,
    restartLevel,
    toggleAnimations,
    setCompressionOverride,
    advanceWalls,
    checkWin,
  } = useGameStore();

  // Get setters through store
  const setState = useGameStore.setState;

  // Load presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('state-editor-presets');
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = useCallback((newPresets: StatePreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('state-editor-presets', JSON.stringify(newPresets));
  }, []);

  // Show message temporarily
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  // Pause timer when editor opens, resume when it closes
  useEffect(() => {
    if (isOpen && status === 'playing' && !wasPausedByEditor) {
      // Editor opened while playing - pause the game properly
      setWasPausedByEditor(true);
      setState({ isPaused: true });
    } else if (!isOpen && wasPausedByEditor) {
      // Editor closed and we had paused it - resume
      setWasPausedByEditor(false);
      setState({ isPaused: false });
    }
  }, [isOpen, status, wasPausedByEditor, setState]);

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
    [tiles, moves, score]
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

  // Set game state value
  const setGameState = useCallback(
    <K extends keyof ReturnType<typeof useGameStore.getState>>(
      key: K,
      value: ReturnType<typeof useGameStore.getState>[K]
    ) => {
      setState({ [key]: value });
    },
    [setState]
  );

  // Save current state as preset
  const savePreset = useCallback(() => {
    if (!presetName.trim()) {
      showMessage('Enter a preset name');
      return;
    }

    const preset: StatePreset = {
      name: presetName,
      timestamp: Date.now(),
      state: {
        tiles: tiles.map((t) => ({ ...t, connections: [...t.connections] })),
        moves,
        score,
        elapsedSeconds,
        wallOffset,
        timeUntilCompression,
        modeState: modeState ? { ...modeState } : undefined,
        currentLevel: currentLevel ? { ...currentLevel } : null,
        status,
      },
    };

    const newPresets = [...presets.filter((p) => p.name !== presetName), preset];
    savePresetsToStorage(newPresets);
    setPresetName('');
    showMessage(`Preset "${presetName}" saved!`);
  }, [
    presetName,
    tiles,
    moves,
    score,
    elapsedSeconds,
    wallOffset,
    timeUntilCompression,
    modeState,
    currentLevel,
    status,
    presets,
    savePresetsToStorage,
    showMessage,
  ]);

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

  // Export state as JSON
  const exportState = useCallback(() => {
    const stateData = {
      tiles: tiles.map((t) => ({
        id: t.id,
        type: t.type,
        x: t.x,
        y: t.y,
        connections: t.connections,
        isGoalNode: t.isGoalNode,
        canRotate: t.canRotate,
        isDecoy: t.isDecoy,
      })),
      moves,
      score,
      elapsedSeconds,
      wallOffset,
      timeUntilCompression,
      modeState,
      currentLevel: currentLevel
        ? {
            id: currentLevel.id,
            name: currentLevel.name,
            gridSize: currentLevel.gridSize,
            gridCols: currentLevel.gridCols,
            gridRows: currentLevel.gridRows,
            maxMoves: currentLevel.maxMoves,
            goalNodes: currentLevel.goalNodes,
            compressionDirection: currentLevel.compressionDirection,
          }
        : null,
      currentModeId,
      status,
    };

    const json = JSON.stringify(stateData, null, 2);
    navigator.clipboard.writeText(json);
    showMessage('State copied to clipboard!');
  }, [
    tiles,
    moves,
    score,
    elapsedSeconds,
    wallOffset,
    timeUntilCompression,
    modeState,
    currentLevel,
    currentModeId,
    status,
    showMessage,
  ]);

  // ── Debug/Replay Controls ───────────────────────────────────────────────

  // Go to specific debug step
  const goToDebugStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= debugHistory.length) return;
      const snapshot = debugHistory[step];
      setState({
        tiles: snapshot.tiles,
        moves: snapshot.moves,
        score: snapshot.score,
      });
      setDebugStep(step);
      setIsDebugPlaying(false);
    },
    [debugHistory, setState]
  );

  // Step forward/backward
  const stepBackward = useCallback(() => {
    if (debugStep > 0) goToDebugStep(debugStep - 1);
  }, [debugStep, goToDebugStep]);

  const stepForward = useCallback(() => {
    if (debugStep < debugHistory.length - 1) goToDebugStep(debugStep + 1);
  }, [debugStep, debugHistory.length, goToDebugStep]);

  // Auto-play effect
  useEffect(() => {
    if (debugIntervalRef.current) clearInterval(debugIntervalRef.current);
    if (!isDebugPlaying) return;

    debugIntervalRef.current = setInterval(() => {
      setDebugStep((prev) => {
        if (prev >= debugHistory.length - 1) {
          setIsDebugPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const snapshot = debugHistory[next];
        setState({
          tiles: snapshot.tiles,
          moves: snapshot.moves,
          score: snapshot.score,
        });
        return next;
      });
    }, DEBUG_SPEEDS[debugSpeed]);

    return () => {
      if (debugIntervalRef.current) clearInterval(debugIntervalRef.current);
    };
  }, [isDebugPlaying, debugSpeed, debugHistory, setState]);

  // Clear debug history
  const clearDebugHistory = useCallback(() => {
    setDebugHistory([]);
    setDebugStep(-1);
    setIsDebugPlaying(false);
    showMessage('Debug history cleared');
  }, [showMessage]);

  // ── Trigger Win/Lose ─────────────────────────────────────────────────────

  const triggerWin = useCallback(() => {
    setState({ status: 'won', showingWin: true });
    showMessage('Triggered WIN state');
    captureDebugSnapshot('Triggered WIN');
  }, [setState, showMessage, captureDebugSnapshot]);

  const triggerLose = useCallback(
    (reason?: string) => {
      setState({ status: 'lost', lossReason: reason ?? 'Debug triggered' });
      showMessage('Triggered LOSE state');
      captureDebugSnapshot('Triggered LOSE');
    },
    [setState, showMessage, captureDebugSnapshot]
  );

  // ── Compression Direction ───────────────────────────────────────────────

  const setCompressionDirection = useCallback(
    (dir: CompressionDirection) => {
      if (!currentLevel) return;
      const updatedLevel = { ...currentLevel, compressionDirection: dir };
      setState({ currentLevel: updatedLevel });
      showMessage(`Compression: ${dir}`);
    },
    [currentLevel, setState, showMessage]
  );

  // Get selected tile
  const selectedTileData = selectedTile
    ? tiles.find((t) => t.x === selectedTile.x && t.y === selectedTile.y)
    : null;

  // Get current mode info
  const currentMode = getModeById(currentModeId);

  // Calculate board size - match actual game logic
  const gridSize = currentLevel?.gridSize ?? 5;
  const gridCols = currentLevel?.gridCols ?? gridSize;
  const gridRows = currentLevel?.gridRows ?? gridSize;
  const maxDim = Math.max(gridCols, gridRows);

  // Match GameBoard's responsive sizing
  const boardPx = Math.min(250, globalThis.innerWidth - 400);
  const gap = maxDim >= 9 ? 2 : maxDim > 5 ? 3 : 4;
  const padding = maxDim >= 9 ? 4 : maxDim > 5 ? 8 : 10;
  const tileSizeByW = Math.floor((boardPx - padding * 2 - gap * (gridCols - 1)) / gridCols);
  const tileSizeByH = Math.floor((boardPx - padding * 2 - gap * (gridRows - 1)) / gridRows);
  const tileSize = Math.max(1, Math.min(tileSizeByW, tileSizeByH));

  // Handle tile click in grid
  const handleTileClick = useCallback((x: number, y: number) => {
    setSelectedTile({ x, y });
  }, []);

  // Hint tiles for selection
  const hintTiles = selectedTile ? new Set([`${selectedTile.x},${selectedTile.y}`]) : undefined;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          padding: '8px 16px',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 12,
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        }}
      >
        🛠️ State Editor
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 380,
        height: '100vh',
        background: '#0a0a1a',
        borderLeft: '1px solid #1e1e3a',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #1e1e3a',
          background: '#0d0d20',
        }}
      >
        <span style={{ fontWeight: 700, color: '#6366f1' }}>🛠️ State Editor</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ×
        </button>
      </div>

      {/* Hero Stats Section */}
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #0d0d20 0%, #12122a 100%)',
          borderBottom: '1px solid #1e1e3a',
        }}
      >
        {/* Mode & Level */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>{currentMode?.icon ?? '🎮'}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc' }}>
              {currentMode?.name ?? currentModeId}
            </span>
          </div>
          <div
            style={{
              padding: '3px 8px',
              borderRadius: 10,
              background:
                status === 'playing'
                  ? '#10b98120'
                  : status === 'won'
                    ? '#22c55e20'
                    : status === 'lost'
                      ? '#ef444420'
                      : '#f59e0b20',
              border: `1px solid ${status === 'playing' ? '#10b98140' : status === 'won' ? '#22c55e40' : status === 'lost' ? '#ef444440' : '#f59e0b40'}`,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.05em',
                color:
                  status === 'playing'
                    ? '#10b981'
                    : status === 'won'
                      ? '#22c55e'
                      : status === 'lost'
                        ? '#ef4444'
                        : '#f59e0b',
              }}
            >
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {/* Moves */}
          <div
            style={{
              background: '#0a0a15',
              borderRadius: 10,
              padding: '10px 8px',
              textAlign: 'center',
              border: '1px solid #1e1e35',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: '#4a4a6a',
                marginBottom: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Moves
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{moves}</div>
            {currentLevel?.maxMoves && (
              <div style={{ fontSize: 9, color: '#3a3a55' }}>/ {currentLevel.maxMoves}</div>
            )}
          </div>

          {/* Time */}
          <div
            style={{
              background: '#0a0a15',
              borderRadius: 10,
              padding: '10px 8px',
              textAlign: 'center',
              border: '1px solid #1e1e35',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: '#4a4a6a',
                marginBottom: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Time
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>
              {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
            </div>
            {timeUntilCompression > 0 && (
              <div style={{ fontSize: 9, color: '#ef4444' }}>⚡ {timeUntilCompression}s</div>
            )}
          </div>

          {/* Score */}
          <div
            style={{
              background: '#0a0a15',
              borderRadius: 10,
              padding: '10px 8px',
              textAlign: 'center',
              border: '1px solid #1e1e35',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: '#4a4a6a',
                marginBottom: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Score
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>
              {score.toLocaleString()}
            </div>
            {currentLevel?.targetScore && (
              <div style={{ fontSize: 9, color: '#3a3a55' }}>
                / {currentLevel.targetScore.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Level Name */}
        {currentLevel && (
          <div
            style={{
              marginTop: 10,
              padding: '6px 10px',
              background: '#0a0a15',
              borderRadius: 6,
              border: '1px solid #1e1e35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 10, color: '#6a6a8a' }}>Level:</span>
            <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>
              {currentLevel.name ?? `Level ${currentLevel.id}`}
            </span>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: '8px 16px',
            background: '#1e1e3a',
            color: '#10b981',
            fontSize: 12,
          }}
        >
          {message}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e1e3a',
        }}
      >
        {(['tiles', 'game', 'mode', 'debug', 'windows', 'presets'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === tab ? '#1e1e3a' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#6366f1' : '#666',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
        }}
      >
        {/* TILES TAB */}
        {activeTab === 'tiles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Mini Grid */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Grid Preview ({gridCols}×{gridRows}) - click to select
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    position: 'relative',
                    width: boardPx,
                    height: boardPx,
                    maxWidth: 250,
                    maxHeight: 250,
                    background: 'linear-gradient(145deg, #0a0a16, #07070e)',
                    borderRadius: 12,
                    padding,
                    border: '2px solid #12122a',
                  }}
                >
                  <GameGrid
                    tiles={tiles}
                    gridSize={gridSize}
                    gridCols={gridCols}
                    gridRows={gridRows}
                    compressionDirection={currentLevel?.compressionDirection ?? 'all'}
                    gap={gap}
                    tileSize={tileSize}
                    wallOffset={wallOffset}
                    wallsJustAdvanced={false}
                    compressionActive={compressionActive}
                    hintPos={null}
                    hintTiles={hintTiles}
                    status={status}
                    onTileTap={handleTileClick}
                    animationsEnabled={false}
                    editorMode={true}
                  />
                </div>
              </div>
            </div>

            {/* Selected Tile */}
            {selectedTileData && (
              <div
                style={{
                  background: '#0d0d20',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid #1e1e3a',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: '#666',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Selected Tile ({selectedTileData.x}, {selectedTileData.y})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#fff' }}>
                    Type: <span style={{ color: '#6366f1' }}>{selectedTileData.type}</span>
                  </div>

                  {/* Connections */}
                  <div>
                    <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Connections</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {DIRECTIONS.map((dir) => (
                        <button
                          key={dir}
                          onClick={() => {
                            const hasConn = selectedTileData.connections.includes(dir);
                            const newConns = hasConn
                              ? selectedTileData.connections.filter((c) => c !== dir)
                              : [...selectedTileData.connections, dir];
                            updateTileConnections(selectedTileData.x, selectedTileData.y, newConns);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: selectedTileData.connections.includes(dir)
                              ? '#10b981'
                              : '#1e1e3a',
                            color: selectedTileData.connections.includes(dir) ? '#fff' : '#666',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 10,
                            textTransform: 'capitalize',
                          }}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Properties */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: '#fff',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTileData.isGoalNode}
                        onChange={() =>
                          toggleTileProperty(selectedTileData.x, selectedTileData.y, 'isGoalNode')
                        }
                      />
                      Goal Node
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: '#fff',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTileData.canRotate}
                        onChange={() =>
                          toggleTileProperty(selectedTileData.x, selectedTileData.y, 'canRotate')
                        }
                      />
                      Can Rotate
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: '#fff',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTileData.isDecoy ?? false}
                        onChange={() =>
                          toggleTileProperty(selectedTileData.x, selectedTileData.y, 'isDecoy')
                        }
                      />
                      Decoy
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tile Stats */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Tile Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Total: <span style={{ color: '#6366f1' }}>{tiles.length}</span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Paths:{' '}
                  <span style={{ color: '#6366f1' }}>
                    {tiles.filter((t) => t.type === 'path').length}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Nodes:{' '}
                  <span style={{ color: '#6366f1' }}>
                    {tiles.filter((t) => t.type === 'node').length}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Walls:{' '}
                  <span style={{ color: '#6366f1' }}>
                    {tiles.filter((t) => t.type === 'wall').length}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Goal Nodes:{' '}
                  <span style={{ color: '#10b981' }}>
                    {tiles.filter((t) => t.isGoalNode).length}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Connected:{' '}
                  <span style={{ color: connectedTiles?.size ? '#10b981' : '#666' }}>
                    {connectedTiles?.size ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GAME TAB */}
        {activeTab === 'game' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Status */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Game Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Status:{' '}
                  <span
                    style={{
                      color:
                        status === 'playing'
                          ? '#10b981'
                          : status === 'won'
                            ? '#22c55e'
                            : status === 'lost'
                              ? '#ef4444'
                              : '#f59e0b',
                    }}
                  >
                    {status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Mode:{' '}
                  <span style={{ color: '#6366f1' }}>{currentMode?.name ?? currentModeId}</span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Level: <span style={{ color: '#6366f1' }}>{currentLevel?.name ?? 'None'}</span>
                </div>
              </div>
            </div>

            {/* Moves & Score */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Moves & Score
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Moves</span>
                  <input
                    type="number"
                    value={moves}
                    onChange={(e) => setGameState('moves', Number.parseInt(e.target.value) || 0)}
                    style={{
                      width: 60,
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: '#1e1e3a',
                      border: '1px solid #2a2a4a',
                      color: '#fff',
                      fontSize: 12,
                    }}
                  />
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Score</span>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setGameState('score', Number.parseInt(e.target.value) || 0)}
                    style={{
                      width: 60,
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: '#1e1e3a',
                      border: '1px solid #2a2a4a',
                      color: '#fff',
                      fontSize: 12,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Max Moves:{' '}
                  <span style={{ color: '#6366f1' }}>{currentLevel?.maxMoves ?? 'N/A'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  History: <span style={{ color: '#6366f1' }}>{history.length} states</span>
                </div>
              </div>
            </div>

            {/* Time & Compression */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Time & Compression
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Elapsed (s)</span>
                  <input
                    type="number"
                    value={elapsedSeconds}
                    onChange={(e) =>
                      setGameState('elapsedSeconds', Number.parseInt(e.target.value) || 0)
                    }
                    style={{
                      width: 60,
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: '#1e1e3a',
                      border: '1px solid #2a2a4a',
                      color: '#fff',
                      fontSize: 12,
                    }}
                  />
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Compression in (s)</span>
                  <input
                    type="number"
                    value={timeUntilCompression}
                    onChange={(e) =>
                      setGameState('timeUntilCompression', Number.parseInt(e.target.value) || 0)
                    }
                    style={{
                      width: 60,
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: '#1e1e3a',
                      border: '1px solid #2a2a4a',
                      color: '#fff',
                      fontSize: 12,
                    }}
                  />
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Wall Offset</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => setGameState('wallOffset', Math.max(0, wallOffset - 1))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: '#1e1e3a',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span style={{ width: 20, textAlign: 'center', color: '#fff' }}>
                      {wallOffset}
                    </span>
                    <button
                      onClick={() => setGameState('wallOffset', wallOffset + 1)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: '#1e1e3a',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={compressionActive}
                    onChange={(e) => setGameState('compressionActive', e.target.checked)}
                  />
                  <span style={{ fontSize: 12, color: '#fff' }}>Compression Active</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      captureDebugSnapshot('Before advance walls');
                      advanceWalls();
                      showMessage('Walls advanced');
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ⚡ Advance Walls
                  </button>
                  <button
                    onClick={() => {
                      if (wallOffset > 0) {
                        setGameState('wallOffset', wallOffset - 1);
                        captureDebugSnapshot('Retreated walls');
                        showMessage('Walls retreated');
                      }
                    }}
                    disabled={wallOffset === 0}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: wallOffset === 0 ? '#1e1e3a' : '#6366f1',
                      color: wallOffset === 0 ? '#444' : '#fff',
                      border: 'none',
                      cursor: wallOffset === 0 ? 'default' : 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ◀ Retreat Walls
                  </button>
                </div>
              </div>
            </div>

            {/* Compression Direction */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Wall Direction
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {COMPRESSION_DIRECTIONS.map(({ dir, label, title }) => {
                  const isActive = (currentLevel?.compressionDirection ?? 'all') === dir;
                  return (
                    <button
                      key={dir}
                      onClick={() => setCompressionDirection(dir)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: isActive ? '1px solid #ef4444' : '1px solid #12122a',
                        background: isActive ? 'rgba(239,68,68,0.2)' : '#07070e',
                        color: isActive ? '#ef4444' : '#a5b4fc',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={title}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Toggles */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Settings
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Animations</span>
                  <input type="checkbox" checked={animationsEnabled} onChange={toggleAnimations} />
                </label>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Compression Override</span>
                  <select
                    value={
                      compressionOverride === null ? 'default' : compressionOverride ? 'on' : 'off'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompressionOverride(val === 'default' ? null : val === 'on');
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: '#1e1e3a',
                      border: '1px solid #2a2a4a',
                      color: '#fff',
                      fontSize: 11,
                    }}
                  >
                    <option value="default">Default</option>
                    <option value="on">Force On</option>
                    <option value="off">Force Off</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={restartLevel}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                🔄 Restart Level
              </button>
              <button
                onClick={exportState}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                📋 Copy State to Clipboard
              </button>
            </div>
          </div>
        )}

        {/* MODE TAB */}
        {activeTab === 'mode' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Mode Info */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Current Mode
              </div>
              <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 600, marginBottom: 4 }}>
                {currentMode.icon} {currentMode.name}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {currentMode.description ?? 'No description'}
              </div>
            </div>

            {/* Mode State */}
            {modeState && Object.keys(modeState).length !== 0 && (
              <div
                style={{
                  background: '#0d0d20',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid #1e1e3a',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: '#666',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Mode State
                </div>
                <pre
                  style={{
                    fontSize: 10,
                    color: '#fff',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(modeState, null, 2)}
                </pre>
              </div>
            )}

            {/* Mode Selector */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Switch Mode
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: currentModeId === mode.id ? '#6366f1' : '#1e1e3a',
                      color: currentModeId === mode.id ? '#fff' : '#888',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {mode.icon} {mode.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DEBUG TAB */}
        {activeTab === 'debug' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Debug Controls */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Step-Through Debug
              </div>

              {/* Playback controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <button
                  onClick={() => goToDebugStep(0)}
                  disabled={debugStep <= 0}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: debugStep <= 0 ? '#1e1e3a' : '#2a2a4a',
                    border: 'none',
                    color: debugStep <= 0 ? '#444' : '#fff',
                    cursor: debugStep <= 0 ? 'default' : 'pointer',
                    fontSize: 14,
                  }}
                >
                  ⏮
                </button>
                <button
                  onClick={stepBackward}
                  disabled={debugStep <= 0}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: debugStep <= 0 ? '#1e1e3a' : '#2a2a4a',
                    border: 'none',
                    color: debugStep <= 0 ? '#444' : '#fff',
                    cursor: debugStep <= 0 ? 'default' : 'pointer',
                    fontSize: 14,
                  }}
                >
                  ⏪
                </button>
                <button
                  onClick={() => {
                    if (debugStep >= debugHistory.length - 1) {
                      goToDebugStep(0);
                      setIsDebugPlaying(true);
                    } else {
                      setIsDebugPlaying(!isDebugPlaying);
                    }
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: isDebugPlaying
                      ? '#ef4444'
                      : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  {isDebugPlaying ? '⏸' : '▶'}
                </button>
                <button
                  onClick={stepForward}
                  disabled={debugStep >= debugHistory.length - 1}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: debugStep >= debugHistory.length - 1 ? '#1e1e3a' : '#2a2a4a',
                    border: 'none',
                    color: debugStep >= debugHistory.length - 1 ? '#444' : '#fff',
                    cursor: debugStep >= debugHistory.length - 1 ? 'default' : 'pointer',
                    fontSize: 14,
                  }}
                >
                  ⏩
                </button>
                <button
                  onClick={() => goToDebugStep(debugHistory.length - 1)}
                  disabled={debugStep >= debugHistory.length - 1}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: debugStep >= debugHistory.length - 1 ? '#1e1e3a' : '#2a2a4a',
                    border: 'none',
                    color: debugStep >= debugHistory.length - 1 ? '#444' : '#fff',
                    cursor: debugStep >= debugHistory.length - 1 ? 'default' : 'pointer',
                    fontSize: 14,
                  }}
                >
                  ⏭
                </button>
                <button
                  onClick={() => setDebugSpeed((s) => (s + 1) % 3)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#fbbf2420',
                    border: '1px solid #fbbf2440',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {DEBUG_SPEED_LABELS[debugSpeed]}
                </button>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10,
                    color: '#666',
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {debugStep < 0
                      ? 'No history'
                      : `Step ${debugStep + 1} / ${debugHistory.length}`}
                  </span>
                  <span>{debugHistory.length} snapshots</span>
                </div>
                <div
                  style={{ height: 4, background: '#1e1e3a', borderRadius: 2, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width:
                        debugHistory.length > 0
                          ? `${((debugStep + 1) / debugHistory.length) * 100}%`
                          : '0%',
                      background: '#6366f1',
                      borderRadius: 2,
                      transition: 'width 0.15s ease',
                    }}
                  />
                </div>
              </div>

              {/* Capture & Clear */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => captureDebugSnapshot(`Manual capture #${debugHistory.length + 1}`)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  📸 Capture State
                </button>
                <button
                  onClick={clearDebugHistory}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  🗑️ Clear
                </button>
              </div>
            </div>

            {/* Trigger Win/Lose */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Trigger Game End
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={triggerWin}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  ✦ Trigger WIN
                </button>
                <button
                  onClick={() => triggerLose()}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  ✕ Trigger LOSE
                </button>
              </div>
            </div>

            {/* Check Win */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Win Check
              </div>
              <button
                onClick={() => {
                  const won = checkWin();
                  showMessage(won ? 'Win condition met!' : 'Win condition NOT met');
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                🔍 Check Win Condition
              </button>
            </div>

            {/* History List */}
            {debugHistory.length > 0 && (
              <div
                style={{
                  background: '#0d0d20',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid #1e1e3a',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: '#666',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  History
                </div>
                <div
                  style={{
                    maxHeight: 200,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {debugHistory.map((snap, i) => (
                    <button
                      key={snap.timestamp}
                      onClick={() => goToDebugStep(i)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: debugStep === i ? '#6366f1' : '#1e1e3a',
                        border: 'none',
                        color: debugStep === i ? '#fff' : '#888',
                        cursor: 'pointer',
                        fontSize: 11,
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{snap.description}</span>
                      <span style={{ color: '#666' }}>
                        m:{snap.moves} s:{snap.score}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WINDOWS TAB */}
        {activeTab === 'windows' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Current State Windows */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Game State Windows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>Status</span>
                  <span
                    style={{
                      fontSize: 11,
                      color:
                        status === 'playing'
                          ? '#10b981'
                          : status === 'won'
                            ? '#22c55e'
                            : status === 'lost'
                              ? '#ef4444'
                              : '#f59e0b',
                      fontWeight: 600,
                    }}
                  >
                    {status.toUpperCase()}
                  </span>
                </div>

                {/* Quick state buttons */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setState({ status: 'idle' });
                      showMessage('Set status to IDLE');
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: status === 'idle' ? '#f59e0b' : '#1e1e3a',
                      color: status === 'idle' ? '#fff' : '#888',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Idle
                  </button>
                  <button
                    onClick={() => {
                      setState({ status: 'playing', isPaused: false });
                      showMessage('Set status to PLAYING');
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: status === 'playing' ? '#10b981' : '#1e1e3a',
                      color: status === 'playing' ? '#fff' : '#888',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Playing
                  </button>
                  <button
                    onClick={() => {
                      setState({ status: 'won', showingWin: true });
                      showMessage('Set status to WON');
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: status === 'won' ? '#22c55e' : '#1e1e3a',
                      color: status === 'won' ? '#fff' : '#888',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Won
                  </button>
                  <button
                    onClick={() => {
                      setState({ status: 'lost', lossReason: 'Debug triggered' });
                      showMessage('Set status to LOST');
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: status === 'lost' ? '#ef4444' : '#1e1e3a',
                      color: status === 'lost' ? '#fff' : '#888',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Lost
                  </button>
                </div>
              </div>
            </div>

            {/* Overlay Controls */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Overlay Controls
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>isPaused</span>
                  <input
                    type="checkbox"
                    checked={useGameStore.getState().isPaused ?? false}
                    onChange={(e) => setState({ isPaused: e.target.checked })}
                  />
                </label>
                <label
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>showingWin</span>
                  <input
                    type="checkbox"
                    checked={useGameStore.getState().showingWin ?? false}
                    onChange={(e) => setState({ showingWin: e.target.checked })}
                  />
                </label>
                <label
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>showTutorial</span>
                  <input
                    type="checkbox"
                    checked={useGameStore.getState().showTutorial ?? false}
                    onChange={(e) => setState({ showTutorial: e.target.checked })}
                  />
                </label>
              </div>
            </div>

            {/* Hub/Menu Screens */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Hub/Menu Screens
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>showArcadeHub</span>
                  <input
                    type="checkbox"
                    checked={useGameStore.getState().showArcadeHub ?? false}
                    onChange={(e) => setState({ showArcadeHub: e.target.checked })}
                  />
                </label>
                <label
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>showPressureHub</span>
                  <input
                    type="checkbox"
                    checked={useGameStore.getState().showPressureHub ?? false}
                    onChange={(e) => setState({ showPressureHub: e.target.checked })}
                  />
                </label>
                <label
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 12, color: '#fff' }}>editor.enabled</span>
                  <input
                    type="checkbox"
                    checked={useGameStore.getState().editor?.enabled ?? false}
                    onChange={(e) => {
                      const currentEditor = useGameStore.getState().editor;
                      setState({ editor: { ...currentEditor, enabled: e.target.checked } });
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Loss Reason */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Loss Reason
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#fff' }}>
                  Current:{' '}
                  <span style={{ color: '#ef4444' }}>
                    {useGameStore.getState().lossReason ?? 'None'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    'out_of_moves',
                    'out_of_time',
                    'crushed',
                    'bomb_exploded',
                    'virus_spread',
                    'Debug triggered',
                  ].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => {
                        setState({ lossReason: reason });
                        showMessage(`Set loss reason: ${reason}`);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: '#1e1e3a',
                        color: '#ef4444',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 9,
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Quick Actions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => {
                    setState({
                      status: 'playing',
                      isPaused: false,
                      showingWin: false,
                      showArcadeHub: false,
                      showPressureHub: false,
                      showTutorial: false,
                    });
                    showMessage('Cleared all overlays - back to game');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  ✕ Clear All Overlays
                </button>
                <button
                  onClick={() => {
                    setState({
                      status: 'idle',
                      showArcadeHub: true,
                    });
                    showMessage('Show Arcade Hub');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  🎮 Show Arcade Hub
                </button>
                <button
                  onClick={() => {
                    setState({
                      status: 'playing',
                      isPaused: true,
                    });
                    showMessage('Paused game');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  ⏸ Pause Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Save Preset */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Save Current State
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#1e1e3a',
                    border: '1px solid #2a2a4a',
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <button
                  onClick={savePreset}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Quick Actions
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setGameState('moves', 0);
                    setGameState('score', 0);
                    setGameState('elapsedSeconds', 0);
                    setGameState('wallOffset', 0);
                    showMessage('Reset counters');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: '#1e1e3a',
                    color: '#a5b4fc',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Reset Counters
                </button>
                <button
                  onClick={() => {
                    setGameState('moves', (currentLevel?.maxMoves ?? 10) - 1);
                    showMessage('Set moves to max-1');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: '#1e1e3a',
                    color: '#f59e0b',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Near Limit
                </button>
                <button
                  onClick={() => {
                    setGameState('score', (currentLevel?.targetScore ?? 1000) - 10);
                    showMessage('Set score near target');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: '#1e1e3a',
                    color: '#22c55e',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Near Target
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div
              style={{
                background: '#0d0d20',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #1e1e3a',
              }}
            >
              <div
                style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}
              >
                Saved Presets ({presets.length})
              </div>
              {presets.length === 0 ? (
                <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: 16 }}>
                  No presets saved yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {presets.map((preset) => (
                    <div
                      key={preset.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#1e1e3a',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: '#fff' }}>{preset.name}</div>
                        <div style={{ fontSize: 10, color: '#666' }}>
                          {new Date(preset.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => loadPreset(preset)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: '#6366f1',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 10,
                          }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deletePreset(preset.name)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 10,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateEditor;
