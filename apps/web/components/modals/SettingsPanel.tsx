import { useTheme } from '@/hooks/useTheme';
import { RGBA_COLORS } from '@/utils/constants';

export interface SettingsPanelProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly animationsEnabled: boolean;
  readonly onToggleAnimations: () => void;
  readonly onShowStats: () => void;
  readonly onShowAchievements: () => void;
  readonly onShowLeaderboard: () => void;
  readonly onShowProfile: () => void;
  readonly onShowAbout: () => void;
  readonly onHowToPlay: () => void;
  readonly onRewatchWalkthrough: () => void;
  readonly hasWalkthrough: boolean;
}

export function SettingsPanel({
  visible,
  onClose,
  animationsEnabled,
  onToggleAnimations,
  onShowStats,
  onShowAchievements,
  onShowLeaderboard,
  onShowProfile,
  onShowAbout,
  onHowToPlay,
  onRewatchWalkthrough,
  hasWalkthrough,
}: SettingsPanelProps) {
  const { colors } = useTheme();

  if (!visible) return null;
  return (
    <>
      {/* backdrop */}
      <button
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: RGBA_COLORS.TRANSPARENT_BLACK_30,
          zIndex: 50,
          border: 'none',
          padding: 0,
          cursor: 'auto',
        }}
        aria-label="Close settings"
      />
      {/* sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          background: `linear-gradient(180deg, ${colors.bg.secondary} 0%, ${colors.bg.primary} 100%)`,
          borderTop: `1px solid ${colors.border.secondary}`,
          borderRadius: '20px 20px 0 0',
          padding:
            'clamp(16px,4vw,24px) clamp(16px,5vw,28px) max(24px,env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: colors.border.secondary,
            alignSelf: 'center',
            marginBottom: 8,
          }}
        />

        <div
          style={{
            fontSize: 10,
            color: colors.text.tertiary,
            letterSpacing: '0.2em',
            marginBottom: 4,
          }}
        >
          SETTINGS
        </div>

        {/* FX toggle row */}
        <button
          onClick={() => {
            onToggleAnimations();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${animationsEnabled ? '#6366f140' : colors.border.primary}`,
            background: animationsEnabled ? '#6366f10a' : colors.bg.tertiary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>{animationsEnabled ? '✨' : '◻'}</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: animationsEnabled ? '#a5b4fc' : colors.text.tertiary,
              }}
            >
              Visual Effects
            </div>
            <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
              {animationsEnabled ? 'Particles & animations on' : 'Particles & animations off'}
            </div>
          </div>
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: animationsEnabled ? '#6366f1' : colors.border.primary,
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: animationsEnabled ? 19 : 3,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: colors.text.primary,
                transition: 'left 0.2s',
              }}
            />
          </div>
        </button>

        {/* Stats row */}
        <button
          onClick={() => {
            onShowStats();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${colors.border.primary}`,
            background: colors.bg.tertiary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>Statistics</div>
            <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
              View your game history
            </div>
          </div>
          <span style={{ fontSize: 14, color: colors.text.tertiary }}>›</span>
        </button>

        {/* Achievements row */}
        <button
          onClick={() => {
            onShowAchievements();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${colors.border.primary}`,
            background: colors.bg.tertiary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Achievements</div>
            <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
              View your accomplishments
            </div>
          </div>
          <span style={{ fontSize: 14, color: colors.text.tertiary }}>›</span>
        </button>

        {/* Leaderboards row */}
        <button
          onClick={() => {
            onShowLeaderboard();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${colors.border.primary}`,
            background: colors.bg.tertiary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>📈</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>Leaderboards</div>
            <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
              View global rankings
            </div>
          </div>
          <span style={{ fontSize: 14, color: colors.text.tertiary }}>›</span>
        </button>

        {/* Profile row */}
        <button
          onClick={() => {
            onShowProfile();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${colors.border.primary}`,
            background: colors.bg.tertiary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>👤</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>My Profile</div>
            <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
              View your stats & achievements
            </div>
          </div>
          <span style={{ fontSize: 14, color: colors.text.tertiary }}>›</span>
        </button>

        {/* About row */}
        <button
          onClick={() => {
            onShowAbout();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${colors.border.primary}`,
            background: colors.bg.tertiary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ec4899' }}>About</div>
            <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
              The Pressure logo puzzle
            </div>
          </div>
          <span style={{ fontSize: 14, color: colors.text.tertiary }}>›</span>
        </button>

        {/* How to play row */}
        <button
          onClick={() => {
            onHowToPlay();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${colors.border.primary}`,
            background: colors.bg.tertiary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>❓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>How to Play</div>
            <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
              Replay the tutorial
            </div>
          </div>
          <span style={{ fontSize: 14, color: colors.text.tertiary }}>›</span>
        </button>

        {/* Rewatch Walkthrough row */}
        {hasWalkthrough && (
          <button
            onClick={() => {
              onRewatchWalkthrough();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 14,
              border: `1px solid ${colors.border.primary}`,
              background: colors.bg.tertiary,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20 }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>
                Rewatch Walkthrough
              </div>
              <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
                Replay the level guide
              </div>
            </div>
            <span style={{ fontSize: 14, color: colors.text.tertiary }}>›</span>
          </button>
        )}
      </div>
    </>
  );
}
