import { createContext, useContext, useMemo } from 'react';
import { AchievementEngine } from '@/game/achievements/engine';

interface AchievementsContextType {
  engine: AchievementEngine;
}

export const AchievementsContext = createContext<AchievementsContextType | null>(null);

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      engine: new AchievementEngine(),
    }),
    []
  );

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements(): AchievementEngine {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementsProvider');
  }
  return context.engine;
}
