import React, { useMemo, useCallback } from 'react';
import { View, Dimensions, Text, StyleSheet, Pressable } from 'react-native';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';
import GameGrid from './GameGrid.native';
import type { Tile } from '@/game/types';

/**
 * GameBoard (Mobile/React Native)
 * Main container for the game UI on mobile
 * Matches web structure: header > stats > game grid
 * Navigation is handled by MainScreen parent component
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
    elapsedSeconds,
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
      elapsedSeconds: state.elapsedSeconds,
    }))
  );

  // Calculate responsive tile size based on device dimensions
  const gridSize = useMemo(() => {
    const gridSize = currentLevel?.gridSize || 5;
    const cols = gridSize;
    const rows = gridSize;
    const maxDim = Math.max(cols, rows);

    // Compute gap and padding based on grid size
    let gap = 2;
    let padding = 4;
    if (maxDim <= 5) {
      gap = 4;
      padding = 8;
    } else if (maxDim <= 7) {
      gap = 3;
      padding = 6;
    }

    // Use roughly 80% of available width for the grid
    const gridWidth = (width * 0.8);
    const gridHeight = (height * 0.6); // Use 60% of height for grid

    // Calculate tile size to fit available space
    const tileSizeByW = Math.floor(
      (gridWidth - padding * 2 - gap * Math.max(0, cols - 1)) / cols
    );
    const tileSizeByH = Math.floor(
      (gridHeight - padding * 2 - gap * Math.max(0, rows - 1)) / rows
    );
    const tileSize = Math.max(20, Math.min(tileSizeByW, tileSizeByH));

    return {
      tileSize,
      gap,
      cols,
      rows,
      padding,
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
      {/* Header showing level info */}
      <View style={styles.header}>
        <Text style={styles.levelTitle}>{currentLevel?.name || 'PRESSURE'}</Text>
        <Text style={styles.levelSubtitle}>LEVEL {currentLevel?.id || 1}</Text>
      </View>

      {/* Stats row showing moves and score */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Moves</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{Math.floor(elapsedSeconds)}s</Text>
        </View>
      </View>

      {/* Game Grid */}
      <View style={[styles.gridContainer, { padding: gridSize.padding }]}>
        <GameGrid
          tiles={tiles}
          gridSize={gridSize.tileSize}
          gridCols={gridSize.cols}
          gridRows={gridSize.rows}
          gap={gridSize.gap}
          wallOffset={wallOffset}
          wallsJustAdvanced={wallsJustAdvanced}
          compressionActive={compressionActive}
          compressionDirection={currentLevel?.compressionDirection ?? 'all'}
          onTileTap={handleTileTap}
        />
      </View>

      {/* Reset button */}
      <Pressable style={styles.resetButton} onPress={restartLevel}>
        <Text style={styles.resetButtonText}>↺ Restart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  levelSubtitle: {
    fontSize: 10,
    color: '#a0aec0',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#a0aec0',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#12122a',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
});
