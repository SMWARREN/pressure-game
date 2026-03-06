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

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/game/store';
import { getModeById } from '@/game/modes';
import { GameProviders } from '@/game/GameProviders';
import GameBoard from '../GameBoard';

function TestHarnessContent() {
  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run initialization once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const levelId = parseInt(params.get('levelId') ?? '0', 10);
    const modeId = params.get('modeId') ?? 'pressure';

    if (!levelId || !modeId) {
      console.warn('[TestHarness] Missing levelId or modeId query params');
      setError('Missing levelId or modeId');
      return;
    }

    // Use setTimeout to defer initialization until after React has finished rendering
    // This ensures the loading screen is shown while levels are being generated
    const initTimeout = setTimeout(() => {
      try {
        const { setGameMode, loadLevel, completeTutorial } = useGameStore.getState();
        
        // Complete tutorial to prevent tutorial overlay from blocking
        completeTutorial();
        
        // Set the game mode first
        setGameMode(modeId);
        
        // Find and load the level (this triggers lazy level generation on first call)
        const mode = getModeById(modeId);
        if (!mode) {
          throw new Error(`Mode ${modeId} not found`);
        }
        const level = mode.getLevels().find((l) => l.id === levelId);
        if (!level) {
          throw new Error(`Level ${levelId} not found`);
        }
        
        // Load the level into 'idle' state — do NOT call startGame() here.
        // The test controls when the game starts via the __GAME_STORE__ handle.
        loadLevel(level);
        
        // Wait for state to settle before rendering
        requestAnimationFrame(() => {
          setReady(true);
        });
      } catch (err) {
        console.error('[TestHarness] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    }, 0);

    return () => clearTimeout(initTimeout);
  }, []);

  // Show error if initialization failed
  if (error) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0e27',
          color: '#ef4444',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 24 }}>⚠️</div>
        <div>{error}</div>
      </div>
    );
  }

  // Don't render GameBoard until ready to prevent overlay issues
  // This ensures the level is fully loaded before the board renders
  if (!ready) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0e27',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div>Loading level...</div>
      </div>
    );
  }

  // Render the main GameBoard — it will display the loaded level
  return <GameBoard />;
}

export default function TestHarness() {
  return (
    <GameProviders>
      <TestHarnessContent />
    </GameProviders>
  );
}
