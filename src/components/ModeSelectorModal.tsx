// PRESSURE - Mode Selector Modal
// A full-screen modal overlay that lets players switch game modes.
// Shows mode cards, feature badges, and compression toggle.
// When a new mode is selected that hasn't been seen before,
// the store automatically routes to that mode's tutorial.

import { useGameStore } from '../game/store';
import { GAME_MODES } from '../game/modes';
import type { GameModeConfig } from '../game/types';

interface ModeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.05em',
        color,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: '2px 5px',
        background: `${color}10`,
      }}
    >
      {label}
    </span>
  );
}

function Toggle({
  value,
  onChange,
  color,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: value ? color : '#1a1a2e',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        boxShadow: value ? `0 0 8px ${color}60` : 'none',
        minHeight: 'unset',
        minWidth: 'unset',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
}

export default function ModeSelectorModal({ visible, onClose }: ModeSelectorModalProps) {
  const currentModeId = useGameStore((s) => s.currentModeId);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const compressionOverride = useGameStore((s) => s.compressionOverride);
  const setCompressionOverride = useGameStore((s) => s.setCompressionOverride);
  const seenTutorials = useGameStore((s) => s.seenTutorials);

  const activeMode = GAME_MODES.find((m) => m.id === currentModeId) ?? GAME_MODES[0];

  if (!visible) return null;

  const handleModeSelect = (modeId: string) => {
    setGameMode(modeId); // store handles routing to tutorial if new mode
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          background: 'linear-gradient(180deg, #0d0d1e 0%, #06060f 100%)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid #12122a',
          borderBottom: 'none',
          padding: 'clamp(16px, 4vw, 24px)',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
          // Animate up
          animation: 'slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: '#2a2a3e',
            margin: '0 auto 20px',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em' }}>Game Mode</div>
            <div style={{ fontSize: 11, color: '#3a3a55', marginTop: 2 }}>
              Choose how you want to play
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#12122a',
              color: '#3a3a55',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              minHeight: 'unset',
              minWidth: 'unset',
            }}
          >
            ✕
          </button>
        </div>

        {/* Mode cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {GAME_MODES.map((mode: GameModeConfig) => {
            const active = mode.id === currentModeId;
            const isNew = !seenTutorials.includes(mode.id) && mode.id !== currentModeId;

            return (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `1.5px solid ${active ? mode.color + '70' : '#12122a'}`,
                  background: active ? `${mode.color}14` : '#07070e',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%',
                  position: 'relative',
                  boxShadow: active ? `0 0 20px ${mode.color}12` : 'none',
                }}
              >
                {/* "NEW" badge for unseen modes */}
                {isNew && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: 12,
                      fontSize: 8,
                      fontWeight: 900,
                      letterSpacing: '0.1em',
                      color: '#fff',
                      background: '#6366f1',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    NEW
                  </div>
                )}

                <span
                  style={{
                    fontSize: 26,
                    filter: active
                      ? `drop-shadow(0 0 10px ${mode.color}90)`
                      : 'grayscale(0.6) opacity(0.5)',
                    transition: 'filter 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {mode.icon}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: active ? mode.color : '#2a2a3e',
                      transition: 'color 0.2s',
                      marginBottom: 3,
                    }}
                  >
                    {mode.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#25253a', lineHeight: 1.4 }}>
                    {mode.description}
                  </div>
                </div>

                {/* Feature badges */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    alignItems: 'flex-end',
                    flexShrink: 0,
                  }}
                >
                  {mode.supportsUndo === false && <Badge label="No Undo" color="#ef4444" />}
                  {mode.wallCompression === 'never' && <Badge label="No Walls" color="#34d399" />}
                  {mode.wallCompression === 'always' && <Badge label="Walls On" color="#f97316" />}
                  {mode.useMoveLimit === false && <Badge label="Unlimited" color="#60a5fa" />}
                  {active && <Badge label="Active" color={mode.color} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compression toggle — only for 'optional' modes */}
        {activeMode.wallCompression === 'optional' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #12122a',
              background: '#07070e',
              marginBottom: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: '#3a3a55', fontWeight: 700 }}>
                Wall Compression
              </div>
              <div style={{ fontSize: 10, color: '#1e1e35', marginTop: 2 }}>
                Toggle walls on/off for this mode
              </div>
            </div>
            <Toggle
              value={compressionOverride !== false}
              onChange={(v) => setCompressionOverride(v ? null : false)}
              color={activeMode.color}
            />
          </div>
        )}

        {/* Tutorial replay hint */}
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <div style={{ fontSize: 10, color: '#1e1e35', lineHeight: 1.5 }}>
            Switching to a new mode shows its tutorial first
          </div>
        </div>
      </div>
    </>
  );
}
