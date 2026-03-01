import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
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

export function GameEngineProvider({ children, statsBackend }: GameEngineProviderProps) {
  const pressureEngineRef = useRef<PressureEngine | null>(null);
  const statsEngineRef = useRef<StatsEngine | null>(null);
  const achievementEngineRef = useRef<AchievementEngine | null>(null);

  useEffect(() => {
    // Create fresh engine instances on mount - all at once
    if (!pressureEngineRef.current) {
      // Create pressure engine
      const pressureEngine = createPressureEngine();
      pressureEngine.init(
        () => useGameStore.getState(),
        (partial) => useGameStore.setState(partial)
      );

      // Hydrate store with engine's initial state
      const initialState = pressureEngine.getInitialState();

      // Set selectedWorld to the first world of the current mode
      const currentMode = getModeById(initialState.currentModeId);
      const defaultWorld = currentMode.worlds?.[0]?.id ?? 1;

      useGameStore.setState({
        ...initialState,
        selectedWorld: defaultWorld,
      });

      // Make pressure engine available to store actions
      _setEngineInstance(pressureEngine);
      pressureEngineRef.current = pressureEngine;

      // Create stats engine
      const backend = statsBackend ?? new LocalStorageStatsBackend();
      const statsEngine = new StatsEngine(backend);
      statsEngine.start();
      statsEngineRef.current = statsEngine;

      // Create achievement engine
      const achievementEngine = new AchievementEngine();
      achievementEngineRef.current = achievementEngine;
    }

    // Cleanup on unmount
    return () => {
      if (pressureEngineRef.current) {
        pressureEngineRef.current.destroy();
        _setEngineInstance(null as any);
        pressureEngineRef.current = null;
      }
      if (statsEngineRef.current) {
        statsEngineRef.current.stop();
        statsEngineRef.current = null;
      }
      if (achievementEngineRef.current) {
        achievementEngineRef.current = null;
      }
    };
  }, [statsBackend]);

  if (!pressureEngineRef.current || !statsEngineRef.current || !achievementEngineRef.current) {
    return null;
  }

  return (
    <GameEngineContext.Provider
      value={{
        pressureEngine: pressureEngineRef.current,
        statsEngine: statsEngineRef.current,
        achievementEngine: achievementEngineRef.current,
      }}
    >
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
