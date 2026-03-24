import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { styles } from './GameBoardStyles.native';

interface GameBoardFooterProps {
  showUndo: boolean;
  showTimer: boolean;
  isPaused: boolean;
  historyLength: number;
  timeUntilCompression: number | null;
  paddingBottom: number;
  onUndo: () => void;
  onPause: () => void;
  onResume: () => void;
}

export default function GameBoardFooter({
  showUndo, showTimer, isPaused, historyLength,
  timeUntilCompression, paddingBottom, onUndo, onPause, onResume,
}: GameBoardFooterProps) {
  return (
    <View style={[styles.footer, { paddingBottom }]}>
      {showUndo && (
        <Pressable
          style={[styles.footerBtn, historyLength === 0 && styles.footerBtnDisabled]}
          onPress={onUndo}
          disabled={historyLength === 0}
          hitSlop={8}
        >
          <Image source={require('../assets/emoji-undo.png')} style={styles.footerIcon} />
        </Pressable>
      )}

      {showTimer && (
        <View style={styles.footerTimeWrap}>
          <Text style={styles.footerTime}>
            {String(Math.floor((timeUntilCompression ?? 0) / 1000)).padStart(2, '0')}
          </Text>
          <Text style={styles.footerTimeLabel}>TIME</Text>
        </View>
      )}

      <Pressable style={styles.footerBtn} onPress={isPaused ? onResume : onPause} hitSlop={8}>
        <Image
          source={isPaused ? require('../assets/emoji-play.png') : require('../assets/emoji-pause.png')}
          style={styles.footerIcon}
        />
      </Pressable>

      <Pressable style={styles.footerBtn} hitSlop={8}>
        <Image source={require('../assets/emoji-hint.png')} style={styles.footerIcon} />
      </Pressable>

      <Pressable
        style={[styles.footerBtn, { borderColor: '#6366f155', backgroundColor: '#6366f110' }]}
        hitSlop={8}
      >
        <Image source={require('../assets/emoji-sparkles.png')} style={styles.footerIcon} />
      </Pressable>
    </View>
  );
}
