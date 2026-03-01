/**
 * Test Harness — Load GameBoard with a specific level/mode for E2E testing
 * Usage: /?levelId=1&modeId=pressure
 *
 * This component:
 * 1. Reads levelId and modeId from URL query params
 * 2. Loads the level from the mode's level list
 * 3. Initializes GameBoard with that level
 * 4. Renders GameBoard for automated testing
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store';
import { getModeById } from '@/game/modes';
import { GameProviders } from '@/game/GameProviders';
import GameBoard from '../GameBoard';
import type { PressureEngine } from '@/game/engine';

interface TestHarnessProps {
  readonly pressureEngine?: PressureEngine;
}

function TestHarnessContent() {
  const initializedRef = useRef(false);

  const initializeGameState = (levelId: number, modeId: string) => {
    const { setGameMode, loadLevel, completeTutorial } = useGameStore.getState();
    completeTutorial();
    setGameMode(modeId);
    loadLevel(findLevel(levelId, modeId));
  };

  const findLevel = (levelId: number, modeId: string) => {
    const mode = getModeById(modeId);
    if (!mode) {
      console.warn(`[TestHarness] Mode '${modeId}' not found`);
      throw new Error(`Mode ${modeId} not found`);
    }
    const level = mode.getLevels().find((l) => l.id === levelId);
    if (!level) {
      console.warn(`[TestHarness] Level ${levelId} not found in mode '${modeId}'`);
      throw new Error(`Level ${levelId} not found`);
    }
    return level;
  };

  const startGameWithDelay = (levelId: number, modeId: string) => {
    setTimeout(() => {
      initializeGameState(levelId, modeId);
      setTimeout(() => {
        useGameStore.getState().startGame();
      }, 100);
    }, 100);
  };

  useEffect(() => {
    // Only run initialization once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const levelId = parseInt(params.get('levelId') ?? '0', 10);
    const modeId = params.get('modeId') ?? 'pressure';

    if (!levelId || !modeId) {
      console.warn('[TestHarness] Missing levelId or modeId query params');
      return;
    }

    // Engine is created at module load, but needs React context to work
    // So wait a tick for GameEngineProvider to initialize it
    setTimeout(() => {
      startGameWithDelay(levelId, modeId);
    }, 0);
  }, []);

  // Render the main GameBoard — it will display the loaded level
  return <GameBoard />;
}

export default function TestHarness({ pressureEngine }: TestHarnessProps) {
  return (
    <GameProviders pressureEngine={pressureEngine}>
      <TestHarnessContent />
    </GameProviders>
  );
}
