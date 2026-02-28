import { GameStatus } from '@/game/types';
import { LoadingSpinner } from './LoadingSpinner';

export interface GameFooterProps {
  readonly showUndoBtn: boolean;
  readonly showHintBtn: boolean;
  readonly timeStr: string;
  readonly timeStr2?: string;
  readonly showHint: boolean;
  readonly isComputingSolution: boolean;
  readonly isPaused: boolean;
  readonly status: GameStatus;
  readonly animationsEnabled: boolean;
  readonly history: unknown[];
  readonly iconBtn: React.CSSProperties;
  readonly onUndo: () => void;
  readonly onHint: () => void;
  readonly onPauseResume: () => void;
  readonly onHowToPlay: () => void;
  readonly onToggleAnimations: () => void;
  readonly computeSolution: () => void;
}

export function GameFooter({
  showUndoBtn,
  showHintBtn,
  timeStr,
  showHint,
  isComputingSolution,
  isPaused,
  status,
  animationsEnabled,
  history,
  iconBtn,
  onUndo,
  onHint,
  onPauseResume,
  onHowToPlay,
  onToggleAnimations,
  computeSolution,
}: GameFooterProps) {
  return (
    <>
      {/* Undo — only shown for modes that support it */}
      {showUndoBtn && (
        <button
          onClick={onUndo}
          disabled={history.length === 0 || status !== 'playing'}
          style={{
            ...iconBtn,
            opacity: history.length === 0 || status !== 'playing' ? 0.25 : 1,
          }}
          title="Undo"
        >
          <span style={{ fontSize: 18 }}>⌫</span>
        </button>
      )}

      {/* Timer display */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 44,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(13px, 3.5vw, 18px)',
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {timeStr || '—'}
        </div>
        <div style={{ fontSize: 9, color: '#25253a', letterSpacing: '0.12em' }}>TIME</div>
      </div>

      {/* Hint — only shown for pipe modes that have a BFS solution */}
      {showHintBtn && (
        <button
          onClick={() => {
            if (isComputingSolution !== true && status === 'playing') {
              computeSolution();
            }
            onHint();
          }}
          disabled={isComputingSolution || status !== 'playing'}
          style={{
            ...iconBtn,
            opacity: isComputingSolution || status !== 'playing' ? 0.25 : 1,
            color: showHint ? '#fbbf24' : '#3a3a55',
            border: showHint ? '1px solid #fbbf2440' : '1px solid #12122a',
          }}
          title={isComputingSolution ? 'Computing...' : 'Hint'}
        >
          {isComputingSolution ? (
            <LoadingSpinner size={18} color="#fbbf24" />
          ) : (
            <span style={{ fontSize: 16 }}>💡</span>
          )}
        </button>
      )}

      {/* Pause button */}
      <button
        onClick={onPauseResume}
        disabled={status !== 'playing' && !isPaused}
        style={{
          ...iconBtn,
          opacity: status !== 'playing' && !isPaused ? 0.25 : 1,
          color: isPaused ? '#22c55e' : '#3a3a55',
          border: isPaused ? '1px solid #22c55e40' : '1px solid #12122a',
        }}
        title={isPaused ? 'Resume' : 'Pause'}
      >
        <span style={{ fontSize: 16 }}>{isPaused ? '▶' : '⏸'}</span>
      </button>

      {/* How to Play */}
      <button
        onClick={onHowToPlay}
        disabled={status !== 'playing'}
        style={{
          ...iconBtn,
          opacity: status !== 'playing' ? 0.25 : 1,
        }}
        title="How to Play"
      >
        <span style={{ fontSize: 16 }}>❓</span>
      </button>

      {/* FX toggle */}
      <button
        onClick={onToggleAnimations}
        style={{
          ...iconBtn,
          color: animationsEnabled ? '#a5b4fc' : '#3a3a55',
          border: animationsEnabled ? '1px solid #6366f140' : '1px solid #12122a',
        }}
        title={animationsEnabled ? 'Disable effects' : 'Enable effects'}
      >
        <span style={{ fontSize: 14 }}>{animationsEnabled ? '✨' : '◻'}</span>
      </button>
    </>
  );
}
