// PRESSURE - About Screen
// Displays the logo puzzle level as an interactive showcase

import { useState } from 'react';
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
  const [isPlayingLogo, setIsPlayingLogo] = useState(false);

  const handlePlayLogo = () => {
    loadLevel(PRESSURE_LOGO_LEVEL);
    setIsPlayingLogo(true);
  };

  const handleBackFromGame = () => {
    setIsPlayingLogo(false);
  };

  if (isPlayingLogo) {
    // Show the full game board but with a back button
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <GameBoard />
        <button
          onClick={handleBackFromGame}
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
            e.currentTarget.style.background = RGBA_COLORS.TRANSPARENT_WHITE_05;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = RGBA_COLORS.TRANSPARENT_WHITE_02;
          }}
        >
          ‹
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: colors.game.header,
        color: colors.text.primary,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'auto',
      }}
    >
      {/* Header with back button */}
      <header
        style={{
          flexShrink: 0,
          padding: 'max(16px, env(safe-area-inset-top)) 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: `1px solid ${colors.border.primary}`,
          background: colors.game.footer,
          backdropFilter: 'blur(12px)',
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
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = RGBA_COLORS.TRANSPARENT_WHITE_05;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = RGBA_COLORS.TRANSPARENT_WHITE_02;
          }}
        >
          ‹
        </button>
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
            }}
          >
            About
          </h2>
          <p
            style={{
              fontSize: 12,
              color: colors.text.tertiary,
              margin: '4px 0 0 0',
            }}
          >
            The Pressure logo puzzle
          </p>
        </div>
      </header>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '40px 20px',
          maxWidth: 600,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(2rem, 10vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.06em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 40%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 16px 0',
            }}
          >
            PRESSURE
          </h1>
          <p
            style={{
              fontSize: 14,
              color: colors.text.secondary,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            A challenging pipe puzzle game where you rotate tiles to connect goal nodes before the walls crush them.
          </p>
        </div>

        <button
          onClick={handlePlayLogo}
          style={{
            padding: '14px 28px',
            borderRadius: 14,
            border: `2px solid #6366f1`,
            background: '#6366f118',
            color: '#a5b4fc',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.05em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6366f130';
            e.currentTarget.style.boxShadow = '0 0 20px #6366f140';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6366f118';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Play the Logo Puzzle
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            width: '100%',
            marginTop: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${colors.border.primary}`,
              background: colors.bg.secondary,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Classic Mode
            </div>
            <div style={{ fontSize: 11, color: colors.text.tertiary }}>
              Race against the clock as walls close in
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${colors.border.primary}`,
              background: colors.bg.secondary,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>🧘</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Zen Mode
            </div>
            <div style={{ fontSize: 11, color: colors.text.tertiary }}>
              No pressure, no limits, pure puzzling
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${colors.border.primary}`,
              background: colors.bg.secondary,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Blitz Mode
            </div>
            <div style={{ fontSize: 11, color: colors.text.tertiary }}>
              Fast-paced chaos with no undo option
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
