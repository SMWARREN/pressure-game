import React from 'react';
import { ThemeColors } from '@/utils/themeColors';
import { useTheme } from '@/hooks/useTheme';
import {
  formatElapsedTime,
  formatWinStats,
  formatLevelRecord,
  formatLossStats,
} from './OverlayUtils';

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

export const getOverlayStyle = (colors: ThemeColors): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: colors.game.overlay,
  backdropFilter: 'blur(8px)',
  borderRadius: 18,
  zIndex: 10,
  padding: 24,
  textAlign: 'center',
});

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

// Render idle overlay (ready to play)
function IdleOverlay({
  levelName,
  onStart,
  solutionMessage,
  colors,
}: {
  readonly levelName: string;
  readonly onStart: () => void;
  readonly solutionMessage: string;
  readonly colors: ThemeColors;
}) {
  return (
    <div style={getOverlayStyle(colors)}>
      <div style={{ fontSize: 11, color: colors.text.tertiary, letterSpacing: '0.2em', marginBottom: 8 }}>
        READY
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: colors.text.primary, marginBottom: 6 }}>{levelName}</div>
      <div style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 28 }}>{solutionMessage}</div>
      <button onClick={onStart} style={btnPrimary}>
        START
      </button>
    </div>
  );
}

// ── Win Overlay ──────────────────────────────────────────────────────────────
function WinOverlay({
  winTitle,
  finalScore,
  moves,
  timeStr,
  isScoreMode,
  levelRecord,
  hasNext,
  onNext,
  onRetry,
  onMenu,
  onReplay,
  colors,
}: {
  readonly winTitle: string;
  readonly finalScore?: number;
  readonly moves: number;
  readonly timeStr: string;
  readonly isScoreMode: boolean;
  readonly levelRecord?: { wins: number; attempts: number };
  readonly hasNext: boolean;
  readonly onNext: () => void;
  readonly onRetry: () => void;
  readonly onMenu: () => void;
  readonly onReplay?: () => void;
  readonly colors: ThemeColors;
}) {
  const marginTopButtons = levelRecord ? 0 : 14;
  return (
    <div style={getOverlayStyle(colors)} data-testid="win-overlay">
      <div style={{ fontSize: 32, marginBottom: 4 }}>✦</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: colors.status.success, marginBottom: 4 }}>
        {winTitle.toUpperCase()}
      </div>
      <div style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 6 }}>
        {formatWinStats(isScoreMode, finalScore, moves, timeStr)}
      </div>
      {levelRecord && levelRecord.attempts > 0 && (
        <div style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 16 }}>
          {formatLevelRecord(levelRecord.wins, levelRecord.attempts)}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: marginTopButtons,
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
}

// ── Loss Overlay ─────────────────────────────────────────────────────────────
function LossOverlay({
  lossTitle,
  finalScore,
  targetScore,
  moves,
  isScoreMode,
  levelRecord,
  newHighScore,
  onRetry,
  onMenu,
  onReplay,
  colors,
}: {
  readonly lossTitle: string;
  readonly finalScore?: number;
  readonly targetScore?: number;
  readonly moves: number;
  readonly isScoreMode: boolean;
  readonly levelRecord?: { wins: number; attempts: number };
  readonly newHighScore?: boolean;
  readonly onRetry: () => void;
  readonly onMenu: () => void;
  readonly onReplay?: () => void;
  readonly colors: ThemeColors;
}) {
  const marginTopButtons = levelRecord ? 0 : 14;
  const shouldShowScore = finalScore !== undefined && targetScore === undefined && finalScore > 0;
  const titleColor = newHighScore ? colors.status.warning : colors.status.error;
  const overlayIcon = newHighScore ? '🏆' : '✕';

  return (
    <div style={getOverlayStyle(colors)}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>{overlayIcon}</div>
      {newHighScore && (
        <div
          style={{
            fontSize: 10,
            color: colors.status.warning,
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
          color: titleColor,
          marginBottom: 4,
        }}
      >
        {lossTitle.toUpperCase()}
      </div>
      {shouldShowScore && (
        <div style={{ fontSize: 22, fontWeight: 900, color: colors.text.primary, marginBottom: 4 }}>
          {finalScore.toLocaleString()} pts
        </div>
      )}
      <div style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 6 }}>
        {formatLossStats(isScoreMode, moves)}
      </div>
      {levelRecord && levelRecord.attempts > 0 && (
        <div style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 16 }}>
          {formatLevelRecord(levelRecord.wins, levelRecord.attempts)}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: marginTopButtons,
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
}

// ── Main Overlay Router ──────────────────────────────────────────────────────
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
  const { colors } = useTheme();
  const timeStr = formatElapsedTime(elapsedSeconds);
  const isScoreMode = targetScore !== undefined;

  // Compute solution message to avoid nested ternary
  const moveCount = solution?.length ?? 0;
  const moveSuffix = moveCount !== 1 ? 's' : '';
  const isSolved = solution && solution.length === 0;
  let solutionMessage = '';
  if (solution) {
    solutionMessage = isSolved ? 'Already solved' : `${moveCount} move${moveSuffix} to solve`;
  }

  if (status === 'idle')
    return (
      <IdleOverlay levelName={levelName} onStart={onStart} solutionMessage={solutionMessage} colors={colors} />
    );
  if (status === 'won')
    return (
      <WinOverlay
        winTitle={winTitle}
        finalScore={finalScore}
        moves={moves}
        timeStr={timeStr}
        isScoreMode={isScoreMode}
        levelRecord={levelRecord}
        hasNext={hasNext}
        onNext={onNext}
        onRetry={onRetry}
        onMenu={onMenu}
        onReplay={onReplay}
        colors={colors}
      />
    );
  if (status === 'lost')
    return (
      <LossOverlay
        lossTitle={lossTitle}
        finalScore={finalScore}
        targetScore={targetScore}
        moves={moves}
        isScoreMode={isScoreMode}
        levelRecord={levelRecord}
        newHighScore={newHighScore}
        onRetry={onRetry}
        onMenu={onMenu}
        onReplay={onReplay}
        colors={colors}
      />
    );
  return null;
}
