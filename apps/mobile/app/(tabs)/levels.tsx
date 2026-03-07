import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { useGameStore } from '@/game/store';
import { LEVELS } from '@/game/levels';

/**
 * Levels Screen
 * Browse and select levels
 */
export default function LevelsScreen() {
  const { loadLevel, completedLevels } = useGameStore((state) => ({
    loadLevel: state.loadLevel,
    completedLevels: state.completedLevels,
  }));

  const levelGroups = useMemo(() => {
    const groups: Record<number, typeof LEVELS> = {};
    LEVELS.forEach((level) => {
      const world = level.world || 1;
      if (!groups[world]) groups[world] = [];
      groups[world].push(level);
    });
    return groups;
  }, []);

  const handleLevelSelect = (levelId: number) => {
    loadLevel(levelId);
  };

  const isLevelCompleted = (levelId: number) => {
    return completedLevels.includes(levelId);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {Object.entries(levelGroups).map(([world, worldLevels]) => (
          <View key={`world-${world}`} style={styles.worldSection}>
            <Text style={styles.worldTitle}>World {world}</Text>

            <View style={styles.levelGrid}>
              {worldLevels.map((level) => (
                <Pressable
                  key={`level-${level.id}`}
                  onPress={() => handleLevelSelect(level.id)}
                  style={({ pressed }) => [
                    styles.levelButton,
                    isLevelCompleted(level.id) && styles.completedLevel,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.levelNumber}>{level.id}</Text>
                  {isLevelCompleted(level.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  worldSection: {
    marginBottom: 20,
  },
  worldTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  levelGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  levelButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  completedLevel: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  pressed: {
    opacity: 0.7,
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  checkmark: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: 'bold' as const,
  },
};
