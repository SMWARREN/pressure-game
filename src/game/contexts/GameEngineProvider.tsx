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
let initAttempted = false;

export function GameEngineProvider({ children, statsBackend }: GameEngineProviderProps) {
  const contextRef = useRef<GameEngineContextType | null>(null);

  // Initialize engines on first render
  if (!contextRef.current && !initAttempted) {
    initAttempted = true;
    try {
      console.time('[perf] GameEngineProvider init');

      // Create pressure engine
      console.time('[perf] createPressureEngine');
      const pressureEngine = createPressureEngine();
      console.timeEnd('[perf] createPressureEngine');

      console.time('[perf] engine.init');
      pressureEngine.init(
        () => useGameStore.getState(),
        (partial) => useGameStore.setState(partial)
      );
      console.timeEnd('[perf] engine.init');

      // Hydrate store with engine's initial state
      console.time('[perf] getInitialState');
      const initialState = pressureEngine.getInitialState();
      console.timeEnd('[perf] getInitialState');

      // Set selectedWorld to the first world of the current mode
      console.time('[perf] getModeById');
      const currentMode = getModeById(initialState.currentModeId);
      console.timeEnd('[perf] getModeById');
      const defaultWorld = currentMode.worlds?.[0]?.id ?? 1;

      console.time('[perf] store.setState');
      useGameStore.setState({
        ...initialState,
        selectedWorld: defaultWorld,
      });
      console.timeEnd('[perf] store.setState');

      // Make pressure engine available to store actions
      _setEngineInstance(pressureEngine);

      // Create stats engine and start it immediately
      console.time('[perf] StatsEngine');
      const backend = statsBackend ?? new LocalStorageStatsBackend();
      const statsEngine = new StatsEngine(backend);
      statsEngine.start();
      console.timeEnd('[perf] StatsEngine');

      // Create achievement engine
      console.time('[perf] AchievementEngine');
      const achievementEngine = new AchievementEngine();
      console.timeEnd('[perf] AchievementEngine');

      // Store context both locally and globally
      contextRef.current = {
        pressureEngine,
        statsEngine,
        achievementEngine,
      };
      globalContext = contextRef.current;
      console.timeEnd('[perf] GameEngineProvider init');
      console.log('[perf] All engines initialized successfully');
    } catch (error) {
      console.error('[GameEngineProvider] Initialization error:', error);
      // Don't throw - just render null and let the error propagate through context access
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
        } catch (error) {
          console.error('[GameEngineProvider] Cleanup error:', error);
        }
        globalContext = null;
        contextRef.current = null;
      }
    };
  }, []);

  if (!contextRef.current) {
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
