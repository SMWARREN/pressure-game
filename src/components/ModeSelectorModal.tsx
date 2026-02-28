// PRESSURE - Mode Selector Modal
// A full-screen modal overlay that lets players switch game modes.
// Modes are organized into named groups (Pressure Series / Arcade / Strategy).
// Shows mode cards, feature badges, and compression toggle.
// When a new mode is selected that hasn't been seen before,
// the store automatically routes to that mode's tutorial.

import { useGameStore } from '../game/store';
import { GAME_MODES, MODE_GROUPS } from '../game/modes';
import type { GameModeConfig } from '../game/types';
import { Toggle } from './modals/Toggle';
import { ModeCard } from './modals/ModeCard';
import { GroupHeader } from './modals/GroupHeader';

interface ModeSelectorModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const PRESSURE_GROUP_LABEL = 'Pressure Series';
const ARCADE_GROUP_LABEL = 'Arcade';
const PRESSURE_MODE_IDS = new Set(['classic', 'blitz', 'zen']);
const ARCADE_MODE_IDS = new Set(['candy', 'shoppingSpree', 'gemBlast']);

export default function ModeSelectorModal({ visible, onClose }: ModeSelectorModalProps) {
  const currentModeId = useGameStore((s) => s.currentModeId);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const compressionOverride = useGameStore((s) => s.compressionOverride);
  const setCompressionOverride = useGameStore((s) => s.setCompressionOverride);
  const seenTutorials = useGameStore((s) => s.seenTutorials);
  const openArcadeHub = useGameStore((s) => s.openArcadeHub);
  const openPressureHub = useGameStore((s) => s.openPressureHub);

  const activeMode = GAME_MODES.find((m) => m.id === currentModeId) ?? GAME_MODES[0];

  if (!visible) return null;

  const handleModeSelect = (modeId: string) => {
    setGameMode(modeId); // store handles routing to tutorial if new mode
    onClose();
  };

  // Build a lookup for quick access
  const modeById = new Map(GAME_MODES.map((m) => [m.id, m]));

  // Collect IDs that are explicitly placed in a group
  const groupedIds = new Set(MODE_GROUPS.flatMap((g) => g.modeIds));

  // Any modes not in a group go into an implicit "Other" bucket
  const ungroupedModes = GAME_MODES.filter((m) => !groupedIds.has(m.id));

  // Derive a representative accent color for each group from its first mode
  function groupAccent(modeIds: string[]): string {
    const first = modeById.get(modeIds[0]);
    return first?.color ?? '#3a3a55';
  }

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
            marginBottom: 20,
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

        {/* ── Grouped mode sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 16 }}>
          {MODE_GROUPS.map((group) => {
            const modesInGroup = group.modeIds
              .map((id) => modeById.get(id))
              .filter((m): m is GameModeConfig => m !== undefined);

            if (modesInGroup.length === 0) return null;

            // Pressure Series group: single hub-entry card
            if (group.label === PRESSURE_GROUP_LABEL) {
              const pressureActive = PRESSURE_MODE_IDS.has(currentModeId);
              const hasNew = modesInGroup.some(
                (m) => !seenTutorials.includes(m.id) && m.id !== currentModeId
              );
              return (
                <div key={group.label}>
                  <GroupHeader
                    label={group.label}
                    tagline={group.tagline}
                    accentColor={groupAccent(group.modeIds)}
                  />
                  <button
                    onClick={() => {
                      openPressureHub();
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: `1.5px solid ${pressureActive ? '#a78bfa30' : '#12122a'}`,
                      background: pressureActive ? '#a78bfa08' : '#07070e',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {hasNew && (
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
                    <span style={{ fontSize: 26, flexShrink: 0 }}>⚡</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: pressureActive ? '#a78bfa' : '#2a2a3e',
                          marginBottom: 3,
                        }}
                      >
                        Pressure Hub
                      </div>
                      <div style={{ fontSize: 11, color: '#25253a', lineHeight: 1.4 }}>
                        Classic · Blitz · Zen
                      </div>
                    </div>
                    <span style={{ fontSize: 16, color: '#2a2a3e' }}>›</span>
                  </button>
                </div>
              );
            }

            // Arcade group: single hub-entry card
            if (group.label === ARCADE_GROUP_LABEL) {
              const arcadeActive = ARCADE_MODE_IDS.has(currentModeId);
              const hasNew = modesInGroup.some(
                (m) => !seenTutorials.includes(m.id) && m.id !== currentModeId
              );
              return (
                <div key={group.label}>
                  <GroupHeader
                    label={group.label}
                    tagline={group.tagline}
                    accentColor={groupAccent(group.modeIds)}
                  />
                  <button
                    onClick={() => {
                      openArcadeHub();
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: `1.5px solid ${arcadeActive ? '#f472b630' : '#12122a'}`,
                      background: arcadeActive ? '#f472b608' : '#07070e',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {hasNew && (
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
                    <span style={{ fontSize: 26, flexShrink: 0 }}>🕹️</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: arcadeActive ? '#f472b6' : '#2a2a3e',
                          marginBottom: 3,
                        }}
                      >
                        Arcade Hub
                      </div>
                      <div style={{ fontSize: 11, color: '#25253a', lineHeight: 1.4 }}>
                        Candy · Shopping Spree · Gem Blast
                      </div>
                    </div>
                    <span style={{ fontSize: 16, color: '#2a2a3e' }}>›</span>
                  </button>
                </div>
              );
            }

            return (
              <div key={group.label}>
                <GroupHeader
                  label={group.label}
                  tagline={group.tagline}
                  accentColor={groupAccent(group.modeIds)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {modesInGroup.map((mode) => (
                    <ModeCard
                      key={mode.id}
                      mode={mode}
                      active={mode.id === currentModeId}
                      isNew={!seenTutorials.includes(mode.id) && mode.id !== currentModeId}
                      onSelect={() => handleModeSelect(mode.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ungrouped modes (future-proofing) */}
          {ungroupedModes.length > 0 && (
            <div>
              <GroupHeader label="Other" accentColor="#3a3a55" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ungroupedModes.map((mode) => (
                  <ModeCard
                    key={mode.id}
                    mode={mode}
                    active={mode.id === currentModeId}
                    isNew={!seenTutorials.includes(mode.id) && mode.id !== currentModeId}
                    onSelect={() => handleModeSelect(mode.id)}
                  />
                ))}
              </div>
            </div>
          )}
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
