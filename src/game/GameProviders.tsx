import { ReactNode } from 'react';
import { GameEngineProvider } from '@/game/contexts/GameEngineProvider';
import type { StatsBackend } from '@/game/stats/types';

interface GameProvidersProps {
  readonly children: ReactNode;
  readonly statsBackend?: StatsBackend;
  readonly onEngineReady?: () => void;
}

export function GameProviders({ children, statsBackend, onEngineReady }: GameProvidersProps) {
  return (
    <GameEngineProvider statsBackend={statsBackend} onReady={onEngineReady}>
      {children}
    </GameEngineProvider>
  );
}
