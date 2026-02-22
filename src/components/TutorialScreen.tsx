// PRESSURE - Tutorial Screen (per-mode)
// Reads tutorialSteps from the active GameModeConfig so each mode
// shows its own tailored tutorial when first played.

import { useState } from 'react';
import { useGameStore } from '../game/store';
import { getModeById } from '../game/modes';
import { TutorialStep, TutorialDemoType } from '../game/types';

/* ═══════════════════════════════════════════════════════════════════════════
   FALLBACK STEPS (used if a mode doesn't define tutorialSteps)
═══════════════════════════════════════════════════════════════════════════ */

const FALLBACK_STEPS: TutorialStep[] = [
  {
    icon: '🔌',
    iconColor: '#818cf8',
    title: 'Connect the Pipes',
    subtitle: 'YOUR GOAL',
    demo: 'fixed-path',
    body: 'Connect all goal nodes by rotating the pipe tiles. Fixed blue tiles show the path — your job is to fill in the gaps.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap to Rotate',
    subtitle: 'YOUR MAIN MOVE',
    demo: 'rotatable',
    body: 'Tap any rotatable tile to spin it 90° clockwise. Line up the openings so the pipe flows from node to node.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Goal Nodes',
    subtitle: 'CONNECT THEM ALL',
    demo: 'node',
    body: 'Green glowing tiles are goal nodes. All of them must be connected through a continuous path to win the level.',
  },
  {
    icon: '🎮',
    iconColor: '#6366f1',
    title: 'Controls',
    subtitle: 'UNDO & HINTS',
    demo: 'controls',
    body: 'Use Undo (⎌) to take back a move, or tap Hint (💡) to highlight the next suggested rotation.',
  },
  {
    icon: '✦',
    iconColor: '#fbbf24',
    title: 'Ready!',
    subtitle: "LET'S GO",
    demo: 'ready',
    body: 'Connect all nodes to win. Good luck!',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO VISUALS
═══════════════════════════════════════════════════════════════════════════ */

function DemoVisual({ type, modeColor }: { type: TutorialDemoType; modeColor: string }) {
  const tileBase: React.CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: 10,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const pipe = (dir: 'up' | 'down' | 'left' | 'right', color: string) => {
    const styles: Record<string, React.CSSProperties> = {
      up: {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 5,
        height: '53%',
        background: color,
        borderRadius: '3px 3px 0 0',
      },
      down: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 5,
        height: '53%',
        background: color,
        borderRadius: '0 0 3px 3px',
      },
      left: {
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        height: 5,
        width: '53%',
        background: color,
        borderRadius: '3px 0 0 3px',
      },
      right: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        height: 5,
        width: '53%',
        background: color,
        borderRadius: '0 3px 3px 0',
      },
    };
    return <div key={dir} style={styles[dir]} />;
  };

  const dot = (color: string) => (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 8,
        height: 8,
        background: color,
        borderRadius: '50%',
        zIndex: 1,
      }}
    />
  );

  const rotateDot = (
    <div
      style={{
        position: 'absolute',
        top: 3,
        right: 3,
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#fcd34d',
        zIndex: 2,
      }}
    />
  );

  if (type === 'fixed-path')
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #14532d, #0f3d21)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 14px rgba(34,197,94,0.3)',
          }}
        >
          {pipe('right', 'rgba(134,239,172,0.9)')}
          {pipe('down', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '40%',
              height: '40%',
              border: '2px solid rgba(134,239,172,0.5)',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #78350f, #5c2a0a)',
            border: '2px solid #f59e0b',
            boxShadow: '0 0 8px rgba(245,158,11,0.2)',
          }}
        >
          {pipe('left', 'rgba(252,211,77,0.9)')}
          {pipe('right', 'rgba(252,211,77,0.9)')}
          {dot('rgba(252,211,77,0.9)')}
          {rotateDot}
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #14532d, #0f3d21)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 14px rgba(34,197,94,0.3)',
          }}
        >
          {pipe('left', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '40%',
              height: '40%',
              border: '2px solid rgba(134,239,172,0.5)',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
        </div>
      </div>
    );

  if (type === 'rotatable')
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg, #78350f, #5c2a0a)',
              border: '2px solid #f59e0b',
              boxShadow: '0 0 8px rgba(245,158,11,0.2)',
            }}
          >
            {pipe('up', 'rgba(252,211,77,0.9)')}
            {pipe('right', 'rgba(252,211,77,0.9)')}
            {dot('rgba(252,211,77,0.9)')}
            {rotateDot}
          </div>
          <div style={{ fontSize: 9, color: '#78350f' }}>BEFORE</div>
        </div>
        <div style={{ fontSize: 20, color: '#f59e0b' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg, #78350f, #5c2a0a)',
              border: '2px solid #fde68a',
              boxShadow: '0 0 18px rgba(253,230,138,0.5)',
            }}
          >
            {pipe('right', 'rgba(253,230,138,0.95)')}
            {pipe('down', 'rgba(253,230,138,0.95)')}
            {dot('rgba(253,230,138,0.95)')}
            {rotateDot}
          </div>
          <div style={{ fontSize: 9, color: '#f59e0b' }}>AFTER TAP</div>
        </div>
      </div>
    );

  if (type === 'node')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #14532d, #0f3d21)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 18px rgba(34,197,94,0.4)',
          }}
        >
          {pipe('right', 'rgba(134,239,172,0.9)')}
          {pipe('down', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '42%',
              height: '42%',
              border: '2px solid rgba(134,239,172,0.5)',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: '#22c55e', letterSpacing: '0.1em' }}>GOAL NODE</div>
      </div>
    );

  if (type === 'connection')
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #1e3060, #172349)',
            border: '1.5px solid #2a4080',
          }}
        >
          {pipe('right', 'rgba(147,197,253,0.85)')}
          {dot('rgba(147,197,253,0.85)')}
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #1e3060, #172349)',
            border: '1.5px solid #2a4080',
          }}
        >
          {pipe('left', 'rgba(147,197,253,0.85)')}
          {pipe('right', 'rgba(147,197,253,0.85)')}
          {dot('rgba(147,197,253,0.85)')}
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #1e3060, #172349)',
            border: '1.5px solid #2a4080',
          }}
        >
          {pipe('left', 'rgba(147,197,253,0.85)')}
          {dot('rgba(147,197,253,0.85)')}
        </div>
      </div>
    );

  if (type === 'walls')
    return (
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid rgba(239,68,68,0.5)',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 18,
            background: 'linear-gradient(180deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderBottom: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '12px 12px 0 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 18,
            background: 'linear-gradient(0deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderTop: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '0 0 12px 12px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 18,
            background: 'linear-gradient(90deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderRight: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '12px 0 0 12px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 18,
            background: 'linear-gradient(270deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderLeft: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '0 12px 12px 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 28, filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' }}>💀</div>
        </div>
      </div>
    );

  if (type === 'controls')
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #3a3a5560',
              background: 'rgba(58,58,85,0.15)',
              color: '#818cf8',
              fontSize: 20,
            }}
          >
            ⎌
          </div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>UNDO</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #f59e0b50',
              background: 'rgba(245,158,11,0.08)',
              color: '#fbbf24',
              fontSize: 20,
            }}
          >
            💡
          </div>
          <div style={{ fontSize: 9, color: '#f59e0b' }}>HINT</div>
        </div>
      </div>
    );

  if (type === 'ready' || type === 'zen-ready')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 48, filter: `drop-shadow(0 0 20px ${modeColor}99)` }}>✦</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#22c55e', '#6366f1', '#f59e0b', '#ef4444'].map((c, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: c,
                boxShadow: `0 0 8px ${c}`,
              }}
            />
          ))}
        </div>
      </div>
    );

  if (type === 'blitz-ready')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.8))' }}>🔥</div>
        <div style={{ fontSize: 11, color: '#f97316', letterSpacing: '0.15em', fontWeight: 700 }}>
          SURVIVE
        </div>
      </div>
    );

  // ── Candy mode demos ──────────────────────────────────────────────────────

  const CANDY_COLORS: Record<string, string> = {
    '🍎': '#ef4444',
    '🍊': '#f97316',
    '🍋': '#eab308',
    '🫐': '#6366f1',
    '🍓': '#ec4899',
  };

  function CandyTile({
    sym,
    highlight = false,
    small = false,
  }: {
    sym: string;
    highlight?: boolean;
    small?: boolean;
  }) {
    const col = CANDY_COLORS[sym] ?? '#6366f1';
    const size = small ? 34 : 42;
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: small ? '1rem' : '1.2rem',
          background: highlight
            ? `linear-gradient(145deg, ${col}44 0%, ${col}22 100%)`
            : 'rgba(10,10,20,0.6)',
          border: `2px solid ${highlight ? col : col + '30'}`,
          boxShadow: highlight ? `0 0 12px ${col}70` : 'none',
          opacity: highlight ? 1 : 0.35,
        }}
      >
        {sym}
      </div>
    );
  }

  if (type === 'candy-group') {
    // 3×3 grid — top-left group of 3 red apples is highlighted
    const grid = [
      ['🍎', '🍎', '🍊'],
      ['🍎', '🫐', '🫐'],
      ['🍋', '🫐', '🍓'],
    ];
    const inGroup = (r: number, c: number) => (r === 0 && c < 2) || (r === 1 && c === 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 3 }}>
            {row.map((sym, c) => (
              <CandyTile key={c} sym={sym} highlight={inGroup(r, c)} />
            ))}
          </div>
        ))}
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: '#ef4444',
            letterSpacing: '0.1em',
            textAlign: 'center',
          }}
        >
          GROUP OF 3 — TAP ANY TO CLEAR ALL
        </div>
      </div>
    );
  }

  if (type === 'candy-score') {
    return (
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Small group */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <CandyTile sym="🍎" highlight />
            <CandyTile sym="🍎" highlight />
          </div>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>20 pts</div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>2 tiles</div>
        </div>
        <div style={{ fontSize: 18, color: '#25253a', marginTop: 10 }}>vs</div>
        {/* Large group */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍎" highlight />
              <CandyTile sym="🍎" highlight />
              <CandyTile sym="🍎" highlight />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍎" highlight />
              <CandyTile sym="🍎" highlight />
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>125 pts</div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>5 tiles</div>
        </div>
      </div>
    );
  }

  if (type === 'candy-gravity') {
    return (
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {/* Before */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍊" highlight small />
              <CandyTile sym="🍋" highlight small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍎" highlight={false} small />
              <CandyTile sym="🍎" highlight={false} small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🫐" highlight small />
              <CandyTile sym="🍓" highlight small />
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>BEFORE</div>
        </div>
        <div style={{ fontSize: 16, color: '#25253a' }}>→</div>
        {/* After — row 1 cleared, rest fell */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  background: 'rgba(165,180,252,0.1)',
                  border: '2px dashed #a5b4fc30',
                }}
              />
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  background: 'rgba(165,180,252,0.1)',
                  border: '2px dashed #a5b4fc30',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍊" highlight small />
              <CandyTile sym="🍋" highlight small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🫐" highlight small />
              <CandyTile sym="🍓" highlight small />
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#a5b4fc' }}>NEW TILES</div>
        </div>
      </div>
    );
  }

  if (type === 'candy-ready')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['🍎', '🍊', '🍋', '🫐', '🍓'].map((sym) => {
            const col = CANDY_COLORS[sym];
            return (
              <div
                key={sym}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  background: `linear-gradient(145deg, ${col}33, ${col}11)`,
                  border: `2px solid ${col}`,
                  boxShadow: `0 0 14px ${col}60`,
                }}
              >
                {sym}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: '#f472b6', letterSpacing: '0.15em', fontWeight: 700 }}>
          CLEAR GROUPS · SCORE POINTS
        </div>
      </div>
    );

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TUTORIAL SCREEN
═══════════════════════════════════════════════════════════════════════════ */

