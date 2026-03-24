import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGameStore, _setEngineInstance } from '@/game/store';
import { createPressureEngine, type PressureEngine } from '@/game/engine/index';
import { StatsEngine } from '@/game/stats/engine';
import { AchievementEngine } from '@/game/achievements/engine';
import { LocalStorageStatsBackend } from '@/game/stats/backends/localStorage';
import { getModeById } from '@/game/modes';
import type { StatsBackend, GameEndEvent } from '@/game/stats/types';
import { SyncingBackend, MySQLBackend } from '@/game/engine/persistence';
import { saveReplay } from '@/game/api/leaderboards';
import { getUserId } from '@/game/utils/userId';
export { getUserId } from '@/game/utils/userId';

interface GameEngineContextType {
  readonly pressureEngine: PressureEngine;
  readonly statsEngine: StatsEngine;
  readonly achievementEngine: AchievementEngine;
}

export const GameEngineContext = createContext<GameEngineContextType | null>(null);

interface GameEngineProviderProps {
  readonly children: ReactNode;
  readonly statsBackend?: StatsBackend;
  readonly persistenceBackend?: import('@/game/engine/backends').PersistenceBackend;
  readonly onReady?: () => void;
}

// Module-level tracking for StrictMode compatibility
// In StrictMode, the useState initializer runs twice, but we only want to create engines once
let enginesCreated = false;
let enginesInstance: GameEngineContextType | null = null;

/**
 * Construct API base URL by removing /api.php suffix (no trailing slash)
 */
function getApiBaseUrl(viteUrl: string): string {
  if (!viteUrl) return '';
  return viteUrl.replace('/api.php', '').replace(/\/$/, '');
}

/** Mark a performance event, ignoring environments where the API is absent. */
function perfMark(name: string): void {
  try {
    performance.mark(name);
  } catch {
    // performance API not available in all environments
  }
}

/** Emit a performance measure between two marks, logging the result. */
function perfMeasure(name: string, start: string, end: string): void {
  try {
    performance.measure(name, start, end);
    const measure = performance.getEntriesByName(name)[0];
    console.log(`[PERF] Engine creation took ${measure.duration.toFixed(2)}ms`);
  } catch {
    // Performance API not available in some environments - safe to ignore
  }
}

/** Resolve the persistence backend from environment variables or an explicit override. */
function resolvePersistenceBackend(
  overridePersistenceBackend?: import('@/game/engine/backends').PersistenceBackend
): import('@/game/engine/backends').PersistenceBackend | undefined {
  if (overridePersistenceBackend) {
    return overridePersistenceBackend;
  }

  const importMetaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const backendType =
    importMetaEnv?.VITE_PERSISTENCE_BACKEND ||
    (typeof process !== 'undefined' && process.env?.VITE_PERSISTENCE_BACKEND) ||
    'localStorage';
  const viteApiUrl =
    importMetaEnv?.VITE_API_URL || (typeof process !== 'undefined' && process.env?.VITE_API_URL);
  const apiUrl = getApiBaseUrl(viteApiUrl || '');

  if (backendType === 'syncing' && apiUrl) {
    return new SyncingBackend(apiUrl, getUserId());
  }
  if (backendType === 'database' && apiUrl) {
    return new MySQLBackend(apiUrl, getUserId());
  }
  return undefined;
}

/** Initialise the pressure engine, sync state to the store, and set up debug helpers. */
function initialisePressureEngine(
  persistenceBackend?: import('@/game/engine/backends').PersistenceBackend
): PressureEngine {
  const pressureEngine: PressureEngine = createPressureEngine({ persistenceBackend });

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    perfMark('pressure-engine-created');
  }

  pressureEngine.init(
    () => useGameStore.getState(),
    (partial) => useGameStore.setState(partial)
  );

  const initialState = pressureEngine.getInitialState();
  const currentMode = getModeById(initialState.currentModeId);
  const defaultWorld = currentMode.worlds?.[0]?.id ?? 1;

  useGameStore.setState({ ...initialState, selectedWorld: defaultWorld });
  _setEngineInstance(pressureEngine);

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    (globalThis as any).__PRESSURE_ENGINE__ = pressureEngine;
  }

  return pressureEngine;
}

/** Create and wire the stats engine, including replay saving on game end. */
function createStatsEngine(statsBackend?: StatsBackend): StatsEngine {
  const backend = statsBackend ?? new LocalStorageStatsBackend();
  const statsEngine = new StatsEngine(backend);
  statsEngine.start();

  statsEngine.setOnGameEnd((event: GameEndEvent) => {
    if (event.outcome === 'won') {
      saveReplay(event.modeId, event.levelId, event.moveLog as any, event.score).catch((err) =>
        console.warn('[GameEngineProvider] Failed to save replay:', err)
      );
    }
  });

  return statsEngine;
}

/**
 * Create engines - this function is called during render
 * but the engines are only created once due to module-level tracking.
 */
function getOrCreateEngines(
  statsBackend?: StatsBackend,
  overridePersistenceBackend?: import('@/game/engine/backends').PersistenceBackend
): GameEngineContextType {
  // Return existing instance if already created (handles StrictMode double-invocation)
  if (enginesCreated && enginesInstance) {
    return enginesInstance;
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    perfMark('engine-create-start');
  }

  const persistenceBackend = resolvePersistenceBackend(overridePersistenceBackend);
  const pressureEngine = initialisePressureEngine(persistenceBackend);
  const statsEngine = createStatsEngine(statsBackend);

  const achievementEngine = new AchievementEngine();
  pressureEngine.setAchievementEngine(achievementEngine);

  enginesInstance = { pressureEngine, statsEngine, achievementEngine };
  enginesCreated = true;

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    perfMark('engine-create-end');
    perfMeasure('engine-creation', 'engine-create-start', 'engine-create-end');
  }

  return enginesInstance;
}

export function GameEngineProvider({
  children,
  statsBackend,
  persistenceBackend,
  onReady,
}: GameEngineProviderProps) {
  // Create engines synchronously during first render using useState initializer
  // This ensures the engine is available immediately when children render
  const [engines] = useState<GameEngineContextType>(() =>
    getOrCreateEngines(statsBackend, persistenceBackend)
  );

  // Call onReady callback after engines are created
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Cleanup on unmount - but don't clear the module-level instance
  // because StrictMode will remount and expect the same engines
  useEffect(() => {
    return () => {
      // Only cleanup if the component is truly unmounting (not StrictMode remount)
      // We don't clear enginesCreated here because React StrictMode will remount
      // and expect the same state. Real cleanup happens on page unload.
    };
  }, []);

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
