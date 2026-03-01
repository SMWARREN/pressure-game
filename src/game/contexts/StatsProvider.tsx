import { createContext, useContext, useEffect, useRef } from 'react';
import { StatsEngine } from '@/game/stats/engine';
import { LocalStorageStatsBackend } from '@/game/stats/backends/localStorage';
import type { StatsBackend } from '@/game/stats/types';

interface StatsContextType {
  engine: StatsEngine;
}

export const StatsContext = createContext<StatsContextType | null>(null);

export function StatsProvider({
  children,
  backendOverride,
}: {
  children: React.ReactNode;
  backendOverride?: StatsBackend;
}) {
  const engineRef = useRef<StatsEngine | null>(null);

  useEffect(() => {
    // Create a fresh StatsEngine instance on mount
    if (!engineRef.current) {
      const backend = backendOverride ?? new LocalStorageStatsBackend();
      const engine = new StatsEngine(backend);
      // Subscribe to store changes
      engine.start();
      engineRef.current = engine;
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, [backendOverride]);

  if (!engineRef.current) {
    return null;
  }

  return (
    <StatsContext.Provider value={{ engine: engineRef.current }}>{children}</StatsContext.Provider>
  );
}

export function useStats(): StatsEngine {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats() must be used within <StatsProvider>');
  }
  return context.engine;
}
