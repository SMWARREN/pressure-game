import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, FlatList } from 'react-native';
import { CLASSIC_LEVELS } from '@/game/modes/classic/levels';
import { useGameStore } from '@/game/store';
import type { Level } from '@/game/types';

interface LevelSelectorProps {
  onLevelSelect: (level: Level) => void;
}

export default function LevelSelector({ onLevelSelect }: LevelSelectorProps) {
  const modes = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Rotate tiles before walls crush you',
      color: '#ec4899',
      levels: CLASSIC_LEVELS,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Worlds Section */}
      {modes.map((mode) => (
        <View key={mode.id} style={styles.world}>
          <View style={styles.worldHeader}>
            <View
              style={[
                styles.worldIcon,
                { backgroundColor: `${mode.color}20` },
              ]}
            >
              <Text style={styles.worldIconText}>🎮</Text>
            </View>
            <View style={styles.worldInfo}>
              <Text style={styles.worldName}>{mode.name}</Text>
              <Text style={styles.worldDesc}>{mode.description}</Text>
            </View>
          </View>

          {/* Levels Grid */}
          <View style={styles.levelsGrid}>
            {mode.levels.slice(0, 10).map((level, index) => (
              <Pressable
                key={level.id}
                style={[styles.levelButton, { opacity: level.locked ? 0.5 : 1 }]}
                onPress={() => !level.locked && onLevelSelect(level)}
                disabled={level.locked}
              >
                <Text style={styles.levelNumber}>{index + 1}</Text>
                {level.locked && <Text style={styles.lockedIcon}>🔒</Text>}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* Coming Soon Section */}
      <View style={styles.world}>
        <View style={styles.worldHeader}>
          <View style={[styles.worldIcon, { backgroundColor: '#6366f120' }]}>
            <Text style={styles.worldIconText}>✨</Text>
          </View>
          <View style={styles.worldInfo}>
            <Text style={styles.worldName}>More Modes Coming Soon</Text>
            <Text style={styles.worldDesc}>Blitz, Zen, Arcade and more</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
    paddingHorizontal: 12,
  },
  world: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  worldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  worldIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#12122a',
  },
  worldIconText: {
    fontSize: 28,
  },
  worldInfo: {
    flex: 1,
  },
  worldName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  worldDesc: {
    fontSize: 12,
    color: '#888',
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#12122a',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  lockedIcon: {
    position: 'absolute',
    fontSize: 16,
    bottom: -8,
    right: -8,
  },
  footer: {
    height: 40,
  },
});
