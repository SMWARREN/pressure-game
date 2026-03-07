// PRESSURE - About Screen
// Displays the logo puzzle level as an interactive showcase

import { useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { useTheme } from '@/hooks/useTheme';
import { RGBA_COLORS } from '@/utils/constants';
import { PRESSURE_LOGO_LEVEL } from '@/game/modes/classic/levels';
import GameBoard from './GameBoard';

export default function AboutScreen({
  onBack,
}: {
  readonly onBack: () => void;
}) {
  const { colors } = useTheme();
  const loadLevel = useGameStore((s) => s.loadLevel);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const currentLevel = useGameStore((s) => s.currentLevel);

  // Load and pause the logo level on mount
  useEffect(() => {
    loadLevel(PRESSURE_LOGO_LEVEL);
    // Small delay to ensure level is loaded before pausing
    const timer = setTimeout(() => {
      pauseGame();
    }, 100);
    return () => clearTimeout(timer);
  }, [loadLevel, pauseGame]);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* Full game board with logo level paused for display */}
      <GameBoard />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: 16,
          zIndex: 100,
          width: 44,
          height: 44,
          borderRadius: 12,
          border: `1px solid ${colors.border.primary}`,
          background: RGBA_COLORS.TRANSPARENT_WHITE_02,
          color: colors.text.tertiary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = RGBA_COLORS.TRANSPARENT_WHITE_02;
        }}
      >
        ‹
      </button>

      {/* Info panel */}
      {currentLevel?.id === 999 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${colors.game.footer} 100%)`,
            padding: '32px 20px max(20px, env(safe-area-inset-bottom))',
            textAlign: 'center',
            backdropFilter: 'blur(12px)',
            zIndex: 99,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: colors.text.tertiary,
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            The Pressure Logo Puzzle • Zen Mode (No Time Pressure)
          </p>
        </div>
      )}
    </div>
  );
}
