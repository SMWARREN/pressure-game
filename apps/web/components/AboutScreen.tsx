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
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header - styled like menu header */}
      <header
        style={{
          width: '100%',
          flexShrink: 0,
          zIndex: 101,
          position: 'relative',
          borderBottom: `1px solid ${colors.border.primary}`,
          background: colors.game.footer,
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'max(16px, env(safe-area-inset-top)) 20px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <button
            onClick={onBack}
            style={{
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
              flexShrink: 0,
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
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                margin: 0,
                background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 40%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              About
            </h1>
            <p
              style={{
                fontSize: 10,
                color: colors.text.tertiary,
                letterSpacing: '0.05em',
                margin: '2px 0 0 0',
              }}
            >
              The Pressure Logo Puzzle
            </p>
          </div>
        </div>
      </header>

      {/* Game board fills remaining space */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GameBoard />
      </div>

      {/* Info panel at bottom */}
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
          Zen Mode • No Time Pressure • Solve the P
        </p>
      </div>
    </div>
  );
}
