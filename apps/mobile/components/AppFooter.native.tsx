import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface AppFooterProps {
  onSettingsPress?: () => void;
  onLevelSelectorPress?: () => void;
}

export default function AppFooter({
  onSettingsPress,
  onLevelSelectorPress,
}: AppFooterProps) {
  return (
    <View style={styles.footer}>
      {/* Settings Button (Left) */}
      <Pressable
        onPress={onSettingsPress}
        style={styles.footerButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonIcon}>⚙️</Text>
        <Text style={styles.buttonLabel}>Settings</Text>
      </Pressable>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Level Selector Button (Right) */}
      <Pressable
        onPress={onLevelSelectorPress}
        style={styles.footerButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonIcon}>🎮</Text>
        <Text style={styles.buttonLabel}>Levels</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#12122a',
    backgroundColor: 'rgba(6, 6, 15, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#12122a',
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
});
