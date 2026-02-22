import { useMemo, memo } from 'react';
import { Tile, TileRenderer } from '@/game/types';
import GameTile from './GameTile';
import WallOverlay from './WallOverlay';

interface GameGridProps {
  tiles: Tile[];
  gridSize: number;
  gap: number;
  tileSize: number;
  wallOffset: number;
  wallsJustAdvanced: boolean;
  compressionActive: boolean;
  hintPos: { x: number; y: number } | null;
  status: string;
  onTileTap: (x: number, y: number) => void;
  animationsEnabled?: boolean;
  /** Pass the active mode's tileRenderer to enable non-pipe visuals (candy crush, slots, etc.) */
  tileRenderer?: TileRenderer;
}

/**
 * GameGrid - Renders the tile grid with optimized tile lookups
 *
 * Uses a Map for O(1) tile lookups instead of O(n) array.find()
 */
function GameGridComponent({
  tiles,
  gridSize,
  gap,
  tileSize,
  wallOffset,
  wallsJustAdvanced,
  compressionActive,
  hintPos,
  status,
  onTileTap,
  animationsEnabled = true,
  tileRenderer,
}: GameGridProps) {
  // Create a Map for O(1) tile lookups instead of O(n) array.find()
  const tileMap = useMemo(() => {
    const map = new Map<string, Tile>();
    for (const tile of tiles) {
      map.set(`${tile.x},${tile.y}`, tile);
    }
    return map;
  }, [tiles]);

  // Pre-compute grid cells
  const gridCells = useMemo(() => {
    const cells: Array<{
      key: string;
      x: number;
      y: number;
      tile: Tile | undefined;
      dist: number;
      inDanger: boolean;
    }> = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      const tile = tileMap.get(`${x},${y}`);
      const dist = Math.min(x, y, gridSize - 1 - x, gridSize - 1 - y);

      // FIXED: Correct inDanger calculation
      // Tiles are in danger when compression is active AND they're within the wall offset zone
      // AND they're not already a wall or crushed
      const inDanger =
        compressionActive &&
        dist <= wallOffset &&
        !!tile &&
        tile.type !== 'wall' &&
        tile.type !== 'crushed';

      cells.push({
        key: `${x}-${y}`,
        x,
        y,
        tile,
        dist,
        inDanger,
      });
    }

    return cells;
  }, [gridSize, tileMap, compressionActive, wallOffset]);

  return (
    <>
      {/* Tile grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap,
          width: '100%',
          height: '100%',
        }}>
        {gridCells.map(({ key, x, y, tile, inDanger }) => {
          const isHint = hintPos?.x === x && hintPos?.y === y;

          return (
            <GameTile
              key={key}
              type={tile?.type || 'empty'}
              connections={tile?.connections || []}
              canRotate={tile?.canRotate || false}
              isGoalNode={tile?.isGoalNode || false}
              isHint={isHint}
              inDanger={inDanger}
              justRotated={tile?.justRotated}
              onClick={() => onTileTap(x, y)}
              tileSize={tileSize}
              animationsEnabled={animationsEnabled}
              tileRenderer={tileRenderer}
              displayData={tile?.displayData}
            />
          );
        })}
      </div>

      {/* Animated Walls Overlay - The "Pressure Effect" */}
      <WallOverlay
        wallOffset={wallOffset}
        gridSize={gridSize}
        wallsJustAdvanced={wallsJustAdvanced}
        isPlaying={status === 'playing'}
        animationsEnabled={animationsEnabled}
      />
    </>
  );
}

export const GameGrid = memo(GameGridComponent);
export default GameGrid;
