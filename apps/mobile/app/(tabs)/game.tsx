import React, { useEffect, useState } from 'react';
import { View, Dimensions, ActivityIndicator } from 'react-native';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';

/**
 * Main Game Screen
 * Mobile-specific view for the core game
 * Renders the game board with touch controls
 */
export default function GameScreen() {
  const [isReady, setIsReady] = useState(false);
  const { currentLevel, status } = useGameStore(
    useShallow((state) => ({
      currentLevel: state.currentLevel,
      status: state.status,
    }))
  );

  useEffect(() => {
    // Initialize game engine on first load
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!currentLevel) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          {/* Level selector will be shown here when no level is active */}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* GameBoard will be rendered here in Phase 2 */}
      <View style={styles.gameArea} />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#06060f',
  },
  gameArea: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
