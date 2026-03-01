import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useGameStore, _setEngineInstance } from '@/game/store';
import { createPressureEngine, type PressureEngine } from '@/game/engine/index';
import { StatsEngine } from '@/game/stats/engine';
import { AchievementEngine } from '@/game/achievements/engine';
import { LocalStorageStatsBackend } from '@/game/stats/backends/localStorage';
import { getModeById } from '@/game/modes';
import type { StatsBackend } from '@/game/stats/types';

interface GameEngineContextType {
  pressureEngine: PressureEngine;
  statsEngine: StatsEngine;
  achievementEngine: AchievementEngine;
}

export const GameEngineContext = createContext<GameEngineContextType | null>(null);

interface GameEngineProviderProps {
  children: ReactNode;
  statsBackend?: StatsBackend;
}

let engines: GameEngineContextType | null = null;

export function GameEngineProvider({ children, statsBackend }: GameEngineProviderProps) {
  // Initialize on first mount only
  useEffect(() => {
    if (engines) return; // Already initialized

    try {
      const pressureEngine = createPressureEngine();
      pressureEngine.init(
        () => useGameStore.getState(),
        (partial) => useGameStore.setState(partial)
      );

      const initialState = pressureEngine.getInitialState();
      const currentMode = getModeById(initialState.currentModeId);
      const defaultWorld = currentMode.worlds?.[0]?.id ?? 1;

      useGameStore.setState({
        ...initialState,
        selectedWorld: defaultWorld,
      });

      _setEngineInstance(pressureEngine);

      const backend = statsBackend ?? new LocalStorageStatsBackend();
      const statsEngine = new StatsEngine(backend);
      statsEngine.start();

      const achievementEngine = new AchievementEngine();

      engines = { pressureEngine, statsEngine, achievementEngine };
      console.log('[GameEngineProvider] Engines initialized');
    } catch (error) {
      console.error('[GameEngineProvider] Init error:', error);
    }

    return () => {
      if (engines) {
        try {
          engines.pressureEngine.destroy();
          engines.statsEngine.stop();
          _setEngineInstance(null as any);
          engines = null;
        } catch (error) {
          console.error('[GameEngineProvider] Cleanup error:', error);
        }
      }
    };
  }, [statsBackend]);

  if (!engines) return null;

  return (
    <GameEngineContext.Provider value={engines}>
      {children}
    </GameEngineContext.Provider>
  );
}

export function useEngine(): PressureEngine {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useEngine() must be used within <GameEngineProvider>');
  }
  return context.pressureEngine;
}

export function useStats(): StatsEngine {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useStats() must be used within <GameEngineProvider>');
  }
  return context.statsEngine;
}

export function useAchievements(): AchievementEngine {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useAchievements() must be used within <GameEngineProvider>');
  }
  return context.achievementEngine;
}
