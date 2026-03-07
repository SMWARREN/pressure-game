import React, { useMemo } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useGameStore } from '@/game/store';

/**
 * Stats Screen
 * Display game statistics and achievements
 */
export default function StatsScreen() {
  const stats = useGameStore((state) => ({
    totalScore: state.score || 0,
    completedLevels: state.completedLevels.length,
    moves: state.moves,
  }));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Levels Completed</Text>
            <Text style={styles.statValue}>{stats.completedLevels}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Score</Text>
            <Text style={styles.statValue}>{stats.totalScore.toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Moves in Current Game</Text>
            <Text style={styles.statValue}>{stats.moves}</Text>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>

          <View style={styles.achievementPlaceholder}>
            <Text style={styles.placeholderText}>
              Achievements coming in Phase 3
            </Text>
          </View>
        </View>

        {/* Leaderboards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboards</Text>

          <View style={styles.leaderboardPlaceholder}>
            <Text style={styles.placeholderText}>
              Leaderboards coming in Phase 3
            </Text>
          </View>
        </View>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statCard: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  achievementPlaceholder: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  leaderboardPlaceholder: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
};
