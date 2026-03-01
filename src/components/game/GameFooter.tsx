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

// Helper: compute undo button state
function getUndoButtonState(history: unknown[], status: GameStatus) {
  const disabled = history.length === 0 || status !== 'playing';
  return { disabled, opacity: disabled ? 0.25 : 1 };
}

// Helper: compute hint button state
function getHintButtonState(showHint: boolean, isComputingSolution: boolean, status: GameStatus) {
  const buttonStyles = showHint
    ? { color: '#fbbf24', border: '1px solid #fbbf2440' }
    : { color: '#3a3a55', border: '1px solid #12122a' };
  const disabled = isComputingSolution || status !== 'playing';
  return { buttonStyles, disabled, opacity: disabled ? 0.25 : 1, title: isComputingSolution ? 'Computing...' : 'Hint' };
}

// Helper: compute pause button state
function getPauseButtonState(isPaused: boolean, status: GameStatus) {
  const buttonStyles = isPaused
    ? { color: '#22c55e', border: '1px solid #22c55e40' }
    : { color: '#3a3a55', border: '1px solid #12122a' };
  const disabled = status !== 'playing' && !isPaused;
  return {
    buttonStyles,
    disabled,
    opacity: disabled ? 0.25 : 1,
    title: isPaused ? 'Resume' : 'Pause',
    icon: isPaused ? '▶' : '⏸',
  };
}

// Helper: compute animations button state
function getAnimButtonState(animationsEnabled: boolean) {
  const buttonStyles = animationsEnabled
    ? { color: '#a5b4fc', border: '1px solid #6366f140' }
    : { color: '#3a3a55', border: '1px solid #12122a' };
  return {
    buttonStyles,
    title: animationsEnabled ? 'Disable effects' : 'Enable effects',
    icon: animationsEnabled ? '✨' : '◻',
  };
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
  const undoState = getUndoButtonState(history, status);
  const hintState = getHintButtonState(showHint, isComputingSolution, status);
  const pauseState = getPauseButtonState(isPaused, status);
  const animState = getAnimButtonState(animationsEnabled);

  return (
    <>
      {/* Undo — only shown for modes that support it */}
      {showUndoBtn && (
        <button
          onClick={onUndo}
          disabled={undoState.disabled}
          style={{
            ...iconBtn,
            opacity: undoState.opacity,
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
          disabled={hintState.disabled}
          style={{
            ...iconBtn,
            opacity: hintState.opacity,
            ...hintState.buttonStyles,
          }}
          title={hintState.title}
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
        disabled={pauseState.disabled}
        style={{
          ...iconBtn,
          opacity: pauseState.opacity,
          ...pauseState.buttonStyles,
        }}
        title={pauseState.title}
      >
        <span style={{ fontSize: 16 }}>{pauseState.icon}</span>
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
          ...animState.buttonStyles,
        }}
        title={animState.title}
      >
        <span style={{ fontSize: 14 }}>{animState.icon}</span>
      </button>
    </>
  );
}
