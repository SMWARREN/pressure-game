import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameEngineProvider } from '@/game/contexts/GameEngineProvider';
import { InMemoryStatsBackend } from '@/game/stats/backends/memory';
import { InMemoryBackend } from '@/game/engine/backends';
import MainScreen from './components/MainScreen.native';

const statsBackend = new InMemoryStatsBackend();
const persistenceBackend = new InMemoryBackend();

export default function App() {
  return (
    <SafeAreaProvider>
      <GameEngineProvider
        statsBackend={statsBackend}
        persistenceBackend={persistenceBackend}
        onReady={() => {}}
      >
        <MainScreen />
      </GameEngineProvider>
      <StatusBar style="light" hidden />
    </SafeAreaProvider>
  );
}
