import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { GameModeConfig } from '@/game/modes/types';
import type { Level } from '@/game/types';
import { styles } from './GameBoardStyles.native';

export interface WinOverlayProps {
  mode: GameModeConfig;
  currentLevel: Level;
  currentModeId: string;
  moves: number;
  score: number;
  elapsedSeconds: number;
  levelWins: Record<string, number>;
  levelAttempts: Record<string, number>;
  restartLevel: () => void;
  goToMenu: () => void;
  loadLevel: (level: Level) => void;
}

function formatTime(elapsedSeconds: number): string {
  if (elapsedSeconds <= 0) return '';
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}s` : `${secs}s`;
}

function buildStatsText(moves: number, score: number, timeStr: string): string {
  const parts: string[] = [`${moves} move${moves === 1 ? '' : 's'}`];
  if (score > 0) parts.push(`${score} pts`);
  if (timeStr) parts.push(timeStr);
  return parts.join(' · ');
}

function buildRecordText(wins: number, attempts: number): string | null {
  if (attempts <= 0) return null;
  return `${wins} win${wins === 1 ? '' : 's'} · ${attempts} attempt${attempts === 1 ? '' : 's'}`;
}

export default function WinOverlay({
  mode,
  currentLevel,
  currentModeId,
  moves,
  score,
  elapsedSeconds,
  levelWins,
  levelAttempts,
  restartLevel,
  goToMenu,
  loadLevel,
}: WinOverlayProps) {
  const winTitle = mode.overlayText?.win ?? 'CONNECTED';
  const timeStr = formatTime(elapsedSeconds);
  const statsText = buildStatsText(moves, score, timeStr);
  const recordKey = `${currentModeId}:${currentLevel.id}`;
  const wins = levelWins[recordKey] ?? 0;
  const attempts = levelAttempts[recordKey] ?? 0;
  const recordText = buildRecordText(wins, attempts);
  const allLevels = mode.getLevels?.() ?? [];
  const currentIdx = allLevels.findIndex((l) => l.id === currentLevel.id);
  const nextLevel =
    currentIdx >= 0 && currentIdx < allLevels.length - 1 ? allLevels[currentIdx + 1] : null;

  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayEmoji}>✦</Text>
      <Text style={[styles.overlayTitle, { color: '#22c55e' }]}>
        {winTitle.toUpperCase()}
      </Text>
      <Text style={styles.overlaySub}>{statsText}</Text>
      {recordText && <Text style={styles.overlayRecord}>{recordText}</Text>}
      <View style={styles.overlayBtnRow}>
        {nextLevel && (
          <Pressable
            style={[styles.overlayBtn, styles.overlayBtnPrimary]}
            onPress={() => loadLevel(nextLevel)}
          >
            <Text style={[styles.overlayBtnText, { color: '#fff' }]}>NEXT →</Text>
          </Pressable>
        )}
        <Pressable style={styles.overlayBtnSecondary} onPress={restartLevel}>
          <Text style={styles.overlayBtnSecondaryText}>↻ RETRY</Text>
        </Pressable>
        <Pressable style={styles.overlayBtnSecondary} onPress={goToMenu}>
          <Text style={styles.overlayBtnSecondaryText}>MENU</Text>
        </Pressable>
      </View>
    </View>
  );
}
