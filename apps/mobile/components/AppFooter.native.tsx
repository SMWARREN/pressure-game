import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface AppFooterProps {
  onPausePress?: () => void;
  onUndoPress?: () => void;
  onHintPress?: () => void;
  isPaused?: boolean;
  showUndo?: boolean;
  showHint?: boolean;
  timeDisplay?: string;
  movesDisplay?: string;
  scoreDisplay?: string;
}

export default function AppFooter({
  onPausePress,
  onUndoPress,
  onHintPress,
  isPaused = false,
  showUndo = true,
  showHint = true,
  timeDisplay,
  movesDisplay,
  scoreDisplay,
}: AppFooterProps) {
  return (
    <View style={styles.footer}>
      <View style={styles.buttonsContainer}>
        {showUndo && (
          <Pressable
            onPress={onUndoPress}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.buttonIcon}>↶</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onPausePress}
          style={[styles.iconButton, isPaused && styles.iconButtonActive]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.buttonIcon}>{isPaused ? '▶' : '⏸'}</Text>
        </Pressable>

        {showHint && (
          <Pressable
            onPress={onHintPress}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.buttonIcon}>💡</Text>
          </Pressable>
        )}
      </View>

      {(timeDisplay || movesDisplay || scoreDisplay) && (
        <View style={styles.statsContainer}>
          {timeDisplay && (
            <Text style={styles.statText}>{timeDisplay}</Text>
          )}
          {movesDisplay && (
            <Text style={styles.statText}>{movesDisplay}</Text>
          )}
          {scoreDisplay && (
            <Text style={styles.statText}>{scoreDisplay}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: '#12122a',
    backgroundColor: 'rgba(6, 6, 15, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#12122a',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#3a3a55',
  },
  buttonIcon: {
    fontSize: 16,
    color: '#3a3a55',
    fontWeight: '600',
  },
  statsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
});
