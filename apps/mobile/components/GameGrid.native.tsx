import React, { useMemo, memo } from 'react';
import { View } from 'react-native';
import { Tile } from '@/game/types';
import GameTile from './GameTile.native';

interface GameGridProps {
  readonly tiles: Tile[];
  readonly gridSize: number;
  readonly gridCols: number;
  readonly gridRows: number;
  readonly gap: number;
  readonly wallOffset: number;
  readonly wallsJustAdvanced: boolean;
  readonly compressionActive: boolean;
  readonly onTileTap: (x: number, y: number) => void;
}

/**
 * GameGrid (Mobile/React Native)
 * Renders the tile grid with touch interaction
 * Handles grid layout and tile positioning
 */
function GameGridComponent({
  tiles,
  gridSize,
  gridCols,
  gridRows,
  gap,
  wallOffset,
  wallsJustAdvanced,
  compressionActive,
  onTileTap,
}: GameGridProps) {
  // Create a Map for O(1) tile lookups
  const tileMap = useMemo(() => {
    const map = new Map<string, Tile>();
    tiles.forEach((tile) => {
      map.set(`${tile.position.x},${tile.position.y}`, tile);
    });
    return map;
  }, [tiles]);

  // Pre-calculate grid dimensions
  const gridDimensions = useMemo(() => {
    const totalWidth = gridSize * gridCols + gap * (gridCols - 1);
    const totalHeight = gridSize * gridRows + gap * (gridRows - 1);
    return { totalWidth, totalHeight };
  }, [gridSize, gridCols, gridRows, gap]);

  // Render tiles
  const renderedTiles = useMemo(() => {
    const items = [];
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const tile = tileMap.get(`${x},${y}`);
        if (tile) {
          items.push(
            <GameTile
              key={`${x},${y}`}
              tile={tile}
              size={gridSize}
              gap={gap}
              wallOffset={wallOffset}
              wallsJustAdvanced={wallsJustAdvanced}
              compressionActive={compressionActive}
              onTap={() => onTileTap(x, y)}
            />
          );
        }
      }
    }
    return items;
  }, [tileMap, gridSize, gap, wallOffset, wallsJustAdvanced, compressionActive, gridRows, gridCols, onTileTap]);

  return (
    <View
      style={[
        styles.grid,
        {
          width: gridDimensions.totalWidth,
          height: gridDimensions.totalHeight,
        },
      ]}
    >
      {renderedTiles}
    </View>
  );
}

const styles = {
  grid: {
    flexWrap: 'wrap' as const,
    flexDirection: 'row' as const,
    gap: 4,
  },
};

export default memo(GameGridComponent);
