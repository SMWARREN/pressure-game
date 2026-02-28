// PRESSURE - Level Editor
// Visual level editor for creating and editing game levels
// Uses the same GameGrid/GameTile components as the main game for consistent visuals

import React, { useState, useCallback, useMemo } from 'react';
import { Level, Tile, Position, Direction, TileType } from '../game/types';
import { verifyLevel } from '../game/levels';
import { GAME_MODES } from '../game/modes';
import GameGrid from './game/GameGrid';

// ─── Types ────────────────────────────────────────────────────────────────

type ToolType = 'node' | 'path' | 'wall' | 'eraser' | 'select';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

const CONNECTION_PRESETS: { name: string; connections: Direction[] }[] = [
  { name: '─', connections: ['left', 'right'] },
  { name: '│', connections: ['up', 'down'] },
  { name: '┌', connections: ['down', 'right'] },
  { name: '┐', connections: ['down', 'left'] },
  { name: '└', connections: ['up', 'right'] },
  { name: '┘', connections: ['up', 'left'] },
  { name: '├', connections: ['up', 'down', 'right'] },
  { name: '┤', connections: ['up', 'down', 'left'] },
  { name: '┬', connections: ['down', 'left', 'right'] },
  { name: '┴', connections: ['up', 'left', 'right'] },
  { name: '┼', connections: ['up', 'down', 'left', 'right'] },
];

// ─── Component ────────────────────────────────────────────────────────────

