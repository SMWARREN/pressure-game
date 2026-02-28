import React from 'react';

export const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(6,6,15,0.92)',
  backdropFilter: 'blur(8px)',
  borderRadius: 18,
  zIndex: 10,
  padding: 24,
  textAlign: 'center',
};

export const btnPrimary: React.CSSProperties = {
  padding: 'clamp(9px, 2.5vw, 12px) clamp(14px, 4vw, 22px)',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  color: '#fff',
  fontSize: 'clamp(11px, 3vw, 13px)',
  fontWeight: 800,
  cursor: 'pointer',
  letterSpacing: '0.06em',
  minHeight: 40,
  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
  whiteSpace: 'nowrap',
};

export const btnSecondary: React.CSSProperties = {
  padding: 'clamp(9px, 2.5vw, 12px) clamp(12px, 3.5vw, 18px)',
  borderRadius: 12,
  border: '1.5px solid #1e1e35',
  background: 'rgba(255,255,255,0.03)',
  color: '#a5b4fc',
  fontSize: 'clamp(11px, 3vw, 13px)',
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.04em',
  minHeight: 40,
  whiteSpace: 'nowrap',
};

export interface OverlayProps {
  readonly status: string;
  readonly moves: number;
  readonly levelName: string;
  readonly onStart: () => void;
  readonly onNext: () => void;
  readonly onMenu: () => void;
  readonly onRetry: () => void;
  readonly solution: { x: number; y: number; rotations: number }[] | null;
  readonly hasNext: boolean;
  readonly elapsedSeconds: number;
  readonly winTitle?: string;
  readonly lossTitle?: string;
  readonly finalScore?: number;
  readonly targetScore?: number;
  readonly levelRecord?: { wins: number; attempts: number };
  readonly onReplay?: () => void;
  readonly newHighScore?: boolean;
}

export function Overlay({
  status,
  moves,
  levelName,
  onStart,
  onNext,
  onMenu,
  onRetry,
  solution,
  hasNext,
  elapsedSeconds,
  winTitle = 'CONNECTED',
  lossTitle = 'CRUSHED',
  finalScore,
  targetScore,
  levelRecord,
  onReplay,
  newHighScore,
}: OverlayProps) {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeStr =
    elapsedSeconds > 0 ? `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')}s` : '';

  const isScoreMode = targetScore !== undefined;

  if (status === 'idle')
    return (
      <div style={overlayStyle}>
        <div style={{ fontSize: 11, color: '#3a3a55', letterSpacing: '0.2em', marginBottom: 8 }}>
          READY
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{levelName}</div>
        <div style={{ fontSize: 10, color: '#25253a', marginBottom: 28 }}>
          {solution
            ? solution.length === 0
              ? 'Already solved'
              : `${solution.length} move${solution.length !== 1 ? 's' : ''} to solve`
            : ''}
        </div>
        <button onClick={onStart} style={btnPrimary}>
          START
        </button>
      </div>
    );
  if (status === 'won')
    return (
      <div style={overlayStyle}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>✦</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e', marginBottom: 4 }}>
          {winTitle.toUpperCase()}
        </div>
        <div style={{ fontSize: 10, color: '#3a3a55', marginBottom: 6 }}>
          {isScoreMode
            ? `${finalScore ?? 0} pts · ${moves} tap${moves !== 1 ? 's' : ''}`
            : `${moves} move${moves !== 1 ? 's' : ''}${timeStr ? ` · ${timeStr}` : ''}`}
        </div>
        {levelRecord && levelRecord.attempts > 0 && (
          <div style={{ fontSize: 10, color: '#25253a', marginBottom: 16 }}>
            {levelRecord.wins} win{levelRecord.wins !== 1 ? 's' : ''} · {levelRecord.attempts}{' '}
            attempt{levelRecord.attempts !== 1 ? 's' : ''}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: levelRecord ? 0 : 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {hasNext && (
            <button onClick={onNext} style={btnPrimary}>
              NEXT →
            </button>
          )}
          <button onClick={onRetry} style={btnSecondary}>
            ↺ RETRY
          </button>
          <button onClick={onMenu} style={btnSecondary}>
            MENU
          </button>
          {onReplay && (
            <button onClick={onReplay} style={btnSecondary}>
              ▶ REPLAY
            </button>
          )}
        </div>
      </div>
    );
  if (status === 'lost')
    return (
      <div style={overlayStyle}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{newHighScore ? '🏆' : '✕'}</div>
        {newHighScore && (
          <div
            style={{
              fontSize: 10,
              color: '#fbbf24',
              letterSpacing: '0.12em',
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            NEW HIGH SCORE!
          </div>
        )}
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: newHighScore ? '#fbbf24' : '#ef4444',
            marginBottom: 4,
          }}
        >
          {lossTitle.toUpperCase()}
        </div>
        {finalScore !== undefined && targetScore === undefined && finalScore > 0 && (
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
            {finalScore.toLocaleString()} pts
          </div>
        )}
        <div style={{ fontSize: 10, color: '#3a3a55', marginBottom: 6 }}>
          {isScoreMode
            ? `${moves} tap${moves !== 1 ? 's' : ''}`
            : `${moves} move${moves !== 1 ? 's' : ''}`}
        </div>
        {levelRecord && levelRecord.attempts > 0 && (
          <div style={{ fontSize: 10, color: '#25253a', marginBottom: 16 }}>
            {levelRecord.wins} win{levelRecord.wins !== 1 ? 's' : ''} · {levelRecord.attempts}{' '}
            attempt{levelRecord.attempts !== 1 ? 's' : ''}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: levelRecord ? 0 : 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button onClick={onRetry} style={btnPrimary}>
            ↺ RETRY
          </button>
          <button onClick={onMenu} style={btnSecondary}>
            MENU
          </button>
          {onReplay && (
            <button onClick={onReplay} style={btnSecondary}>
              ▶ REPLAY
            </button>
          )}
        </div>
      </div>
    );
  return null;
}
