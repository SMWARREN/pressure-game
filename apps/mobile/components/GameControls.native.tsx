import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface GameControlsProps {
  readonly status: string;
  readonly onUndo: () => void;
  readonly onReset: () => void;
}

/**
 * GameControls (Mobile/React Native)
 * Control buttons: Undo, Reset, Menu
 */
export default function GameControls({
  status,
  onUndo,
  onReset,
}: GameControlsProps) {
  const isGameActive = status === 'playing';

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onUndo}
        disabled={!isGameActive}
        style={({ pressed }) => [
          styles.button,
          !isGameActive && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>↶ Undo</Text>
      </Pressable>

      <Pressable
        onPress={onReset}
        style={({ pressed }) => [
          styles.button,
          styles.dangerButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>✕ Reset</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>≡ Menu</Text>
      </Pressable>
    </View>
  );
}

const styles = {
  container: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: '#374151',
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
};
