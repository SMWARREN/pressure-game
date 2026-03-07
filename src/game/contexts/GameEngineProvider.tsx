import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGameStore, _setEngineInstance } from '@/game/store';
import { createPressureEngine, type PressureEngine } from '@/game/engine/index';
import { StatsEngine } from '@/game/stats/engine';
import { AchievementEngine } from '@/game/achievements/engine';
import { LocalStorageStatsBackend } from '@/game/stats/backends/localStorage';
import { getModeById } from '@/game/modes';
import type { StatsBackend } from '@/game/stats/types';
import { SyncingBackend, MySQLBackend } from '@/game/engine/persistence';
import { STORAGE_KEYS } from '@/utils/constants';

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
// In StrictMode, the useState initializer runs twice, but we only want to create engines once
let enginesCreated = false;
let enginesInstance: GameEngineContextType | null = null;

/**
 * Get or generate user ID for database persistence
 * Exported so API clients can use the same user ID
 */
export function getUserId(): string {
  const envUserId = import.meta.env.VITE_USER_ID;
  if (envUserId) {
    return envUserId;
  }

  // Check localStorage for existing user ID
  const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (storedUserId) {
    return storedUserId;
  }

  // Generate new UUID for anonymous user
  const newUserId = `user_${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
  return newUserId;
}

/**
 * Construct API base URL by removing /api.php suffix (no trailing slash)
 */
function getApiBaseUrl(viteUrl: string): string {
  if (!viteUrl) return '';
  return viteUrl.replace('/api.php', '').replace(/\/$/, '');
}

/**
 * Create engines - this function is called during render
 * but the engines are only created once due to module-level tracking.
 */
function getOrCreateEngines(statsBackend?: StatsBackend): GameEngineContextType {
  // Return existing instance if already created (handles StrictMode double-invocation)
  if (enginesCreated && enginesInstance) {
    return enginesInstance;
  }

  if (process.env.NODE_ENV !== 'production') {
    performance.mark('engine-create-start');
  }

  // Configure persistence backend from environment
  const backendType = import.meta.env.VITE_PERSISTENCE_BACKEND || 'localStorage';
  const viteApiUrl = import.meta.env.VITE_API_URL;
  const apiUrl = getApiBaseUrl(viteApiUrl);

  let persistenceBackend = undefined;

  if (backendType === 'syncing' && apiUrl) {
    // Offline-first with sync (recommended)
    const userId = getUserId();
    persistenceBackend = new SyncingBackend(apiUrl, userId);
  } else if (backendType === 'database' && apiUrl) {
    // Direct database (online only)
    const userId = getUserId();
    persistenceBackend = new MySQLBackend(apiUrl, userId);
  }
  // else: use default LocalStorageBackend

  // Create engine with configured backend
  const pressureEngine = createPressureEngine({
    persistenceBackend,
  });

  if (process.env.NODE_ENV !== 'production') {
    performance.mark('pressure-engine-created');
  }

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

  // Expose engine for E2E testing
  if (process.env.NODE_ENV !== 'production') {
    (globalThis as any).__PRESSURE_ENGINE__ = pressureEngine;
  }

  const backend = statsBackend ?? new LocalStorageStatsBackend();
  const statsEngine = new StatsEngine(backend);
  statsEngine.start();

  const achievementEngine = new AchievementEngine();

  // Connect achievement engine to pressure engine for achievement tracking
  pressureEngine.setAchievementEngine(achievementEngine);

  enginesInstance = { pressureEngine, statsEngine, achievementEngine };
  enginesCreated = true;

  if (process.env.NODE_ENV !== 'production') {
    performance.mark('engine-create-end');
    try {
      performance.measure('engine-creation', 'engine-create-start', 'engine-create-end');
      const measure = performance.getEntriesByName('engine-creation')[0];
      console.log(`[PERF] Engine creation took ${measure.duration.toFixed(2)}ms`);
    } catch (e) {
      // ignore
    }
  }

  return enginesInstance;
}

export function GameEngineProvider({ children, statsBackend, onReady }: GameEngineProviderProps) {
  // Create engines synchronously during first render using useState initializer
  // This ensures the engine is available immediately when children render
  const [engines] = useState<GameEngineContextType>(() => getOrCreateEngines(statsBackend));

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
