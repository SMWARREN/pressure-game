import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGameStore, _setEngineInstance } from '@/game/store';
import { createPressureEngine, PressureEngine } from '@/game/engine/index';
import { StatsEngine } from '@/game/stats/engine';
import { AchievementEngine } from '@/game/achievements/engine';
import { LocalStorageStatsBackend } from '@/game/stats/backends/localStorage';
import { getModeById } from '@/game/modes';
import type { StatsBackend } from '@/game/stats/types';
export { getUserId } from '@/game/utils/userId';
import { InMemoryBackend } from '@/game/engine/persistence';

interface GameEngineContextType {
  readonly pressureEngine: PressureEngine;
  readonly statsEngine: StatsEngine;
  readonly achievementEngine: AchievementEngine;
}

export const GameEngineContext = createContext<GameEngineContextType | null>(null);

interface GameEngineProviderProps {
  readonly children: ReactNode;
  readonly statsBackend?: StatsBackend;
  readonly onReady?: () => void;
}

// Module-level tracking for StrictMode compatibility
let enginesCreated = false;
let enginesInstance: GameEngineContextType | null = null;

/**
 * Create engines - mobile version uses InMemoryBackend to avoid browser APIs
 */
function getOrCreateEngines(statsBackend?: StatsBackend): GameEngineContextType {
  // Return existing instance if already created
  if (enginesCreated && enginesInstance) {
    return enginesInstance;
  }

  // Use InMemoryBackend for mobile to avoid browser-only APIs like cookies/document
  const persistenceBackend = new InMemoryBackend();

  // Create PressureEngine with InMemoryBackend to avoid browser APIs
  const pressureEngine = createPressureEngine({
    persistenceBackend,
  });

  // Initialize engine with store access
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

  // Set engine instance in store for module-level access
  _setEngineInstance(pressureEngine);

  const statsEngine = new StatsEngine(statsBackend || new LocalStorageStatsBackend());
  statsEngine.start();

  const achievementEngine = new AchievementEngine();

  // Connect achievement engine to pressure engine for achievement tracking
  pressureEngine.setAchievementEngine(achievementEngine);

  enginesInstance = {
    pressureEngine,
    statsEngine,
    achievementEngine,
  };

  enginesCreated = true;

  return enginesInstance;
}

/**
 * Provider component - initializes engines on mount
 */
export function GameEngineProvider({ children, statsBackend, onReady }: GameEngineProviderProps) {
  // Create engines synchronously during first render using useState initializer
  // This ensures the engine is available immediately when children render
  const [engines] = useState<GameEngineContextType>(() => getOrCreateEngines(statsBackend));

  // Call onReady callback after engines are created
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return <GameEngineContext.Provider value={engines}>{children}</GameEngineContext.Provider>;
}

export function useGameEngineContext() {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useGameEngineContext must be used within GameEngineProvider');
  }
  return context;
}
