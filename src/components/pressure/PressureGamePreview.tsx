/**
 * Pressure Game Preview — Shows a featured level with animated replay
 * Displays the level with solution moves playing and walls advancing
 */

import { useEffect, useState, useMemo } from 'react';
import { Level } from '@/game/types';
import GameGrid from '../game/GameGrid';
import { getSolution } from '@/game/levels';

interface PressureGamePreviewProps {
  level: Level | null;
  modeId: string;
}

// Inject rotation animation CSS
function ensureRotationStyles() {
  const styleId = 'pressure-preview-rotation-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes tilePress {
      0% { transform: scale(1); }
      50% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    .pressure-preview-tile-press {
      animation: tilePress 300ms ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

export function PressureGamePreview({ level }: PressureGamePreviewProps) {
  ensureRotationStyles();

  const [animState, setAnimState] = useState({
    moveIdx: 0,
    wallOffset: 0,
    elapsedMs: 0,
    hintPos: null as { x: number; y: number } | null,
    pressedPos: null as { x: number; y: number } | null,
  });

  // Get solution once
  const solution = useMemo(() => {
    if (!level) return null;
    return getSolution(level);
  }, [level]);

  // Animation loop: apply moves one by one, then reset and repeat
  useEffect(() => {
    if (!level || !solution || solution.length === 0) return;

    const interval = setInterval(() => {
      setAnimState((prev) => {
        const totalMoves = solution.length;
        const msPerMove = 1500; // 1500ms (1.5 seconds) per move - even slower
        const resetMs = 1500; // 1.5s to show all moves before reset
        const cycleMs = totalMoves * msPerMove + resetMs;

        const newElapsed = (prev.elapsedMs + 100) % cycleMs;
        const moveProgress = newElapsed / cycleMs;

        // Calculate which move we're on (0 to totalMoves)
        const moveTimeline = newElapsed / msPerMove;
        const moveIdx = Math.floor(moveTimeline);

        // Walls advance throughout
        const wallOffset = Math.floor((moveProgress * level.gridSize) / 2);

        // Highlight and track current tile being rotated
        const currentMove = solution[Math.min(moveIdx, totalMoves - 1)];
        const hintPos = currentMove ? { x: currentMove.x, y: currentMove.y } : null;
        const pressedPos = hintPos; // Show press feedback on the current tile

        return {
          moveIdx: Math.min(moveIdx, totalMoves),
          wallOffset,
          elapsedMs: newElapsed,
          hintPos,
          pressedPos,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [level, solution]);

  if (!level) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3a3a55',
          fontSize: 12,
        }}
      >
        Loading preview...
      </div>
    );
  }

  // Apply solution moves and mark crushed tiles
  const dirOrder = ['up', 'right', 'down', 'left'];
  let displayTiles = [...level.tiles];

  // Apply solution moves
  if (solution && animState.moveIdx > 0) {
    for (let i = 0; i < animState.moveIdx; i++) {
      const move = solution[i];
      const tileIdx = displayTiles.findIndex((t) => t.x === move.x && t.y === move.y);
      if (tileIdx >= 0) {
        const tile = displayTiles[tileIdx];
        // Properly rotate connections clockwise
        const newConnections = tile.connections.map((conn) => {
          const connIdx = dirOrder.indexOf(conn);
          if (connIdx < 0) return conn;
          const newIdx = (connIdx + move.rotations) % 4;
          return dirOrder[newIdx];
        });
        displayTiles[tileIdx] = { ...tile, connections: newConnections as any };
      }
    }
  }

  // Mark tiles as crushed based on wall offset
  const compressionDir = level.compressionDirection || 'all';
  const gridCols = level.gridSize;
  const gridRows = level.gridSize;

  displayTiles = displayTiles.map((tile) => {
    // Check if this tile should be crushed
    const distFromTop = tile.y;
    const distFromBottom = gridRows - 1 - tile.y;
    const distFromLeft = tile.x;
    const distFromRight = gridCols - 1 - tile.x;

    let shouldCrush = false;
    if (compressionDir === 'all') {
      shouldCrush =
        Math.min(distFromTop, distFromBottom, distFromLeft, distFromRight) < animState.wallOffset;
    }
    // Add other compression directions as needed

    if (shouldCrush && tile.type !== 'wall' && tile.type !== 'crushed') {
      return { ...tile, type: 'crushed' as const };
    }
    return tile;
  });

  // Calculate responsive tile size - scale based on grid size
  const gridSize = level.gridSize;
  // Keep grid smaller so it fully fits in preview area
  const baseMaxWidth = 200;
  const maxWidth = Math.min(baseMaxWidth + (gridSize - 5) * 5, 240); // Even smaller scaling
  const gap = 1;
  const padding = 4;
  const tileSizeByW = Math.floor((maxWidth - padding * 2 - gap * (gridSize - 1)) / gridSize);
  const tileSize = Math.max(1, tileSizeByW);
  const boardWidth = tileSize * gridSize + padding * 2 + gap * (gridSize - 1);
  const boardHeight = tileSize * gridSize + padding * 2 + gap * (gridSize - 1);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: boardWidth,
          height: boardHeight,
          margin: 'auto',
          background: 'radial-gradient(ellipse 70% 50% at 50% -5%, #0d0d22 0%, #06060f 100%)',
          borderRadius: 12,
          border: '1px solid #12122a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <GameGrid
          tiles={displayTiles}
          gridSize={gridSize}
          gap={gap}
          tileSize={tileSize}
          wallOffset={animState.wallOffset}
          wallsJustAdvanced={false}
          compressionActive={animState.wallOffset > 0}
          compressionDirection={level.compressionDirection || 'all'}
          hintPos={animState.hintPos}
          status="playing"
          onTileTap={() => {}} // read-only
          animationsEnabled={false}
          rejectedPos={null}
          editorMode={false}
        />
      </div>
    </div>
  );
}
