export interface SettingsPanelProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly animationsEnabled: boolean;
  readonly onToggleAnimations: () => void;
  readonly onShowStats: () => void;
  readonly onShowAchievements: () => void;
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
  onHowToPlay,
  onRewatchWalkthrough,
  hasWalkthrough,
}: SettingsPanelProps) {
  if (!visible) return null;
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 50,
        }}
      />
      {/* sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          background: 'linear-gradient(180deg, #0d0d22 0%, #06060f 100%)',
          borderTop: '1px solid #1e1e35',
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
            background: '#1e1e35',
            alignSelf: 'center',
            marginBottom: 8,
          }}
        />

        <div
          style={{
            fontSize: 10,
            color: '#25253a',
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
            border: `1px solid ${animationsEnabled ? '#6366f140' : '#12122a'}`,
            background: animationsEnabled ? '#6366f10a' : '#07070e',
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
                color: animationsEnabled ? '#a5b4fc' : '#3a3a55',
              }}
            >
              Visual Effects
            </div>
            <div style={{ fontSize: 11, color: '#25253a', marginTop: 2 }}>
              {animationsEnabled ? 'Particles & animations on' : 'Particles & animations off'}
            </div>
          </div>
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: animationsEnabled ? '#6366f1' : '#12122a',
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
                background: '#fff',
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
            border: '1px solid #12122a',
            background: '#07070e',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>Statistics</div>
            <div style={{ fontSize: 11, color: '#25253a', marginTop: 2 }}>
              View your game history
            </div>
          </div>
          <span style={{ fontSize: 14, color: '#3a3a55' }}>›</span>
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
            border: '1px solid #12122a',
            background: '#07070e',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Achievements</div>
            <div style={{ fontSize: 11, color: '#25253a', marginTop: 2 }}>
              View your accomplishments
            </div>
          </div>
          <span style={{ fontSize: 14, color: '#3a3a55' }}>›</span>
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
            border: '1px solid #12122a',
            background: '#07070e',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 20 }}>❓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>How to Play</div>
            <div style={{ fontSize: 11, color: '#25253a', marginTop: 2 }}>Replay the tutorial</div>
          </div>
          <span style={{ fontSize: 14, color: '#3a3a55' }}>›</span>
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
              border: '1px solid #12122a',
              background: '#07070e',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20 }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>
                Rewatch Walkthrough
              </div>
              <div style={{ fontSize: 11, color: '#25253a', marginTop: 2 }}>
                Replay the level guide
              </div>
            </div>
            <span style={{ fontSize: 14, color: '#3a3a55' }}>›</span>
          </button>
        )}
      </div>
    </>
  );
}
