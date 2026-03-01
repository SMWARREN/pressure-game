import { ReactNode } from 'react';
import { GameEngineProvider } from '@/game/contexts/GameEngineProvider';
import type { StatsBackend } from '@/game/stats/types';

interface GameProvidersProps {
  children: ReactNode;
  statsBackend?: StatsBackend;
}

export function GameProviders({ children, statsBackend }: GameProvidersProps) {
  return (
    <GameEngineProvider statsBackend={statsBackend}>
      {children}
    </GameEngineProvider>
  );
}
