import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  readonly children: ReactNode;
  readonly statsBackend?: StatsBackend;
  readonly pressureEngine?: PressureEngine;
  readonly onReady?: () => void;
}

export function GameEngineProvider({
  children,
  statsBackend,
  pressureEngine: initialEngine,
  onReady,
}: GameEngineProviderProps) {
  const [engines, setEngines] = useState<GameEngineContextType | null>(null);

  // Ensure engine exists - fallback if not created in main.tsx
  useEffect(() => {
    // Check if engine was already set (from main.tsx)
    if (!initialEngine) {
      // Create and set engine if it doesn't exist
      const newEngine = createPressureEngine();
      _setEngineInstance(newEngine);
    }
  }, [initialEngine]);

  useEffect(() => {
    try {
      // Dev-only initialization hook
      const pressureEngine = initialEngine ?? createPressureEngine();
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

      setEngines({ pressureEngine, statsEngine, achievementEngine });
      // Signal that initialization is complete
      onReady?.();
    } catch (error) {
      console.error('[GameEngineProvider] ❌ Init error:', error);
      console.error('[GameEngineProvider] Error details:', (error as any)?.message);
      // Even on error, try to at least render something
      if (onReady) {
        onReady();
      }
    }

    return () => {
      setEngines((prev) => {
        if (prev) {
          try {
            prev.pressureEngine.destroy();
            prev.statsEngine.stop();
            // Don't set engine to null — it breaks StrictMode double-mount
            // Just clean up the engines, leave the module instance
          } catch (error) {
            console.error('[GameEngineProvider] Cleanup error:', error);
          }
        }
        return null;
      });
    };
  }, [statsBackend]);

  if (!engines) {
    return null;
  }

  return <GameEngineContext.Provider value={engines}>{children}</GameEngineContext.Provider>;
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
