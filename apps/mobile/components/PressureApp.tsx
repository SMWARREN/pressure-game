import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GameEngineProvider } from '@/game/contexts/GameEngineProvider';
import '@/game/stats'; // bootstrap stats engine

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#06060f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#999999',
    fontSize: 16,
    marginTop: 12,
  },
});

interface PressureAppProps {
  style?: ViewStyle;
}

export default function PressureApp({ style }: PressureAppProps) {
  return (
    <GameEngineProvider onReady={() => {}}>
      <View style={[styles.container, style]}>
        <Text style={styles.text}>PRESSURE</Text>
        <Text style={styles.subtitle}>Game loading...</Text>
      </View>
    </GameEngineProvider>
  );
}
