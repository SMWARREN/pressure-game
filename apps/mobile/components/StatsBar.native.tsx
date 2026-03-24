import React from 'react';
import { View, Text } from 'react-native';
import type { GameModeConfig } from '@/game/modes/types';
import { styles } from './GameBoardStyles.native';

interface StatsBarProps {
  mode: GameModeConfig;
  score: number;
  moves: number;
  maxMoves: number | null;
  countdownSec: number;
  compressionPct: number;
  compressionActive: boolean;
  timeLeft: number | undefined;
  showScore: boolean;
  showMoves: boolean;
  showCompression: boolean;
  showCountdown: boolean;
  showTimeLeft: boolean;
}

export default function StatsBar({
  mode, score, moves, maxMoves, countdownSec,
  compressionPct, compressionActive, timeLeft,
  showScore, showMoves, showCompression, showCountdown, showTimeLeft,
}: StatsBarProps) {
  return (
    <View style={styles.statsBar}>
      {showScore && (
        <View style={styles.statBox}>
          <Text style={[styles.statBig, { color: '#fcd34d' }]}>{score}</Text>
          <Text style={styles.statSub}>SCORE</Text>
        </View>
      )}

      {showMoves && (
        <View style={styles.statBox}>
          <Text style={[styles.statBig, moves === maxMoves && maxMoves !== null ? { color: '#ef4444' } : {}]}>
            {moves}
          </Text>
          {maxMoves === null ? (
            <Text style={styles.statSub}>{mode.statsLabels?.moves ?? 'MOVES'}</Text>
          ) : (
            <Text style={styles.statSub}>/ {maxMoves}</Text>
          )}
        </View>
      )}

      {showCompression && (
        <View style={styles.compressionWrap}>
          <Text style={styles.compressionLabel}>{mode.statsLabels?.compression ?? 'WALLS'}</Text>
          <View style={styles.compressionTrack}>
            <View
              style={[
                styles.compressionFill,
                { width: `${compressionPct}%` },
                compressionActive ? { backgroundColor: '#ef4444' } : {},
              ]}
            />
          </View>
          <Text style={[styles.compressionStatus, { color: compressionActive ? '#22c55e' : '#4a4a6a' }]}>
            {compressionActive ? 'ACTIVE' : 'WAITING'}
          </Text>
        </View>
      )}

      {showCountdown && (
        <View style={styles.statBox}>
          <Text style={styles.statBig}>{String(countdownSec).padStart(2, '0')}</Text>
          <Text style={styles.statSub}>SEC</Text>
        </View>
      )}

      {showTimeLeft && timeLeft !== undefined && (
        <View style={styles.statBox}>
          <Text style={[styles.statBig, timeLeft <= 5 ? { color: '#ef4444' } : {}]}>
            {String(timeLeft).padStart(2, '0')}
          </Text>
          <Text style={styles.statSub}>TIME</Text>
        </View>
      )}
    </View>
  );
}
