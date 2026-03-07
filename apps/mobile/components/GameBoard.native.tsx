import React, { useMemo, useCallback } from 'react';
import { View, Dimensions, GestureResponderEvent } from 'react-native';
import { Tile, TileRenderer } from '@/game/types';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';
import GameGrid from './GameGrid.native';
import GameControls from './GameControls.native';
import GameStats from './GameStats.native';

/**
 * GameBoard (Mobile/React Native)
 * Main container for the game UI on mobile
 * Handles layout, state management, and touch interactions
 */
export default function GameBoard() {
  const { width, height } = Dimensions.get('window');

  // Get game state
  const {
    tiles,
    currentLevel,
    status,
    moves,
    score,
    wallOffset,
    wallsJustAdvanced,
    compressionActive,
    currentModeId,
    tapTile,
    restartLevel,
  } = useGameStore(
    useShallow((state) => ({
      tiles: state.tiles,
      currentLevel: state.currentLevel,
      status: state.status,
      moves: state.moves,
      score: state.score,
      wallOffset: state.wallOffset,
      wallsJustAdvanced: state.wallsJustAdvanced,
      compressionActive: state.compressionActive,
      currentModeId: state.currentModeId,
      tapTile: state.tapTile,
      restartLevel: state.restartLevel,
    }))
  );

  // Calculate responsive tile size based on device dimensions
  const gridSize = useMemo(() => {
    const availableWidth = width - 20; // padding
    const availableHeight = height * 0.5; // roughly half screen for game grid

    const gridSize = currentLevel?.gridSize || 5;
    const cols = gridSize;
    const rows = gridSize;

    const tileSize = Math.min(
      availableWidth / cols,
      availableHeight / rows
    );

    return {
      tileSize: Math.floor(tileSize),
      gap: 4,
      cols,
      rows,
    };
  }, [width, height, currentLevel]);

  const handleTileTap = useCallback((x: number, y: number) => {
    tapTile(x, y);
  }, [tapTile]);

  if (!currentLevel) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Game Stats Header */}
      <GameStats
        moves={moves}
        score={score}
        status={status}
      />

      {/* Game Grid */}
      <View style={styles.gridContainer}>
        <GameGrid
          tiles={tiles}
          gridSize={gridSize.tileSize}
          gridCols={gridSize.cols}
          gridRows={gridSize.rows}
          gap={gridSize.gap}
          wallOffset={wallOffset}
          wallsJustAdvanced={wallsJustAdvanced}
          compressionActive={compressionActive}
          onTileTap={handleTileTap}
        />
      </View>

      {/* Game Controls Footer */}
      <GameControls
        status={status}
        onReset={restartLevel}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#06060f',
    paddingHorizontal: 10,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginVertical: 10,
  },
};
