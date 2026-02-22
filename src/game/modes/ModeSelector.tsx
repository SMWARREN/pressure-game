'use client';

import { useGameStore } from '@/game/store';
import { GAME_MODES, GameModeConfig } from '@/game/modes';

/**
 * ModeSelector - Lets players choose their game mode before playing.
 * Drop this into any menu screen.
 */
export default function ModeSelector() {
  const currentModeId = useGameStore((s) => s.currentModeId);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const compressionOverride = useGameStore((s) => s.compressionOverride);
  const setCompressionOverride = useGameStore((s) => s.setCompressionOverride);

  const activeMode = GAME_MODES.find((m) => m.id === currentModeId) ?? GAME_MODES[0];

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#3a3a55',
          textAlign: 'center',
          marginBottom: 2,
        }}
      >
        GAME MODE
      </div>

      {/* Mode cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {GAME_MODES.map((mode: GameModeConfig) => {
          const active = mode.id === currentModeId;
          return (
            <button
              key={mode.id}
              onClick={() => setGameMode(mode.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${active ? mode.color + '60' : '#12122a'}`,
                background: active ? `${mode.color}12` : '#07070e',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  filter: active
                    ? `drop-shadow(0 0 8px ${mode.color}80)`
                    : 'grayscale(1) opacity(0.3)',
                  transition: 'filter 0.2s',
                }}
              >
                {mode.icon}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: active ? mode.color : '#2a2a3e',
                    transition: 'color 0.2s',
                  }}
                >
                  {mode.name}
                </div>
                <div style={{ fontSize: 11, color: '#25253a', marginTop: 2, lineHeight: 1.3 }}>
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
                }}
              >
                {mode.supportsUndo === false && <Badge label="No Undo" color="#ef4444" />}
                {mode.wallCompression === 'never' && <Badge label="No Walls" color="#34d399" />}
                {mode.wallCompression === 'always' && <Badge label="Walls On" color="#f97316" />}
                {mode.useMoveLimit === false && <Badge label="Unlimited" color="#60a5fa" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Compression toggle — only shown when mode is 'optional' */}
      {activeMode.wallCompression === 'optional' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #12122a',
            background: '#07070e',
          }}
        >
          <span style={{ fontSize: 12, color: '#3a3a55', fontWeight: 700 }}>Wall Compression</span>
          <Toggle
            value={compressionOverride !== false}
            onChange={(v) => setCompressionOverride(v ? null : false)}
            color={activeMode.color}
          />
        </div>
      )}
    </div>
  );
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
