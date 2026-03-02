// PRESSURE HUB SCREEN
// Mode selector for Classic | Blitz | Zen with live game preview

import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useGameStore } from '../game/store';
import { ensureHubStyles } from './hubs/HubStyles';
import { PressureModeInfo } from './hubs/HubTypes';
import { PressureGamePreview } from './pressure/PressureGamePreview';
import { getModeById } from '../game/modes';

const CLASSIC_INFO: PressureModeInfo = {
  description: 'The original pipe puzzle — connect all nodes before time runs out!',
  mechanics: [
    { icon: '🔧', label: 'Tap to rotate', detail: 'Connect pipes to form paths' },
    { icon: '🎯', label: 'Goal nodes', detail: 'All nodes must be connected' },
    { icon: '🧱', label: 'Wall compression', detail: 'Walls advance — stay ahead!' },
    { icon: '⏱️', label: 'Time pressure', detail: 'Beat the clock or get crushed' },
  ],
  worlds: '8 worlds · 50+ levels',
};

const BLITZ_INFO: PressureModeInfo = {
  description: 'Lightning-fast rounds — solve as many as you can before time expires!',
  mechanics: [
    { icon: '⚡', label: 'Speed rounds', detail: '30-second puzzles' },
    { icon: '🏃', label: 'Quick thinking', detail: 'No time to hesitate' },
    { icon: '🔥', label: 'Streak bonus', detail: 'Chain wins for multipliers' },
    { icon: '💀', label: 'One chance', detail: 'Wrong move = next puzzle' },
  ],
  worlds: 'Endless · Beat your high score',
};

const ZEN_INFO: PressureModeInfo = {
  description: 'Relaxed puzzle solving — no timers, no pressure, just pipes.',
  mechanics: [
    { icon: '🧘', label: 'No time limit', detail: 'Take your time' },
    { icon: '🚫', label: 'No walls', detail: 'Pure puzzle solving' },
    { icon: '↩️', label: 'Unlimited undo', detail: 'Experiment freely' },
    { icon: '💭', label: 'Mindful play', detail: 'Focus on the flow' },
  ],
  worlds: '8 worlds · 50+ levels',
};

// ── Pressure mode definitions ─────────────────────────────────────────────────

type PressureModeId = 'classic' | 'blitz' | 'zen';

interface PressureModeDef {
  readonly id: PressureModeId;
  readonly title: string;
  readonly tagline: string;
  readonly info: PressureModeInfo;
  readonly accentColor: string;
}

const PRESSURE_MODES: PressureModeDef[] = [
  {
    id: 'classic',
    title: '🎯 Classic',
    tagline: 'Connect pipes\nBeat the clock!',
    info: CLASSIC_INFO,
    accentColor: '#6366f1',
  },
  {
    id: 'blitz',
    title: '⚡ Blitz',
    tagline: 'Speed rounds\nChain wins!',
    info: BLITZ_INFO,
    accentColor: '#f59e0b',
  },
  {
    id: 'zen',
    title: '🧘 Zen',
    tagline: 'No pressure\nJust pipes.',
    info: ZEN_INFO,
    accentColor: '#10b981',
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function PressureHubScreen() {
  ensureHubStyles();
  const { colors } = useTheme();
  const setGameMode = useGameStore((s) => s.setGameMode);
  const closePressureHub = useGameStore((s) => s.closePressureHub);
  const featuredLevel = useGameStore((s) => s.featuredLevel);
  const setFeaturedLevel = useGameStore((s) => s.setFeaturedLevel);

  // Load a featured level on mount
  useEffect(() => {
    const mode = getModeById('classic');
    if (!mode) return;

    const levels = mode.getLevels?.();
    if (levels && levels.length > 20) {
      setFeaturedLevel(levels[20]); // Level 21 - harder level with bigger grid
    }
  }, [setFeaturedLevel]);

  function selectMode(id: string) {
    setGameMode(id);
    closePressureHub();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: colors.game.header,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px 12px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={closePressureHub}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `1.5px solid ${colors.border.secondary}`,
            background: colors.bg.tertiary,
            color: colors.status.info,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            minHeight: 'unset',
            minWidth: 'unset',
            flexShrink: 0,
          }}
          aria-label="Back"
        >
          ←
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '0.06em',
              background: 'linear-gradient(90deg, #6366f1, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PRESSURE
          </div>
          <div style={{ fontSize: 10, color: colors.text.tertiary, marginTop: 2 }}>
            Classic · Blitz · Zen
          </div>
        </div>

        <div style={{ width: 36, flexShrink: 0 }} />
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: colors.border.primary, flexShrink: 0 }} />

      {/* ── Game Preview (Featured Level) ── */}
      <div
        style={{
          padding: '12px 16px',
          background: colors.game.overlay,
          border: `1px solid ${colors.border.primary}`,
          borderRadius: 12,
          margin: '12px',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          minHeight: 200,
        }}
      >
        <PressureGamePreview level={featuredLevel} />
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: colors.border.primary, flexShrink: 0 }} />

      {/* ── Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ── Section Label ── */}
        <div
          style={{
            padding: '12px 16px 8px',
            fontSize: 10,
            fontWeight: 800,
            color: colors.text.tertiary,
            letterSpacing: '0.1em',
          }}
        >
          GAME MODES
        </div>

        {/* ── 3 Compact Buttons ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            padding: '0 16px 20px',
          }}
        >
          {PRESSURE_MODES.map((def) => (
            <button
              key={def.id}
              onClick={() => selectMode(def.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                border: `1.5px solid ${def.accentColor}40`,
                background: `${def.accentColor}10`,
                cursor: 'pointer',
                minWidth: 90,
                transition: 'all 0.15s',
                minHeight: 'unset',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${def.accentColor}20`;
                e.currentTarget.style.borderColor = `${def.accentColor}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${def.accentColor}10`;
                e.currentTarget.style.borderColor = `${def.accentColor}40`;
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{def.title.split(' ')[0]}</div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: def.accentColor,
                  letterSpacing: '0.02em',
                }}
              >
                {def.title.split(' ')[1]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