export default function TutorialScreen({ onComplete }: { onComplete: () => void }) {
  const currentModeId = useGameStore((s) => s.currentModeId);
  const mode = getModeById(currentModeId);
  const steps: TutorialStep[] = mode.tutorialSteps ?? FALLBACK_STEPS;
  const accentColor = mode.color;

  const [step, setStep] = useState(0);
  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse 70% 50% at 50% -5%, #0d0d22 0%, #06060f 100%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding:
          'max(16px, env(safe-area-inset-top, 16px)) 16px max(16px, env(safe-area-inset-bottom, 16px))',
        overflowY: 'auto',
      }}
    >
      {/* Mode badge */}
      <div
        style={{
          marginBottom: 'clamp(10px, 2vh, 16px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 20,
          border: `1px solid ${accentColor}40`,
          background: `${accentColor}10`,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: accentColor,
        }}
      >
        <span>{mode.icon}</span>
        <span>{mode.name.toUpperCase()} — HOW TO PLAY</span>
      </div>

      {/* Step indicators */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 'clamp(12px, 2.5vh, 20px)',
          padding: '8px 0',
        }}
      >
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              border: 'none',
              cursor: 'pointer',
              background: 'none',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? accentColor : i < step ? '#3a3a55' : '#1a1a2e',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </button>
        ))}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'linear-gradient(145deg, #0b0b1a 0%, #07070e 100%)',
          borderRadius: 20,
          border: `1px solid ${accentColor}20`,
          padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 24px)',
          boxShadow: `0 0 60px ${accentColor}08, 0 8px 40px rgba(0,0,0,0.8)`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'clamp(14px, 3vw, 20px)' }}>
          <div
            style={{
              fontSize: 'clamp(32px, 10vw, 44px)',
              lineHeight: 1,
              marginBottom: 12,
              color: s.iconColor,
              filter: `drop-shadow(0 0 16px ${s.iconColor}80)`,
            }}
          >
            {s.icon}
          </div>
          <div
            style={{
              fontSize: 'clamp(18px, 5vw, 22px)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}
          >
            {s.title}
          </div>
          <div
            style={{
              fontSize: 'clamp(11px, 3vw, 12px)',
              color: '#3a3a55',
              letterSpacing: '0.04em',
            }}
          >
            {s.subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 18px) 8px',
            marginBottom: 'clamp(12px, 3vw, 18px)',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 14,
            border: '1px solid #0e0e1e',
            overflowX: 'auto',
          }}
        >
          <DemoVisual type={s.demo} modeColor={accentColor} />
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 12,
            padding: 'clamp(12px, 3vw, 16px)',
            marginBottom: 'clamp(14px, 3vw, 20px)',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(12px, 3.2vw, 13px)',
              color: '#4a4a6a',
              lineHeight: 1.8,
              margin: 0,
              whiteSpace: 'pre-line',
            }}
          >
            {s.body}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 12,
                border: '1px solid #1a1a2e',
                background: 'rgba(255,255,255,0.01)',
                color: '#3a3a55',
                fontSize: 'clamp(13px, 3.5vw, 14px)',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 48,
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={isLast ? onComplete : () => setStep(step + 1)}
            style={{
              flex: 2,
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: isLast
                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              fontSize: 'clamp(13px, 3.5vw, 14px)',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: isLast
                ? `0 4px 20px ${accentColor}55`
                : '0 4px 20px rgba(99,102,241,0.35)',
              letterSpacing: '0.04em',
              minHeight: 48,
            }}
          >
            {isLast ? `▶ Play ${mode.name}!` : 'Next →'}
          </button>
        </div>
      </div>

      <button
        onClick={onComplete}
        style={{
          marginTop: 'clamp(12px, 2vh, 20px)',
          padding: '12px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1e1e2e',
          fontSize: 'clamp(11px, 3vw, 12px)',
          letterSpacing: '0.08em',
          minHeight: 44,
        }}
      >
        SKIP TUTORIAL
      </button>
    </div>
  );
}