export const LevelEditor: React.FC = () => {
  const [gridSize, setGridSize] = useState(5);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('path');
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [levelName, setLevelName] = useState('My Level');
  const [worldId, setWorldId] = useState(1);
  const [maxMoves, setMaxMoves] = useState(10);
  const [compressionDelay, setCompressionDelay] = useState(5000);
  const [selectedMode, setSelectedMode] = useState('classic');
  const [message, setMessage] = useState<string | null>(null);

  const modes = GAME_MODES;

  // Create initial walls for a new grid
  const initializeGrid = useCallback((size: number) => {
    const newTiles: Tile[] = [];
    for (let i = 0; i < size; i++) {
      newTiles.push({
        id: `wall-${i}-0`,
        type: 'wall',
        x: i,
        y: 0,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
      newTiles.push({
        id: `wall-${i}-${size - 1}`,
        type: 'wall',
        x: i,
        y: size - 1,
        connections: [],
        isGoalNode: false,
        canRotate: false,
      });
      if (i > 0 && i < size - 1) {
        newTiles.push({
          id: `wall-0-${i}`,
          type: 'wall',
          x: 0,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
        newTiles.push({
          id: `wall-${size - 1}-${i}`,
          type: 'wall',
          x: size - 1,
          y: i,
          connections: [],
          isGoalNode: false,
          canRotate: false,
        });
      }
    }
    setTiles(newTiles);
  }, []);

  // Initialize grid on first load
  React.useEffect(() => {
    initializeGrid(gridSize);
  }, []);

  // Handle grid size change
  const handleGridSizeChange = (newSize: number) => {
    setGridSize(newSize);
    initializeGrid(newSize);
    setSelectedTile(null);
  };

  // Get tile at position
  const getTileAt = useCallback(
    (x: number, y: number): Tile | undefined => {
      return tiles.find((t) => t.x === x && t.y === y);
    },
    [tiles]
  );

  // Handle cell click - this is passed to GameGrid
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const existingTile = getTileAt(x, y);

      if (selectedTool === 'eraser') {
        if (existingTile && existingTile.type !== 'wall') {
          setTiles(tiles.filter((t) => t.id !== existingTile.id));
          if (selectedTile?.id === existingTile.id) {
            setSelectedTile(null);
          }
        }
        return;
      }

      if (selectedTool === 'select') {
        if (existingTile) {
          setSelectedTile(existingTile);
        }
        return;
      }

      // Remove existing tile at this position (except walls when placing walls)
      let newTiles = tiles.filter((t) => !(t.x === x && t.y === y));

      // Create new tile
      const newTile: Tile = {
        id: `${selectedTool}-${x}-${y}-${Date.now()}`,
        type: selectedTool as TileType,
        x,
        y,
        connections:
          selectedTool === 'node'
            ? ['up', 'down', 'left', 'right']
            : selectedTool === 'path'
              ? ['left', 'right']
              : [],
        isGoalNode: selectedTool === 'node',
        canRotate: selectedTool === 'path',
      };

      newTiles.push(newTile);
      setTiles(newTiles);
      setSelectedTile(newTile);
    },
    [tiles, selectedTool, selectedTile, getTileAt]
  );

  // Update selected tile
  const updateSelectedTile = useCallback(
    (updates: Partial<Tile>) => {
      if (!selectedTile) return;
      setTiles(tiles.map((t) => (t.id === selectedTile.id ? { ...t, ...updates } : t)));
      setSelectedTile({ ...selectedTile, ...updates });
    },
    [selectedTile, tiles]
  );

  // Toggle connection
  const toggleConnection = useCallback(
    (dir: Direction) => {
      if (!selectedTile) return;
      const hasConnection = selectedTile.connections.includes(dir);
      const newConnections = hasConnection
        ? selectedTile.connections.filter((c) => c !== dir)
        : [...selectedTile.connections, dir];
      updateSelectedTile({ connections: newConnections });
    },
    [selectedTile, updateSelectedTile]
  );

  // Get goal nodes
  const getGoalNodes = useCallback((): Position[] => {
    return tiles.filter((t) => t.isGoalNode).map((t) => ({ x: t.x, y: t.y }));
  }, [tiles]);

  // Verify level
  const handleVerify = useCallback(() => {
    const level: Level = {
      id: Date.now(),
      name: levelName,
      world: worldId,
      gridSize,
      tiles,
      maxMoves,
      compressionDelay,
      goalNodes: getGoalNodes(),
    };

    const result = verifyLevel(level);
    if (result.solvable) {
      setMessage(`✓ Level is solvable! Min moves: ${result.minMoves}`);
    } else {
      setMessage('✗ Level is not solvable. Check connections and goal nodes.');
    }
  }, [gridSize, tiles, maxMoves, compressionDelay, levelName, worldId, getGoalNodes]);

  // Export level as JSON
  const handleExport = useCallback(() => {
    const level: Level = {
      id: Date.now(),
      name: levelName,
      world: worldId,
      gridSize,
      tiles,
      maxMoves,
      compressionDelay,
      goalNodes: getGoalNodes(),
    };

    const json = JSON.stringify(level, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${levelName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Level exported!');
  }, [gridSize, tiles, maxMoves, compressionDelay, levelName, worldId, getGoalNodes]);

  // Generate TypeScript code
  const generateCode = useCallback((): string => {
    const tilesStr = tiles
      .map((t) => {
        const conns =
          t.connections.length > 0 ? `[${t.connections.map((c) => `'${c}'`).join(', ')}]` : '[]';
        return `    {
      id: '${t.id}',
      type: '${t.type}',
      x: ${t.x},
      y: ${t.y},
      connections: ${conns} as Direction[],
      isGoalNode: ${t.isGoalNode},
      canRotate: ${t.canRotate},
    }`;
      })
      .join(',\n');

    const goalsStr = getGoalNodes()
      .map((g) => `{ x: ${g.x}, y: ${g.y} }`)
      .join(', ');

    return `{
  id: ${Date.now()},
  name: '${levelName}',
  world: ${worldId},
  gridSize: ${gridSize},
  tiles: [
${tilesStr}
  ],
  compressionDelay: ${compressionDelay},
  maxMoves: ${maxMoves},
  goalNodes: [${goalsStr}],
}`;
  }, [tiles, levelName, worldId, gridSize, compressionDelay, maxMoves, getGoalNodes]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(generateCode());
    setMessage('Code copied to clipboard!');
  }, [generateCode]);

  // Calculate board size based on grid size
  const boardPx = useMemo(() => {
    const baseSize = Math.min(400, globalThis.innerWidth - 340);
    return Math.max(200, baseSize);
  }, [gridSize]);

  const gap = gridSize >= 9 ? 2 : gridSize > 5 ? 3 : 4;
  const padding = gridSize >= 9 ? 4 : gridSize > 5 ? 8 : 10;
  const tileSize = Math.floor((boardPx - padding * 2 - gap * (gridSize - 1)) / gridSize);

  // Get hint tiles for highlighting selected tile
  const hintTiles = useMemo(() => {
    if (!selectedTile) return undefined;
    const set = new Set<string>();
    set.add(`${selectedTile.x},${selectedTile.y}`);
    return set;
  }, [selectedTile]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Level Editor</h1>

      {/* Message */}
      {message && <div className="mb-4 p-2 bg-gray-700 rounded text-sm">{message}</div>}

      <div className="flex gap-6">
        {/* Left Panel - Tools */}
        <div className="w-64 space-y-4">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm mb-1">Game Mode</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-gray-700 rounded p-2"
            >
              {modes.map((mode: { id: string; name: string }) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Size */}
          <div>
            <label className="block text-sm mb-1">Grid Size</label>
            <input
              type="number"
              min={4}
              max={12}
              value={gridSize}
              onChange={(e) => handleGridSizeChange(Number.parseInt(e.target.value) || 5)}
              className="w-full bg-gray-700 rounded p-2"
            />
          </div>

          {/* Tools */}
          <div>
            <label className="block text-sm mb-1">Tools</label>
            <div className="grid grid-cols-2 gap-2">
              {(['select', 'node', 'path', 'wall', 'eraser'] as ToolType[]).map((tool) => (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`
                    p-2 rounded text-sm capitalize
                    ${selectedTool === tool ? 'bg-blue-600' : 'bg-gray-700'}
                  `}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Connection Presets */}
          {selectedTile && selectedTile.type === 'path' && (
            <div>
              <label className="block text-sm mb-1">Connections</label>
              <div className="grid grid-cols-4 gap-1">
                {CONNECTION_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateSelectedTile({ connections: preset.connections })}
                    className={`
                      p-2 rounded text-lg font-mono
                      ${
                        JSON.stringify(selectedTile.connections.sort()) ===
                        JSON.stringify(preset.connections.sort())
                          ? 'bg-green-600'
                          : 'bg-gray-700'
                      }
                    `}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tile Properties */}
          {selectedTile && (
            <div className="space-y-2">
              <label className="block text-sm">Tile Properties</label>

              {selectedTile.type === 'node' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTile.isGoalNode}
                    onChange={(e) => updateSelectedTile({ isGoalNode: e.target.checked })}
                  />
                  <span className="text-sm">Is Goal Node</span>
                </label>
              )}

              {selectedTile.type === 'path' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTile.canRotate}
                    onChange={(e) => updateSelectedTile({ canRotate: e.target.checked })}
                  />
                  <span className="text-sm">Can Rotate</span>
                </label>
              )}

              {selectedTile.type !== 'wall' && (
                <div>
                  <label className="block text-xs mb-1">Manual Connections</label>
                  <div className="flex gap-1">
                    {DIRECTIONS.map((dir) => (
                      <button
                        key={dir}
                        onClick={() => toggleConnection(dir)}
                        className={`
                          px-2 py-1 rounded text-xs capitalize
                          ${selectedTile.connections.includes(dir) ? 'bg-green-600' : 'bg-gray-700'}
                        `}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center - Game Board (using same components as the game) */}
        <div className="flex-1 flex items-start justify-center">
          <div
            style={{
              position: 'relative',
              width: boardPx,
              height: boardPx,
              background: 'linear-gradient(145deg, #0a0a16, #07070e)',
              borderRadius: 18,
              padding,
              border: '2px solid #12122a',
              boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.2)',
            }}
          >
            <GameGrid
              tiles={tiles}
              gridSize={gridSize}
              gap={gap}
              tileSize={tileSize}
              wallOffset={0}
              wallsJustAdvanced={false}
              compressionActive={false}
              hintPos={null}
              hintTiles={hintTiles}
              status="playing"
              onTileTap={handleCellClick}
              animationsEnabled={false}
              editorMode={true}
            />
          </div>
        </div>

        {/* Right Panel - Level Settings */}
        <div className="w-64 space-y-4">
          <div>
            <label className="block text-sm mb-1">Level Name</label>
            <input
              type="text"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              className="w-full bg-gray-700 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">World ID</label>
            <input
              type="number"
              min={1}
              value={worldId}
              onChange={(e) => setWorldId(Number.parseInt(e.target.value) || 1)}
              className="w-full bg-gray-700 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Max Moves</label>
            <input
              type="number"
              min={1}
              value={maxMoves}
              onChange={(e) => setMaxMoves(Number.parseInt(e.target.value) || 10)}
              className="w-full bg-gray-700 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Compression Delay (ms)</label>
            <input
              type="number"
              value={compressionDelay}
              onChange={(e) => setCompressionDelay(Number.parseInt(e.target.value) || 5000)}
              className="w-full bg-gray-700 rounded p-2"
            />
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={handleVerify}
              className="w-full bg-green-600 hover:bg-green-700 rounded p-2"
            >
              Verify Level
            </button>
            <button
              onClick={handleCopyCode}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded p-2"
            >
              Copy TypeScript Code
            </button>
            <button
              onClick={handleExport}
              className="w-full bg-purple-600 hover:bg-purple-700 rounded p-2"
            >
              Export JSON
            </button>
            <button
              onClick={() => initializeGrid(gridSize)}
              className="w-full bg-red-600 hover:bg-red-700 rounded p-2"
            >
              Clear Grid
            </button>
          </div>

          {/* Goal Nodes Info */}
          <div className="text-sm">
            <p className="text-gray-400">Goal Nodes: {getGoalNodes().length}</p>
            <p className="text-gray-400">Total Tiles: {tiles.length}</p>
          </div>
        </div>
      </div>

      {/* Generated Code Preview */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Generated Code</h2>
        <pre className="bg-gray-800 p-4 rounded text-xs overflow-x-auto">{generateCode()}</pre>
      </div>
    </div>
  );
};

export default LevelEditor;
