import React from 'react';
import { View, Text } from 'react-native';

interface GameStatsProps {
  readonly moves: number;
  readonly score: number;
  readonly status: string;
}

/**
 * GameStats (Mobile/React Native)
 * Displays current game statistics (moves, score, status)
 */
export default function GameStats({ moves, score, status }: GameStatsProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'won':
        return '#10b981';
      case 'lost':
        return '#ef4444';
      case 'playing':
        return '#6366f1';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'won':
        return 'Won!';
      case 'lost':
        return 'Lost';
      case 'playing':
        return 'Playing';
      default:
        return '-';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.label}>Moves</Text>
        <Text style={styles.value}>{moves}</Text>
      </View>

      <View style={styles.statItem}>
        <Text style={styles.label}>Score</Text>
        <Text style={styles.value}>{score}</Text>
      </View>

      <View style={[styles.statItem, { flex: 1 }]}>
        <Text style={styles.label}>Status</Text>
        <Text
          style={[
            styles.value,
            { color: getStatusColor() },
          ]}
        >
          {getStatusLabel()}
        </Text>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center' as const,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
};
