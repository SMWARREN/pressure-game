// PRESSURE - Replay Overlay
// Full-screen overlay for stepping through a recorded game move-by-move.
// Read-only — tile taps are no-ops, all controls are playback controls.

import { useState, useEffect, useRef } from 'react';
import GameGrid from '@/components/game/GameGrid';
import { getModeById } from '@/game/modes';
import type { ReplayEngine, ReplaySnapshot } from '@/game/stats/replay';
import type { GameEndEvent } from '@/game/stats/types';

/* ═══════════════════════════════════════════════════════════════════════════
   PROPS
═══════════════════════════════════════════════════════════════════════════ */

interface ReplayOverlayProps {
  event: GameEndEvent;
  engine: ReplayEngine;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}:${String(s % 60).padStart(2, '0')}`;
  return `${s}s`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

const REPLAY_SPEEDS = [800, 400, 200];
const REPLAY_SPEED_LABELS = ['1×', '2×', '4×'];

export default function ReplayOverlay({ event, engine, onClose }: ReplayOverlayProps) {
  const [step, setStep] = useState(0); // index into engine.snapshots
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0); // 0=800ms, 1=400ms, 2=200ms
  const [vw, setVw] = useState(globalThis.innerWidth);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep board size in sync with window resizes / orientation changes
  useEffect(() => {
    const update = () => setVw(globalThis.innerWidth);
    globalThis.addEventListener('resize', update);
    globalThis.addEventListener('orientationchange', update);
    return () => {
      globalThis.removeEventListener('resize', update);
      globalThis.removeEventListener('orientationchange', update);
    };
  }, []);

  const snapshot: ReplaySnapshot = engine.snapshots[step];
  const gridSize = engine.level.gridSize;
  const mode = getModeById(event.modeId);
  const gap = gridSize >= 9 ? 2 : gridSize > 5 ? 3 : 4;
  const tileSize = Math.floor((Math.min(vw * 0.9, 380) - gap * (gridSize - 1) - 16) / gridSize);
  const totalMoves = engine.totalMoves;
  const boardW = tileSize * gridSize + gap * (gridSize - 1);

  // Auto-play effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= engine.snapshots.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, REPLAY_SPEEDS[speedIdx]);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speedIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (s: number) => {
    setStep(Math.max(0, Math.min(s, engine.snapshots.length - 1)));
    setPlaying(false);
  };

  const won = event.outcome === 'won';

  /* ── Styles ─────────────────────────────────────────────────────────────── */

  const ctrlBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: '1px solid #1e1e35',
    background: 'rgba(255,255,255,0.04)',
    color: '#a5b4fc',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  };

  const ctrlBtnDisabled: React.CSSProperties = {
    ...ctrlBtn,
    opacity: 0.3,
    cursor: 'default',
  };

  const atStart = step === 0;
  const atEnd = step === engine.snapshots.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,6,15,0.97)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#fff',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        style={{
          width: '100%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 'max(14px, env(safe-area-inset-top)) 16px 14px',
          borderBottom: '1px solid #12122a',
          background: 'rgba(6,6,15,0.9)',
        }}
      >
        {/* Mode icon + level name */}
        <div style={{ fontSize: 22, flexShrink: 0 }}>{mode.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {engine.level.name}
          </div>
          <div style={{ fontSize: 10, color: '#3a3a55', letterSpacing: '0.15em', marginTop: 1 }}>
            {mode.name.toUpperCase()} · REPLAY
          </div>
        </div>

        {/* Outcome badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            border: `1px solid ${won ? '#22c55e40' : '#ef444440'}`,
            background: won ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: won ? '#22c55e' : '#ef4444' }}>
            {won ? '✦' : '✕'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: won ? '#22c55e' : '#ef4444' }}>
            {won ? 'WON' : 'LOST'}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid #1e1e35',
            background: 'rgba(255,255,255,0.03)',
            color: '#3a3a55',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </header>

      {/* ── STEP COUNTER ───────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.06em',
            color: '#a5b4fc',
          }}
        >
          {step === 0 ? 'START' : `MOVE ${step} / ${totalMoves}`}
        </div>
        {snapshot.elapsed > 0 && (
          <div style={{ fontSize: 10, color: '#3a3a55' }}>{fmtElapsed(snapshot.elapsed)}</div>
        )}
        {event.score > 0 && snapshot.score > 0 && (
          <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>
            {snapshot.score} pts
          </div>
        )}
      </div>

      {/* ── GAME BOARD ─────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '8px 16px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: boardW,
            height: boardW,
            background: 'linear-gradient(145deg, #0a0a16, #07070e)',
            borderRadius: 18,
            padding: 8,
            border: '2px solid #12122a',
            boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        >
          <GameGrid
            tiles={snapshot.tiles}
            gridSize={gridSize}
            gap={gap}
            tileSize={tileSize}
            wallOffset={0}
            wallsJustAdvanced={false}
            compressionActive={false}
            hintPos={snapshot.tappedPos}
            status="idle"
            onTileTap={() => {}}
            animationsEnabled={false}
            tileRenderer={mode.tileRenderer}
          />
        </div>
      </div>

      {/* ── PROGRESS BAR ───────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          flexShrink: 0,
          padding: '0 16px 4px',
        }}
      >
        <div
          style={{
            height: 3,
            background: '#0d0d1f',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: totalMoves > 0 ? `${(step / totalMoves) * 100}%` : '0%',
              background: '#a5b4fc',
              borderRadius: 2,
              transition: 'width 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* ── PLAYBACK CONTROLS ──────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: 'clamp(12px, 2vh, 16px) 16px max(16px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Skip to start */}
        <button
          onClick={() => goTo(0)}
          disabled={atStart}
          style={atStart ? ctrlBtnDisabled : ctrlBtn}
          title="Skip to start"
        >
          ⏮
        </button>

        {/* Step back */}
        <button
          onClick={() => goTo(step - 1)}
          disabled={atStart}
          style={atStart ? ctrlBtnDisabled : ctrlBtn}
          title="Previous move"
        >
          ⏪
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => {
            if (atEnd) {
              setStep(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
          style={{
            ...ctrlBtn,
            width: 54,
            height: 54,
            borderRadius: 14,
            fontSize: 22,
            background: playing
              ? 'rgba(165,180,252,0.12)'
              : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: playing ? '1px solid #6366f160' : 'none',
            color: '#fff',
            boxShadow: playing ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
          }}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Step forward */}
        <button
          onClick={() => goTo(step + 1)}
          disabled={atEnd}
          style={atEnd ? ctrlBtnDisabled : ctrlBtn}
          title="Next move"
        >
          ⏩
        </button>

        {/* Skip to end */}
        <button
          onClick={() => goTo(engine.snapshots.length - 1)}
          disabled={atEnd}
          style={atEnd ? ctrlBtnDisabled : ctrlBtn}
          title="Skip to end"
        >
          ⏭
        </button>

        {/* Speed toggle */}
        <button
          onClick={() => setSpeedIdx((i) => (i + 1) % REPLAY_SPEEDS.length)}
          style={{
            ...ctrlBtn,
            width: 46,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#fbbf24',
            border: '1px solid #fbbf2440',
          }}
          title="Playback speed"
        >
          {REPLAY_SPEED_LABELS[speedIdx]}
        </button>
      </div>
    </div>
  );
}
