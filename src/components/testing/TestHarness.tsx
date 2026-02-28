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
import GameBoard from '../GameBoard';

export default function TestHarness() {
  const initializedRef = useRef(false);

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

    console.log(`[TestHarness] Initializing ${modeId} level ${levelId}`);

    // Get the mode
    const mode = getModeById(modeId);
    if (!mode) {
      console.warn(`[TestHarness] Mode '${modeId}' not found`);
      return;
    }

    // Find the level
    const levels = mode.getLevels();
    const level = levels.find((l) => l.id === levelId);
    if (!level) {
      console.warn(`[TestHarness] Level ${levelId} not found in mode '${modeId}'`);
      return;
    }

    // Get the store actions
    const { setGameMode, loadLevel, startGame, completeTutorial } = useGameStore.getState();

    // Sequence: complete tutorial → set mode → load level → start game
    setTimeout(() => {
      completeTutorial();
      setGameMode(modeId);

      setTimeout(() => {
        loadLevel(level);

        setTimeout(() => {
          startGame();
          console.log(`[TestHarness] ✅ Game initialized and started`);
        }, 100);
      }, 100);
    }, 100);
  }, []);

  // Render the main GameBoard — it will display the loaded level
  return <GameBoard />;
}
