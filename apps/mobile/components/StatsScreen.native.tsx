import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useGameStore } from '@/game/store';

export default function StatsScreen() {
  // In a real app, you'd fetch these from the store or API
  const stats = {
    totalGames: 42,
    gamesWon: 28,
    totalScore: 15420,
    bestTime: 45,
    averageTime: 120,
    longestStreak: 8,
    modes: [
      { name: 'Classic', wins: 15, score: 8500 },
      { name: 'Zen', wins: 8, score: 4200 },
      { name: 'Blitz', wins: 5, score: 2720 },
    ],
  };

  const winRate = Math.round((stats.gamesWon / stats.totalGames) * 100);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        <StatCard label="Games Won" value={`${stats.gamesWon}/${stats.totalGames}`} />
        <StatCard label="Win Rate" value={`${winRate}%`} />
        <StatCard label="Total Score" value={stats.totalScore.toLocaleString()} />
        <StatCard label="Best Time" value={`${stats.bestTime}s`} />
      </View>

      {/* Mode Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Game Mode</Text>
        {stats.modes.map((mode) => (
          <View key={mode.name} style={styles.modeCard}>
            <View>
              <Text style={styles.modeName}>{mode.name}</Text>
              <Text style={styles.modeStats}>
                {mode.wins} wins • {mode.score} points
              </Text>
            </View>
            <View style={styles.modeScore}>
              <Text style={styles.modeScoreText}>{mode.score}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementGrid}>
          <AchievementBadge icon="🏆" title="Victory" subtitle="Win 10 games" />
          <AchievementBadge icon="⚡" title="Speedrun" subtitle="Complete in 30s" />
          <AchievementBadge icon="🔥" title="Hot Streak" subtitle="Win 5 in a row" />
          <AchievementBadge icon="💎" title="Collector" subtitle="Earn 5000 points" />
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface AchievementBadgeProps {
  icon: string;
  title: string;
  subtitle: string;
}

function AchievementBadge({ icon, title, subtitle }: AchievementBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={styles.badgeTitle}>{title}</Text>
      <Text style={styles.badgeSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#12122a',
  },
  modeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  modeStats: {
    fontSize: 12,
    color: '#888',
  },
  modeScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  modeScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#12122a',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  badgeSubtitle: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});
