import { ReactNode } from 'react';
import { GameEngineProvider } from '@/game/contexts/GameEngineProvider';
import type { StatsBackend } from '@/game/stats/types';
import type { PressureEngine } from '@/game/engine';

interface GameProvidersProps {
  children: ReactNode;
  statsBackend?: StatsBackend;
  pressureEngine?: PressureEngine;
  onEngineReady?: () => void;
}

export function GameProviders({ children, statsBackend, pressureEngine, onEngineReady }: GameProvidersProps) {
  return (
    <GameEngineProvider statsBackend={statsBackend} pressureEngine={pressureEngine} onReady={onEngineReady}>
      {children}
    </GameEngineProvider>
  );
}
