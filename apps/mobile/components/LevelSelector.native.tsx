import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { getModeById } from '@/game/modes';
import { useGameStore } from '@/game/store';
import PressureLogo from './PressureLogo.native';
import type { Level } from '@/game/types';

interface LevelSelectorProps {
  onLevelSelect: (level: Level) => void;
  onClose?: () => void;
}

export default function LevelSelector({ onLevelSelect, onClose }: LevelSelectorProps) {
  const { currentModeId, setGameMode } = useGameStore((state) => ({
    currentModeId: state.currentModeId,
    setGameMode: state.setGameMode,
  }));

  const [selectedModeId, setSelectedModeId] = useState(currentModeId);
  const [selectedWorldId, setSelectedWorldId] = useState(1);
  const activeMode = getModeById(selectedModeId);
  const levels = activeMode.getLevels?.() ?? [];
  const worlds = activeMode.worlds ?? [];

  const modeOptions = [
    { id: 'classic', label: 'Pressure', icon: '⚡', color: '#a78bfa' },
    { id: 'blitz', label: 'Blitz', icon: '🔥', color: '#f97316' },
    { id: 'zen', label: 'Zen', icon: '🧘', color: '#34d399' },
  ];

  const filteredLevels = levels.filter((l) => l.world === selectedWorldId);

  return (
    <View style={styles.container}>
      {/* Custom Header with PRESSURE branding */}
      <View style={styles.header}>
        {onClose ? (
          <Pressable
            onPress={onClose}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleContainer}>
          <PressureLogo size={24} />
          <Text style={styles.pipePuzzleLabel}>PIPE PUZZLE</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>0/40 COMPLETE</Text>
            <Text style={styles.progressText}>0%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '0%' }]} />
          </View>
        </View>

        <View style={styles.backPlaceholder} />
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeSwitcher}>
        {modeOptions.map(({ id, label, icon, color }) => {
          const isActive = selectedModeId === id;
          return (
            <Pressable
              key={id}
              onPress={() => {
                setSelectedModeId(id);
                setGameMode(id);
              }}
              style={[
                styles.modeButton,
                isActive && { borderColor: `${color}88`, backgroundColor: `${color}20` },
              ]}
            >
              <Text style={[styles.modeIcon]}>{icon}</Text>
              <Text style={[styles.modeLabel, isActive && { color }]}>
                {label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.content}>
        {/* Worlds Selector */}
        <View style={styles.worldsGrid}>
          {worlds.map((world) => {
            const worldLevels = levels.filter((l) => l.world === world.id);
            const completed = worldLevels.length; // All levels available
            const isActive = selectedWorldId === world.id;
            return (
              <Pressable
                key={world.id}
                onPress={() => setSelectedWorldId(world.id)}
                style={[
                  styles.worldButton,
                  isActive && { borderColor: `${world.color}88`, backgroundColor: `${world.color}20` },
                ]}
              >
                <Text style={{ fontSize: 24, color: world.color }}>{world.icon}</Text>
                <Text style={[styles.worldButtonName, isActive && { color: world.color }]}>
                  {world.name}
                </Text>
                <Text style={styles.worldButtonCount}>
                  {completed}/{worldLevels.length}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Levels Grid */}
        <View style={styles.world}>
          <View style={styles.levelsGrid}>
            {filteredLevels.map((level, index) => {
              const worldLevels = levels.filter((l) => l.world === selectedWorldId);
              const displayNum = worldLevels.findIndex((l) => l.id === level.id) + 1;
              return (
                <Pressable
                  key={level.id}
                  style={styles.levelButton}
                  onPress={() => onLevelSelect(level)}
                >
                  <Text style={styles.levelNumber}>{displayNum}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
    backgroundColor: 'rgba(6, 6, 15, 0.85)',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#12122a',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  backIcon: {
    fontSize: 16,
    color: '#3a3a55',
    fontWeight: '600',
  },
  backPlaceholder: {
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  pipePuzzleLabel: {
    fontSize: 10,
    color: '#a0aec0',
    letterSpacing: 0.25,
    marginTop: -50,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 260,
    marginTop: 10,
    marginBottom: 4,
  },
  modeSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: 'rgba(6, 6, 15, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#12122a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  modeIcon: {
    fontSize: 16,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a0aec0',
    letterSpacing: 0.06,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 60,
  },
  worldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 8,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  worldButton: {
    width: '31%',
    minHeight: 100,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#12122a',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  worldButtonName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a0aec0',
    textAlign: 'center',
  },
  worldButtonCount: {
    fontSize: 10,
    color: '#a0aec0',
    textAlign: 'center',
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
    justifyContent: 'flex-start',
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
    color: '#a0aec0',
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
  progressText: {
    fontSize: 10,
    color: '#a0aec0',
  },
  progressBar: {
    height: 4,
    width: 260,
    backgroundColor: '#12122a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
});
