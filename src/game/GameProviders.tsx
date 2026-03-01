import { ReactNode } from 'react';
import { EngineProvider } from '@/game/contexts/EngineProvider';
import { StatsProvider } from '@/game/contexts/StatsProvider';
import { AchievementsProvider } from '@/game/contexts/AchievementsProvider';
import type { StatsBackend } from '@/game/stats/types';

interface GameProvidersProps {
  children: ReactNode;
  statsBackend?: StatsBackend;
}

export function GameProviders({ children, statsBackend }: GameProvidersProps) {
  return (
    <EngineProvider>
      <StatsProvider backendOverride={statsBackend}>
        <AchievementsProvider>
          {children}
        </AchievementsProvider>
      </StatsProvider>
    </EngineProvider>
  );
}
