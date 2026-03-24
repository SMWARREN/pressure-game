import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useShallow } from 'zustand/react/shallow';
import { getModeById } from '@/game/modes';
import { useGameStore } from '@/game/store';
import PressureLogo from './PressureLogo.native';
import StarField from './StarField.native';
import { SYMBOL_IMAGES } from '../assets/symbolImages';
import type { Level } from '@/game/types';

interface LevelSelectorProps {
  onLevelSelect: (level: Level) => void;
  onClose?: () => void;
}

export default function LevelSelector({ onLevelSelect, onClose }: LevelSelectorProps) {
  const { currentModeId, setGameMode, completedLevels, bestMoves, lastPlayedLevelId } =
    useGameStore(
      useShallow((state) => ({
        currentModeId: state.currentModeId,
        setGameMode: state.setGameMode,
        completedLevels: state.completedLevels,
        bestMoves: state.bestMoves,
        lastPlayedLevelId: state.lastPlayedLevelId,
      }))
    );

  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // ScrollView has paddingHorizontal: 12 on each side = 24px total
  // Worlds: 4 cols, 3 gaps × 8px = 24px
  const worldBtnWidth = Math.floor((screenWidth - 24 - 24) / 4);
  // Levels: 5 cols, 4 gaps × 8px = 32px
  const levelBtnWidth = Math.floor((screenWidth - 24 - 32) / 5);

  const [selectedModeId, setSelectedModeId] = useState(currentModeId);
  const [selectedWorldId, setSelectedWorldId] = useState(1);

  // Sync with store when mode changes externally (e.g. AppFooter dropdown)
  useEffect(() => {
    setSelectedModeId(currentModeId);
    setSelectedWorldId(1);
  }, [currentModeId]);

  const activeMode = getModeById(selectedModeId);
  const levels = activeMode.getLevels?.() ?? [];
  const worlds = activeMode.worlds ?? [];

  const PRESSURE_SERIES = ['classic', 'blitz', 'zen'];
  const isPressureSeries = PRESSURE_SERIES.includes(selectedModeId);

  function colorToGradient(hex: string): [string, string, string] {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    const lighten = (v: number, a: number) => Math.min(255, Math.round(v + (255 - v) * a));
    const darken = (v: number, a: number) => Math.round(v * (1 - a));
    const h = (rv: number, gv: number, bv: number) =>
      `#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
    return [
      h(lighten(r, 0.4), lighten(g, 0.4), lighten(b, 0.4)),
      hex,
      h(darken(r, 0.25), darken(g, 0.25), darken(b, 0.25)),
    ];
  }

  const logoText = isPressureSeries ? 'PRESSURE' : activeMode.name.toUpperCase();
  const logoGradient: [string, string, string] = isPressureSeries
    ? ['#c4b5fd', '#8184f8', '#6366f1']
    : colorToGradient(activeMode.color ?? '#a78bfa');
  const subheaderText = isPressureSeries ? 'PIPE PUZZLE' : '';

  const modeOptions = [
    {
      id: 'classic',
      label: 'Pressure',
      icon: require('../assets/emoji-lightning.png'),
      color: '#a78bfa',
    },
    { id: 'blitz', label: 'Blitz', icon: require('../assets/emoji-fire.png'), color: '#f97316' },
    { id: 'zen', label: 'Zen', icon: require('../assets/emoji-zen.png'), color: '#34d399' },
  ];

  // Only show the 3-tab switcher for the main pressure modes
  const showModeSwitcher = modeOptions.some((m) => m.id === currentModeId);

  const filteredLevels = levels.filter((l) => l.world === selectedWorldId);

  return (
    <View style={styles.container}>
      {/* Background: stars + gradient */}
      <StarField />
      <LinearGradient
        colors={['rgba(6,6,15,1)', 'rgba(15,15,40,0.4)', 'rgba(6,6,15,1)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Custom Header with PRESSURE branding */}
      <View style={[styles.header, { paddingTop: Math.max(12, insets.top) }]}>
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
          <PressureLogo size={42} text={logoText} gradientColors={logoGradient} />
          <Text style={styles.pipePuzzleLabel}>{subheaderText}</Text>
          {(() => {
            const totalDone = completedLevels.filter((id) =>
              levels.some((l) => l.id === id)
            ).length;
            const pct = levels.length > 0 ? Math.round((totalDone / levels.length) * 100) : 0;
            return (
              <>
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {totalDone}/{levels.length} COMPLETE
                  </Text>
                  <Text style={styles.progressText}>{pct}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
              </>
            );
          })()}
        </View>

        <View style={styles.backPlaceholder} />
      </View>

      {/* Mode Switcher — only for classic/blitz/zen */}
      {showModeSwitcher ? (
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
                <Image
                  source={icon}
                  style={{ width: 20, height: 20, opacity: isActive ? 1 : 0.4 }}
                />
                <Text style={[styles.modeLabel, isActive && { color }]}>{label.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* World title + tagline */}
        {(() => {
          const wm = worlds.find((w) => w.id === selectedWorldId);
          if (!wm) return null;
          return (
            <View style={styles.worldTitleSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {SYMBOL_IMAGES[wm.icon] ? (
                  <Image source={SYMBOL_IMAGES[wm.icon]} style={{ width: 32, height: 32 }} />
                ) : (
                  <Text style={{ fontSize: 28 }}>{wm.icon}</Text>
                )}
                <Text
                  style={[
                    styles.worldTitleText,
                    { color: wm.color, textShadowColor: `${wm.color}60`, textShadowRadius: 16 },
                  ]}
                >
                  {wm.name}
                </Text>
              </View>
              <Text style={styles.worldTagline}>{wm.tagline.toUpperCase()}</Text>
            </View>
          );
        })()}

        {/* Worlds Selector */}
        <FlatList
          data={worlds}
          keyExtractor={(w) => String(w.id)}
          numColumns={4}
          scrollEnabled={false}
          columnWrapperStyle={styles.worldRow}
          contentContainerStyle={styles.worldsGrid}
          renderItem={({ item: world }) => {
            const worldLevels = levels.filter((l) => l.world === world.id);
            const doneCnt = worldLevels.filter((l) => completedLevels.includes(l.id)).length;
            const isActive = selectedWorldId === world.id;
            return (
              <Pressable
                onPress={() => setSelectedWorldId(world.id)}
                style={[
                  styles.worldButton,
                  { width: worldBtnWidth },
                  isActive
                    ? { borderColor: `${world.color}99`, backgroundColor: `${world.color}18` }
                    : { borderColor: '#1a1a35' },
                ]}
              >
                {SYMBOL_IMAGES[world.icon] ? (
                  <Image
                    source={SYMBOL_IMAGES[world.icon]}
                    style={{ width: 28, height: 28, opacity: isActive ? 1 : 0.5 }}
                  />
                ) : (
                  <Text style={{ fontSize: 24, color: world.color, opacity: isActive ? 1 : 0.5 }}>
                    {world.icon}
                  </Text>
                )}
                <Text style={[styles.worldButtonName, isActive && { color: world.color }]}>
                  {world.name}
                </Text>
                <Text style={[styles.worldButtonCount, isActive && { color: `${world.color}99` }]}>
                  {doneCnt}/{worldLevels.length}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Levels Grid */}
        <View style={styles.world}>
          <Text style={styles.selectLabel}>SELECT LEVEL</Text>
          {(() => {
            const wm = worlds.find((w) => w.id === selectedWorldId) ?? worlds[0];
            const worldLevels = levels.filter((l) => l.world === selectedWorldId);
            return (
              <FlatList
                data={filteredLevels}
                keyExtractor={(l) => String(l.id)}
                numColumns={5}
                scrollEnabled={false}
                columnWrapperStyle={styles.levelRow}
                contentContainerStyle={styles.levelsGrid}
                renderItem={({ item: level }) => {
                  const displayNum = worldLevels.findIndex((l) => l.id === level.id) + 1;
                  const done = completedLevels.includes(level.id);
                  const isLastPlayed = lastPlayedLevelId[selectedModeId] === level.id;
                  const best = bestMoves[`${selectedModeId}:${level.id}`];
                  let borderColor: string;
                  let bgColor: string;
                  let numColor: string;
                  if (isLastPlayed) {
                    borderColor = '#6366f1';
                    bgColor = '#6366f115';
                    numColor = '#a5b4fc';
                  } else if (done) {
                    borderColor = `${wm.color}50`;
                    bgColor = `${wm.color}15`;
                    numColor = wm.color;
                  } else {
                    borderColor = '#1a1a35';
                    bgColor = '#0a0a1a';
                    numColor = '#3d3d6b';
                  }
                  return (
                    <Pressable
                      style={[
                        styles.levelButton,
                        { width: levelBtnWidth, borderColor, backgroundColor: bgColor },
                      ]}
                      onPress={() => onLevelSelect(level)}
                    >
                      <Text style={[styles.levelNumber, { color: numColor }]}>{displayNum}</Text>
                      {isLastPlayed && !done && (
                        <View style={styles.badgeLastPlayed}>
                          <Text style={styles.badgeText}>▶</Text>
                        </View>
                      )}
                      {done && best !== undefined && (
                        <View style={styles.badgeBest}>
                          <Text style={styles.badgeBestText}>★ {best}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                }}
              />
            );
          })()}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
    backgroundColor: 'rgba(6, 6, 15, 0.9)',
    marginBottom: 0,
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
    fontSize: 18,
    color: '#a0aec0',
    fontWeight: '700',
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
    backgroundColor: 'rgba(6, 6, 15, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1a1a35',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeIcon: {
    fontSize: 16,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555577',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentInner: {
    paddingHorizontal: 12,
  },
  worldTitleSection: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  worldTitleText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  worldTagline: {
    fontSize: 11,
    color: '#a0aec0',
    letterSpacing: 2,
    marginTop: 4,
  },
  worldsGrid: {
    marginBottom: 10,
  },
  worldRow: {
    gap: 8,
    marginBottom: 8,
  },
  worldButton: {
    minHeight: 90,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1a1a35',
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  worldButtonName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a0aec0',
    textAlign: 'center',
  },
  worldButtonCount: {
    fontSize: 9,
    color: '#4a4a6a',
    textAlign: 'center',
  },
  world: {
    marginTop: 20,
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
  levelsGrid: {},
  levelRow: {
    gap: 8,
    marginBottom: 8,
  },
  selectLabel: {
    fontSize: 10,
    color: '#4a4a6a',
    letterSpacing: 3,
    marginBottom: 10,
    paddingLeft: 2,
  },
  levelButton: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  badgeLastPlayed: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#6366f1',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 7,
    color: '#fff',
    fontWeight: '900',
  },
  badgeBest: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#fbbf24',
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  badgeBestText: {
    fontSize: 8,
    color: '#000',
    fontWeight: '900',
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
