import { useTheme } from '@/hooks/useTheme';
import { GameStatus } from '@/game/types';
import { LoadingSpinner } from './LoadingSpinner';

export interface GameFooterProps {
  readonly showUndoBtn: boolean;
  readonly showHintBtn: boolean;
  readonly timeStr: string;
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
function getHintButtonState(
  showHint: boolean,
  isComputingSolution: boolean,
  status: GameStatus,
  colors: ReturnType<typeof useTheme>['colors']
) {
  const buttonStyles = showHint
    ? { color: colors.status.warning, border: `1px solid ${colors.status.warning}40` }
    : { color: colors.text.tertiary, border: `1px solid ${colors.border.primary}` };
  const disabled = isComputingSolution || status !== 'playing';
  return {
    buttonStyles,
    disabled,
    opacity: disabled ? 0.25 : 1,
    title: isComputingSolution ? 'Computing...' : 'Hint',
  };
}

// Helper: compute pause button state
function getPauseButtonState(
  isPaused: boolean,
  status: GameStatus,
  colors: ReturnType<typeof useTheme>['colors']
) {
  const buttonStyles = isPaused
    ? { color: colors.status.success, border: `1px solid ${colors.status.success}40` }
    : { color: colors.text.tertiary, border: `1px solid ${colors.border.primary}` };
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
function getAnimButtonState(
  animationsEnabled: boolean,
  colors: ReturnType<typeof useTheme>['colors']
) {
  const buttonStyles = animationsEnabled
    ? { color: colors.status.info, border: `1px solid ${colors.status.info}40` }
    : { color: colors.text.tertiary, border: `1px solid ${colors.border.primary}` };
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
  const { colors } = useTheme();
  const undoState = getUndoButtonState(history, status);
  const hintState = getHintButtonState(showHint, isComputingSolution, status, colors);
  const pauseState = getPauseButtonState(isPaused, status, colors);
  const animState = getAnimButtonState(animationsEnabled, colors);

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
        <div style={{ fontSize: 9, color: colors.text.tertiary, letterSpacing: '0.12em' }}>
          TIME
        </div>
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
          opacity: status === 'playing' ? 1 : 0.25,
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
