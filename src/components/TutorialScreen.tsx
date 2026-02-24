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

  // ── Outbreak mode demos ──────────────────────────────────────────────────────

  const OUTBREAK_COLORS: Record<number, string> = {
    0: '#ef4444', // red
    1: '#f97316', // orange
    2: '#22c55e', // green
    3: '#3b82f6', // blue
    4: '#a855f7', // purple
  };

  const OUTBREAK_ICONS: Record<number, string> = {
    0: '🧟',
    1: '👽',
    2: '🦠',
    3: '👾',
    4: '🤖',
  };

  function OutbreakTile({
    colorIndex,
    owned = false,
    frontier = false,
    groupSize,
    isNew = false,
    small = false,
  }: {
    colorIndex: number;
    owned?: boolean;
    frontier?: boolean;
    groupSize?: number;
    isNew?: boolean;
    small?: boolean;
  }) {
    const lit = OUTBREAK_COLORS[colorIndex] ?? '#888';
    const size = small ? 34 : 42;
    const fontSize = small ? '0.75rem' : '0.9rem';

    // Owned tiles - vivid fill with icon
    if (owned) {
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize,
            background: isNew
              ? `linear-gradient(160deg, #ffffff44 0%, ${lit}ee 55%, #111 100%)`
              : `linear-gradient(160deg, ${lit}bb 0%, #111ee 100%)`,
            border: isNew ? '2px solid #ffffff' : `2px solid ${lit}99`,
            boxShadow: isNew ? `0 0 28px ${lit}, 0 0 10px #ffffff88` : `0 0 6px ${lit}44`,
          }}
        >
          ☣️
        </div>
      );
    }

    // Frontier tiles - dark with bright border, show number
    if (frontier) {
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: small ? '0.8rem' : '1rem',
            fontWeight: 700,
            color: lit,
            background: 'linear-gradient(160deg, #0d0d1a 0%, #111 100%)',
            border: `2px solid ${lit}`,
            boxShadow: `0 0 14px ${lit}66`,
          }}
        >
          {groupSize ?? ''}
        </div>
      );
    }

    // Interior tiles - dim with icon
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          background: 'linear-gradient(160deg, #080810 0%, #111133 100%)',
          border: `1px solid ${lit}22`,
          opacity: 0.6,
        }}
      >
        {OUTBREAK_ICONS[colorIndex] ?? ''}
      </div>
    );
  }

  if (type === 'outbreak-start') {
    // Show starting corner with one owned cell
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={1} />
            <OutbreakTile colorIndex={2} />
            <OutbreakTile colorIndex={0} />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={2} />
            <OutbreakTile colorIndex={1} frontier groupSize={3} />
            <OutbreakTile colorIndex={0} />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned isNew />
            <OutbreakTile colorIndex={0} frontier groupSize={2} />
            <OutbreakTile colorIndex={2} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#06b6d4', letterSpacing: '0.1em', textAlign: 'center' }}>
          YOU START IN THE CORNER
        </div>
      </div>
    );
  }

  if (type === 'outbreak-frontier') {
    // Show frontier numbers clearly
    return (
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={0} owned small />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={1} frontier groupSize={1} small />
          </div>
          <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>+1 cell</div>
        </div>
        <div style={{ fontSize: 18, color: '#25253a' }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={0} owned small />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={1} frontier groupSize={5} small />
            <OutbreakTile colorIndex={1} small />
          </div>
          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>+5 cells!</div>
        </div>
      </div>
    );
  }

  if (type === 'outbreak-colors') {
    // Show the three visual states
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <OutbreakTile colorIndex={0} owned />
          <div style={{ fontSize: 9, color: '#06b6d4' }}>OWNED</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <OutbreakTile colorIndex={1} frontier groupSize={4} />
          <div style={{ fontSize: 9, color: '#f97316' }}>TAPPABLE</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <OutbreakTile colorIndex={2} />
          <div style={{ fontSize: 9, color: '#3a3a55' }}>BLOCKED</div>
        </div>
      </div>
    );
  }

  if (type === 'outbreak-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.8))' }}>🦠</div>
        <div style={{ fontSize: 11, color: '#06b6d4', letterSpacing: '0.15em', fontWeight: 700 }}>
          INFECT EVERY CELL
        </div>
      </div>
    );
  }

  // ── Quantum Chain mode demos ────────────────────────────────────────────────

  function QuantumTile({
    type,
    value,
    symbol,
    fulfilled = false,
    small = false,
  }: {
    type: 'number' | 'operator' | 'target' | 'flux';
    value?: number;
    symbol?: string;
    fulfilled?: boolean;
    small?: boolean;
  }) {
    const size = small ? 34 : 42;
    const fontSize = small ? '0.9rem' : '1.1rem';

    const styles: Record<string, React.CSSProperties> = {
      number: {
        background: 'linear-gradient(145deg, #1e3a5f 0%, #0d1f33 100%)',
        border: '2px solid #3b82f6',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
        color: '#93c5fd',
      },
      operator: {
        background: 'linear-gradient(145deg, #4c1d95 0%, #2e1065 100%)',
        border: '2px solid #8b5cf6',
        boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
        color: '#c4b5fd',
      },
      target: fulfilled
        ? {
            background: 'linear-gradient(145deg, #14532d 0%, #052e16 100%)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
            color: '#86efac',
          }
        : {
            background: 'linear-gradient(145deg, #78350f 0%, #451a03 100%)',
            border: '2px solid #f59e0b',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
            color: '#fcd34d',
          },
      flux: {
        background: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 100%)',
        border: '2px solid #ef4444',
        boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
        color: '#fca5a5',
      },
    };

    const displayValue = type === 'target' ? (fulfilled ? '✓' : value) : type === 'flux' ? symbol : value;

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 700,
          ...styles[type],
        }}
      >
        {displayValue}
      </div>
    );
  }

  if (type === 'quantum-chain') {
    // Show a chain: number -> operator -> number -> target
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <QuantumTile type="number" value={3} />
        <div style={{ fontSize: 14, color: '#8b5cf6' }}>→</div>
        <QuantumTile type="operator" symbol="+" />
        <div style={{ fontSize: 14, color: '#8b5cf6' }}>→</div>
        <QuantumTile type="number" value={5} />
        <div style={{ fontSize: 14, color: '#8b5cf6' }}>→</div>
        <QuantumTile type="target" value={8} />
      </div>
    );
  }

  if (type === 'quantum-start') {
    // Show starting with a number tile
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <QuantumTile type="number" value={7} />
          <div style={{ fontSize: 12, color: '#3a3a55' }}>tap to start</div>
        </div>
        <div style={{ fontSize: 10, color: '#3b82f6', letterSpacing: '0.1em' }}>
          BLUE = NUMBER TILES
        </div>
      </div>
    );
  }

  if (type === 'quantum-extend') {
    // Show extending with operator
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="number" value={4} small />
          <div style={{ fontSize: 8, color: '#3b82f6' }}>START</div>
        </div>
        <div style={{ fontSize: 16, color: '#8b5cf6' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="operator" symbol="×" small />
          <div style={{ fontSize: 8, color: '#8b5cf6' }}>OPERATOR</div>
        </div>
        <div style={{ fontSize: 16, color: '#8b5cf6' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="number" value={3} small />
          <div style={{ fontSize: 8, color: '#3b82f6' }}>NEXT</div>
        </div>
      </div>
    );
  }

  if (type === 'quantum-target') {
    // Show landing on target
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <QuantumTile type="number" value={2} small />
            <QuantumTile type="operator" symbol="+" small />
            <QuantumTile type="number" value={3} small />
          </div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>2 + 3 = 5</div>
        </div>
        <div style={{ fontSize: 16, color: '#f59e0b' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="target" value={5} fulfilled small />
          <div style={{ fontSize: 9, color: '#22c55e' }}>MATCH!</div>
        </div>
      </div>
    );
  }

  if (type === 'quantum-flux') {
    // Show flux affecting adjacent numbers
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          <QuantumTile type="number" value={4} small />
          <QuantumTile type="flux" symbol="×2" small />
          <QuantumTile type="number" value={8} small />
        </div>
        <div style={{ fontSize: 10, color: '#ef4444', letterSpacing: '0.05em' }}>
          FLUX DOUBLES ADJACENT NUMBERS
        </div>
      </div>
    );
  }

  if (type === 'quantum-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <QuantumTile type="number" value={1} small />
          <QuantumTile type="operator" symbol="+" small />
          <QuantumTile type="number" value={2} small />
          <QuantumTile type="operator" symbol="×" small />
          <QuantumTile type="number" value={3} small />
        </div>
        <div style={{ fontSize: 11, color: '#8b5cf6', letterSpacing: '0.15em', fontWeight: 700 }}>
          BUILD CHAINS · HIT TARGETS
        </div>
      </div>
    );
  }

  // ── Shopping Spree mode demos ───────────────────────────────────────────────

  const SHOPPING_COLORS: Record<string, string> = {
    '👗': '#ec4899', // pink dress
    '👠': '#ef4444', // red heels
    '👜': '#d97706', // brown bag
    '💄': '#db2777', // magenta lipstick
    '💎': '#06b6d4', // cyan diamond
  };

  function ShoppingTile({
    sym,
    highlight = false,
    small = false,
    flashSale = false,
  }: {
    sym: string;
    highlight?: boolean;
    small?: boolean;
    flashSale?: boolean;
  }) {
    const col = SHOPPING_COLORS[sym] ?? '#ec4899';
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
          border: flashSale
            ? '2px solid #fbbf24'
            : highlight
              ? `2px solid ${col}`
              : `${col}30`,
          boxShadow: flashSale
            ? '0 0 18px rgba(251,191,36,0.8)'
            : highlight
              ? `0 0 12px ${col}70`
              : 'none',
          opacity: highlight ? 1 : 0.35,
        }}
      >
        {sym}
      </div>
    );
  }

  if (type === 'shopping-group') {
    // Show a group of matching items
    const grid = [
      ['👗', '👗', '👠'],
      ['👗', '👜', '👜'],
      ['💄', '👜', '💎'],
    ];
    const inGroup = (r: number, c: number) => (r === 0 && c < 2) || (r === 1 && c === 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 3 }}>
            {row.map((sym, c) => (
              <ShoppingTile key={c} sym={sym} highlight={inGroup(r, c)} />
            ))}
          </div>
        ))}
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: '#ec4899',
            letterSpacing: '0.1em',
            textAlign: 'center',
          }}
        >
          GROUP OF 3 — TAP TO BUY ALL
        </div>
      </div>
    );
  }

  if (type === 'shopping-values') {
    // Show item values
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ShoppingTile sym="💄" highlight small />
            <div style={{ fontSize: 9, color: '#db2777' }}>$10</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ShoppingTile sym="👗" highlight small />
            <div style={{ fontSize: 9, color: '#ec4899' }}>$15</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ShoppingTile sym="👠" highlight small />
            <div style={{ fontSize: 9, color: '#ef4444' }}>$20</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ShoppingTile sym="👜" highlight small />
            <div style={{ fontSize: 9, color: '#d97706' }}>$25</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ShoppingTile sym="💎" highlight small />
            <div style={{ fontSize: 9, color: '#06b6d4' }}>$50</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#f59e0b', letterSpacing: '0.05em' }}>
          💎 DIAMONDS ARE MOST VALUABLE!
        </div>
      </div>
    );
  }

  if (type === 'shopping-flash') {
    // Show flash sale
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          <ShoppingTile sym="👗" highlight small />
          <ShoppingTile sym="👗" highlight flashSale small />
          <ShoppingTile sym="👠" small />
        </div>
        <div style={{ fontSize: 10, color: '#fbbf24', letterSpacing: '0.1em', fontWeight: 700 }}>
          ⚡ FLASH SALE: 3× VALUE!
        </div>
      </div>
    );
  }

  if (type === 'shopping-cart') {
    // Show cart bonus
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 24 }}>🛒</div>
          <div style={{ fontSize: 10, color: '#3a3a55' }}>10 items</div>
        </div>
        <div style={{ fontSize: 20, color: '#22c55e' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 24, filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.6))' }}>
            💰
          </div>
          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>+$50 BONUS!</div>
        </div>
      </div>
    );
  }

  if (type === 'shopping-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['👗', '👠', '👜', '💄', '💎'].map((sym) => {
            const col = SHOPPING_COLORS[sym];
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
        <div style={{ fontSize: 11, color: '#ec4899', letterSpacing: '0.15em', fontWeight: 700 }}>
          SHOP TIL YOU DROP
        </div>
      </div>
    );
  }

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
