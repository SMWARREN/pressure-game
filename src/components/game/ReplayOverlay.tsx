// PRESSURE - Replay Overlay
// Full-screen overlay for stepping through a recorded game move-by-move.
// Read-only — tile taps are no-ops, all controls are playback controls.

import { useState, useEffect, useRef } from 'react';
import GameGrid from '@/components/game/GameGrid';
import { getModeById } from '@/game/modes';
import type { ReplayEngine, ReplaySnapshot } from '@/game/stats/replay';
import type { GameEndEvent } from '@/game/stats/types';
import { getGapValue, calculateTileSize, calculateBoardWidth } from './GameTileUtils';
import { getStatusColor } from '@/utils/statusColors';

/* ═══════════════════════════════════════════════════════════════════════════
   PROPS
═══════════════════════════════════════════════════════════════════════════ */

interface ReplayOverlayProps {
  readonly event: GameEndEvent;
  readonly engine: ReplayEngine;
  readonly onClose: () => void;
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

// ── Compute replay metadata (extracts from props/engine) ────────────────────
function computeReplayMetadata(event: GameEndEvent, engine: ReplayEngine, vw: number) {
  const mode = getModeById(event.modeId);
  const gridSize = engine.level.gridSize;
  const gap = getGapValue(gridSize);
  const tileSize = calculateTileSize(vw, gridSize, 380, 16);
  const totalMoves = engine.totalMoves;
  const boardW = calculateBoardWidth(tileSize, gridSize);
  const won = event.outcome === 'won';

  return { mode, gridSize, gap, tileSize, totalMoves, boardW, won };
}

// ── Auto-play hook ─────────────────────────────────────────────────────────
function useAutoPlay(playing: boolean, speedIdx: number, onStepForward: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      onStepForward();
    }, REPLAY_SPEEDS[speedIdx]);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speedIdx, onStepForward]);

  return intervalRef;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

const REPLAY_SPEEDS = [800, 400, 200];
const REPLAY_SPEED_LABELS = ['1×', '2×', '4×'];

// Extract replay state into custom hook for reduced complexity
function useReplayState(engine: ReplayEngine) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [vw, setVw] = useState(globalThis.innerWidth);

  useEffect(() => {
    const update = () => setVw(globalThis.innerWidth);
    globalThis.addEventListener('resize', update);
    globalThis.addEventListener('orientationchange', update);
    return () => {
      globalThis.removeEventListener('resize', update);
      globalThis.removeEventListener('orientationchange', update);
    };
  }, []);

  const goTo = (s: number) => {
    setStep(Math.max(0, Math.min(s, engine.snapshots.length - 1)));
    setPlaying(false);
  };

  return { step, setStep, playing, setPlaying, speedIdx, setSpeedIdx, vw, goTo };
}

// Helper to compute button styles
function getCtrlButtonStyles() {
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
  return {
    ctrlBtn,
    ctrlBtnDisabled: { ...ctrlBtn, opacity: 0.3, cursor: 'default' },
  };
}

// ── Playback Controls Component ────────────────────────────────────────────
interface PlaybackControlsProps {
  atStart: boolean;
  atEnd: boolean;
  playing: boolean;
  step: number;
  totalMoves: number;
  speedIdx: number;
  onGoToStart: () => void;
  onStepBack: () => void;
  onPlayPause: () => void;
  onStepForward: () => void;
  onGoToEnd: () => void;
  onSpeedChange: () => void;
}

function PlaybackControls({
  atStart,
  atEnd,
  playing,
  speedIdx,
  onGoToStart,
  onStepBack,
  onPlayPause,
  onStepForward,
  onGoToEnd,
  onSpeedChange,
}: PlaybackControlsProps) {
  const { ctrlBtn, ctrlBtnDisabled } = getCtrlButtonStyles();

  return (
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
      <button
        onClick={onGoToStart}
        disabled={atStart}
        style={atStart ? ctrlBtnDisabled : ctrlBtn}
        title="Skip to start"
      >
        ⏮
      </button>

      <button
        onClick={onStepBack}
        disabled={atStart}
        style={atStart ? ctrlBtnDisabled : ctrlBtn}
        title="Previous move"
      >
        ⏪
      </button>

      <button
        onClick={onPlayPause}
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

      <button
        onClick={onStepForward}
        disabled={atEnd}
        style={atEnd ? ctrlBtnDisabled : ctrlBtn}
        title="Next move"
      >
        ⏩
      </button>

      <button
        onClick={onGoToEnd}
        disabled={atEnd}
        style={atEnd ? ctrlBtnDisabled : ctrlBtn}
        title="Skip to end"
      >
        ⏭
      </button>

      <button
        onClick={onSpeedChange}
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
  );
}

export default function ReplayOverlay({ event, engine, onClose }: ReplayOverlayProps) {
  const { step, setStep, playing, setPlaying, speedIdx, setSpeedIdx, vw, goTo } = useReplayState(engine);

  const snapshot: ReplaySnapshot = engine.snapshots[step];
  const { mode, gridSize, gap, tileSize, totalMoves, boardW, won } = computeReplayMetadata(
    event,
    engine,
    vw
  );

  // Auto-play hook
  const handleStepForward = () => {
    setStep((s) => {
      if (s >= engine.snapshots.length - 1) {
        setPlaying(false);
        return s;
      }
      return s + 1;
    });
  };

  useAutoPlay(playing, speedIdx, handleStepForward);

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
            border: `1px solid ${getStatusColor(won ? 'won' : 'lost', 'border')}`,
            background: getStatusColor(won ? 'won' : 'lost', 'bg'),
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: getStatusColor(won ? 'won' : 'lost', 'text') }}>
            {won ? '✦' : '✕'}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: getStatusColor(won ? 'won' : 'lost', 'text'),
            }}
          >
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
            onTileTap={() => {}} // read-only replay
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

      <PlaybackControls
        atStart={atStart}
        atEnd={atEnd}
        playing={playing}
        step={step}
        totalMoves={totalMoves}
        speedIdx={speedIdx}
        onGoToStart={() => goTo(0)}
        onStepBack={() => goTo(step - 1)}
        onPlayPause={() => {
          if (atEnd) {
            setStep(0);
            setPlaying(true);
          } else {
            setPlaying((p) => !p);
          }
        }}
        onStepForward={() => goTo(step + 1)}
        onGoToEnd={() => goTo(engine.snapshots.length - 1)}
        onSpeedChange={() => setSpeedIdx((i) => (i + 1) % REPLAY_SPEEDS.length)}
      />
    </div>
  );
}
