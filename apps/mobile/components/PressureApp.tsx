import React from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameEngineProvider } from '@/game/contexts/GameEngineProvider';
import '@/game/stats'; // bootstrap stats engine
import MainScreen from './MainScreen.native';

interface PressureAppProps {
  style?: ViewStyle;
}

export default function PressureApp({ style: _style }: PressureAppProps) {
  return (
    <SafeAreaProvider>
      <GameEngineProvider onReady={() => {}}>
        <MainScreen />
      </GameEngineProvider>
    </SafeAreaProvider>
  );
}
