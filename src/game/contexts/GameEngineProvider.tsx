import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGameStore, _setEngineInstance } from '@/game/store';
import { createPressureEngine, type PressureEngine } from '@/game/engine/index';
import { createNativeMockEngine } from '@/game/engine/native-mock';
import { StatsEngine } from '@/game/stats/engine';
import { AchievementEngine } from '@/game/achievements/engine';
import { LocalStorageStatsBackend } from '@/game/stats/backends/localStorage';
import { getModeById } from '@/game/modes';
import type { StatsBackend, GameEndEvent } from '@/game/stats/types';
import { SyncingBackend, MySQLBackend } from '@/game/engine/persistence';
import { saveReplay } from '@/game/api/leaderboards';
import { getUserId } from '@/game/utils/userId';

// Re-export for backwards compatibility
export { getUserId };

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
 * Construct API base URL by removing /api.php suffix (no trailing slash)
 */
function getApiBaseUrl(viteUrl: string): string {
  if (!viteUrl) return '';
  return viteUrl.replace('/api.php', '').replace(/\/$/, '');
}

/**
 * Detect if we're running in React Native environment
 */
function isReactNative(): boolean {
  try {
    // Check for React Native global objects
    return typeof navigator !== 'undefined' &&
           (navigator.product === 'ReactNative' ||
            typeof global !== 'undefined' && (global as any).__DEV__ !== undefined);
  } catch {
    return false;
  }
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
    try {
      performance.mark('engine-create-start');
    } catch {
      // performance API not available in all environments
    }
  }

  // Use mock engine for React Native development
  let pressureEngine: PressureEngine;

  if (isReactNative()) {
    pressureEngine = createNativeMockEngine() as PressureEngine;
    console.log('[🔨 Dev] Using native mock pressure engine for React Native');
  } else {
    // Configure persistence backend from environment (support both Vite and React Native)
    const backendType = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PERSISTENCE_BACKEND) ||
                        process.env.VITE_PERSISTENCE_BACKEND ||
                        'localStorage';
    const viteApiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
                       process.env.VITE_API_URL;
    const apiUrl = getApiBaseUrl(viteApiUrl || '');

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
    pressureEngine = createPressureEngine({
      persistenceBackend,
    });
  }

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

  // Wire up replay saving when games end
  statsEngine.setOnGameEnd((event: GameEndEvent) => {
    if (event.outcome === 'won') {
      saveReplay(event.modeId, event.levelId, event.moveLog as any, event.score).catch((err) =>
        console.warn('[GameEngineProvider] Failed to save replay:', err)
      );
    }
  });

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
    } catch {
      // Performance API not available in some environments - safe to ignore
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
