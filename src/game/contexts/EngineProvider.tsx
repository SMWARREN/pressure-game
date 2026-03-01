import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useGameStore, _setEngineInstance } from '@/game/store';
import { createPressureEngine, type PressureEngine } from '@/game/engine/index';
import { getModeById } from '@/game/modes';

interface EngineContextType {
  readonly engine: PressureEngine;
}

export const EngineContext = createContext<EngineContextType | null>(null);

type EngineProviderProps = { readonly children: React.ReactNode };

export function EngineProvider({ children }: EngineProviderProps) {
  const engineRef = useRef<PressureEngine | null>(null);

  useEffect(() => {
    // Create a fresh engine instance on mount
    if (!engineRef.current) {
      const engine = createPressureEngine();
      // Initialize with store access
      engine.init(
        () => useGameStore.getState(),
        (partial) => useGameStore.setState(partial)
      );

      // Hydrate store with engine's initial state
      const initialState = engine.getInitialState();

      // Set selectedWorld to the first world of the current mode
      const currentMode = getModeById(initialState.currentModeId);
      const defaultWorld = currentMode.worlds?.[0]?.id ?? 1;

      useGameStore.setState({
        ...initialState,
        selectedWorld: defaultWorld,
      });

      // Make engine available to store actions
      _setEngineInstance(engine);
      engineRef.current = engine;
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        _setEngineInstance(null);
        engineRef.current = null;
      }
    };
  }, []);

  if (!engineRef.current) {
    return null;
  }

  const value = useMemo(() => ({ engine: engineRef.current! }), []);

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine(): PressureEngine {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine() must be used within <EngineProvider>');
  }
  return context.engine;
}
