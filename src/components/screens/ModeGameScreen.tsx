/**
 * ModeGameScreen
 * Routes game rendering to mode-specific implementations if available,
 * otherwise falls back to the default game screen.
 *
 * This wrapper allows per-mode customization of:
 * - Overlay text and styling
 * - Footer controls
 * - Game-specific UI elements
 * - Mode-specific animations or effects
 */

import React from 'react';
import { Level, GameState } from '@/game/types';
import { GameModeConfig } from '@/game/modes/types';

export interface ModeGameScreenProps {
  readonly currentMode: GameModeConfig;
  readonly currentLevel: Level;
  readonly gameState: Partial<GameState>;
  // Render the default game content
  readonly children: React.ReactNode;
}

/**
 * ModeGameScreen wrapper
 * In the future, this can route to mode-specific screens:
 * - src/components/modes/CandyGameScreen.tsx
 * - src/components/modes/GemBlastGameScreen.tsx
 * - src/components/modes/ClassicGameScreen.tsx
 * etc.
 */
export function ModeGameScreen({
  currentMode: _currentMode,
  currentLevel: _currentLevel,
  gameState: _gameState,
  children,
}: ModeGameScreenProps) {
  // TODO: Route based on currentMode.id
  // const ScreenComponent = MODE_SCREENS[currentMode.id] ?? DefaultGameScreen;
  // return <ScreenComponent {...props} />;

  // For now, return the default game rendering
  return <>{children}</>;
}
