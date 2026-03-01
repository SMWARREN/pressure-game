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

let globalContext: GameEngineContextType | null = null;

export function GameEngineProvider({ children, statsBackend }: GameEngineProviderProps) {
  const contextRef = useRef<GameEngineContextType | null>(null);

  // Initialize engines on first render
  if (!contextRef.current && !globalContext) {
    try {
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

      // Create stats engine and start it immediately
      const backend = statsBackend ?? new LocalStorageStatsBackend();
      const statsEngine = new StatsEngine(backend);
      statsEngine.start();

      // Create achievement engine
      const achievementEngine = new AchievementEngine();

      // Store context both locally and globally
      contextRef.current = {
        pressureEngine,
        statsEngine,
        achievementEngine,
      };
      globalContext = contextRef.current;

      console.log('[GameEngineProvider] Initialized successfully');
    } catch (error) {
      console.error('[GameEngineProvider] Initialization error:', error);
      throw error;
    }
  } else if (globalContext && !contextRef.current) {
    contextRef.current = globalContext;
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (contextRef.current) {
        try {
          contextRef.current.pressureEngine.destroy();
          _setEngineInstance(null as any);
          contextRef.current.statsEngine.stop();
          globalContext = null;
          contextRef.current = null;
        } catch (error) {
          console.error('[GameEngineProvider] Cleanup error:', error);
        }
      }
    };
  }, []);

  if (!contextRef.current) {
    console.warn('[GameEngineProvider] No context available, returning null');
    return null;
  }

  return (
    <GameEngineContext.Provider value={contextRef.current}>
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
