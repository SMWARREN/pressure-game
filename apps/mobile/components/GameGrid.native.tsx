import React, { useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tile, CompressionDirection } from '@/game/types';
import GameTile from './GameTile.native';

interface GameGridProps {
  readonly tiles: Tile[];
  readonly gridSize: number;
  readonly gridCols?: number;
  readonly gridRows?: number;
  readonly gap: number;
  readonly wallOffset: number;
  readonly wallsJustAdvanced: boolean;
  readonly compressionActive: boolean;
  readonly onTileTap: (x: number, y: number) => void;
  readonly compressionDirection?: CompressionDirection;
}

/**
 * GameGrid (Mobile/React Native)
 * Renders the tile grid with optimized tile lookups
 * Matches web implementation - renders all cells including empty ones
 * Uses a Map for O(1) tile lookups instead of O(n) array.find()
 */
function GameGridComponent({
  tiles,
  gridSize,
  gridCols: gridColsProp,
  gridRows: gridRowsProp,
  gap,
  wallOffset,
  wallsJustAdvanced,
  compressionActive,
  onTileTap,
  compressionDirection = 'all',
}: GameGridProps) {
  const gridCols = gridColsProp ?? gridSize;
  const gridRows = gridRowsProp ?? gridSize;

  // Create a Map for O(1) tile lookups instead of O(n) array.find()
  const tileMap = useMemo(() => {
    const map = new Map<string, Tile>();
    for (const tile of tiles) {
      map.set(`${tile.x},${tile.y}`, tile);
    }
    return map;
  }, [tiles]);

  // Pre-compute grid cells - renders ALL cells including empty ones
  const gridCells = useMemo(() => {
    const cells: Array<{
      key: string;
      x: number;
      y: number;
      tile: Tile | undefined;
      inDanger: boolean;
    }> = [];

    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const tile = tileMap.get(`${x},${y}`);

        // Danger check respects compression direction
        const distTop = y;
        const distBottom = gridRows - 1 - y;
        const distLeft = x;
        const distRight = gridCols - 1 - x;

        let dirDist: number;
        switch (compressionDirection) {
          case 'top':
            dirDist = distTop;
            break;
          case 'bottom':
            dirDist = distBottom;
            break;
          case 'left':
            dirDist = distLeft;
            break;
          case 'right':
            dirDist = distRight;
            break;
          case 'top-bottom':
            dirDist = Math.min(distTop, distBottom);
            break;
          case 'left-right':
            dirDist = Math.min(distLeft, distRight);
            break;
          case 'top-left':
            dirDist = Math.min(distTop, distLeft);
            break;
          case 'top-right':
            dirDist = Math.min(distTop, distRight);
            break;
          case 'bottom-left':
            dirDist = Math.min(distBottom, distLeft);
            break;
          case 'bottom-right':
            dirDist = Math.min(distBottom, distRight);
            break;
          default:
            dirDist = Math.min(distTop, distBottom, distLeft, distRight);
            break; // 'all' or unset
        }

        const inDanger =
          compressionActive &&
          dirDist <= wallOffset &&
          !!tile &&
          tile.type !== 'wall' &&
          tile.type !== 'crushed';

        cells.push({
          key: `${x}-${y}`,
          x,
          y,
          tile,
          inDanger,
        });
      }
    }

    return cells;
  }, [gridCols, gridRows, tileMap, compressionActive, wallOffset, compressionDirection]);

  return (
    <View style={styles.container}>
      {gridCells.map(({ key, x, y, tile }) => (
        <GameTile
          key={key}
          tile={tile}
          size={gridSize}
          gap={gap}
          wallOffset={wallOffset}
          wallsJustAdvanced={wallsJustAdvanced}
          compressionActive={compressionActive}
          onTap={() => onTileTap(x, y)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
});

export default memo(GameGridComponent);
