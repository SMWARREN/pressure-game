import { useTheme } from '@/hooks/useTheme';
import { getModeById } from '@/game/modes';
import { StatComponentConfig } from '@/game/modes/types'; // Import the new type
import {
  getCompressionColor,
  getCompressionGlow,
  getCompressionLabel,
  getScoreColor,
  getTimeleftGlow,
} from './GameStatsUtils';

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
}

/**
 * CompressionBar - Visual indicator showing wall compression progress
 */
function CompressionBar({
  percent,
  active,
  colors,
}: {
  readonly percent: number;
  readonly active: boolean;
  readonly colors: ReturnType<typeof useTheme>['colors'];
}) {
  const color = getCompressionColor(percent);
  const glow = getCompressionGlow(percent);
  const label = getCompressionLabel(percent, active);

  return (
    <div style={{ flex: 1, marginTop: 5 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          letterSpacing: '0.14em',
          marginBottom: 4,
        }}
      >
        <span style={{ color: colors.text.tertiary }}>WALLS</span>
        <span
          style={{
            color: active ? color : colors.text.tertiary,
            fontWeight: 800,
            transition: 'color 0.3s',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: colors.bg.tertiary,
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${colors.border.primary}`,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            transition: 'width 0.5s ease, background 0.4s',
            boxShadow: active && percent > 10 ? `0 0 12px ${glow}` : 'none',
          }}
        />
      </div>
    </div>
  );
}

/**
 * MovesCounter - Shows current moves vs max moves
 * If maxMoves is 0 or undefined, shows just the move count (for modes without move limits)
 */
function MovesCounter({
  moves,
  maxMoves,
  colors,
}: {
  readonly moves: number;
  readonly maxMoves: number;
  readonly colors: ReturnType<typeof useTheme>['colors'];
}) {
  const hasLimit = maxMoves && maxMoves > 0;
  const outOfMoves = hasLimit && moves >= maxMoves;
  const color = outOfMoves ? colors.status.error : colors.text.primary;
  const bgColor = outOfMoves ? `${colors.status.error}10` : colors.bg.secondary;
  const borderColor = outOfMoves ? `${colors.status.error}60` : colors.border.primary;

  return (
    <div
      data-testid="move-counter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '6px 12px',
        flexShrink: 0,
        minWidth: hasLimit ? 54 : 48,
        transition: 'all 0.3s',
        boxShadow: outOfMoves ? '0 0 12px rgba(239,68,68,0.3)' : 'none',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color,
          transition: 'color 0.3s',
        }}
      >
        {moves}
      </div>
      {hasLimit ? (
        <>
          <div
            style={{
              fontSize: 8,
              color: outOfMoves ? colors.status.error : colors.text.tertiary,
              letterSpacing: '0.12em',
              marginTop: 2,
              transition: 'color 0.3s',
            }}
          >
            / {maxMoves}
          </div>
          {outOfMoves && (
            <div
              style={{
                fontSize: 7,
                color: colors.status.error,
                letterSpacing: '0.08em',
                marginTop: 2,
                fontWeight: 700,
                animation: 'pulse 1s ease-in-out infinite',
              }}
            >
              NO MOVES
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            fontSize: 8,
            color: colors.text.tertiary,
            letterSpacing: '0.12em',
            marginTop: 2,
          }}
        >
          MOVES
        </div>
      )}
    </div>
  );
}

/**
 * CountdownTimer - Shows seconds until next wall compression
 */
function CountdownTimer({
  seconds,
  active,
  colors,
}: {
  readonly seconds: number;
  readonly active: boolean;
  readonly colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: colors.bg.secondary,
        border: `1px solid ${colors.border.primary}`,
        borderRadius: 10,
        padding: '6px 12px',
        flexShrink: 0,
        minWidth: 54,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: seconds <= 3 && active ? colors.status.error : colors.text.primary,
          transition: 'color 0.2s',
        }}
      >
        {seconds}
      </div>
      <div
        style={{ fontSize: 8, color: colors.text.tertiary, letterSpacing: '0.12em', marginTop: 2 }}
      >
        SEC
      </div>
    </div>
  );
}

/**
 * ScoreDisplay - Shows current score vs target score with a progress bar
 */
function ScoreDisplay({
  score,
  targetScore,
  colors,
}: {
  readonly score: number;
  readonly targetScore?: number;
  readonly colors: ReturnType<typeof useTheme>['colors'];
}) {
  const pct = targetScore ? Math.min((score / targetScore) * 100, 100) : 0;
  const color = getScoreColor(pct);
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          letterSpacing: '0.14em',
          marginBottom: 4,
        }}
      >
        <span style={{ color: '#f472b6', fontWeight: 800 }}>SCORE</span>
        {targetScore !== undefined && targetScore < 99999 && (
          <span style={{ color: colors.text.tertiary }}>TARGET {formatNumber(targetScore)}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color,
            minWidth: 48,
            transition: 'color 0.3s',
          }}
        >
          {formatNumber(score)}
        </div>
        {targetScore !== undefined && targetScore < 99999 && (
          <div
            style={{
              flex: 1,
              height: 6,
              background: colors.bg.tertiary,
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${colors.border.primary}`,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                borderRadius: 4,
                background: `linear-gradient(90deg, #db2777cc, ${color})`,
                transition: 'width 0.4s ease',
                boxShadow: pct > 10 ? `0 0 10px rgba(244,114,182,0.5)` : 'none',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TimeleftDisplay - Countdown timer for time-limited levels (e.g. Frozen world)
 */
function TimeleftDisplay({
  timeLeft,
  timeLimit,
  colors,
}: {
  readonly timeLeft: number;
  readonly timeLimit?: number;
  readonly colors: ReturnType<typeof useTheme>['colors'];
}) {
  const urgent = timeLeft <= 10;
  const pct = timeLimit ? Math.min((timeLeft / timeLimit) * 100, 100) : 100;
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          letterSpacing: '0.14em',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            color: urgent ? colors.status.error : colors.game.hint,
            fontWeight: 800,
            transition: 'color 0.3s',
          }}
        >
          TIME LEFT
        </span>
        {timeLimit !== undefined && (
          <span style={{ color: colors.text.tertiary }}>{timeLimit}s</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: urgent ? colors.status.error : colors.game.hint,
            minWidth: 48,
            transition: 'color 0.3s',
          }}
        >
          {timeLeft}
        </div>
        {timeLimit !== undefined && (
          <div
            style={{
              flex: 1,
              height: 6,
              background: colors.bg.tertiary,
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${colors.border.primary}`,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                borderRadius: 4,
                background: urgent
                  ? `linear-gradient(90deg, ${colors.status.error}80, ${colors.status.error})`
                  : `linear-gradient(90deg, ${colors.game.hint}80, ${colors.game.hint})`,
                transition: 'width 1s linear, background 0.4s',
                boxShadow: getTimeleftGlow(timeLeft, pct),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface GameStatsProps {
  readonly moves: number;
  readonly maxMoves: number;
  readonly compressionPercent: number;
  readonly compressionActive: boolean;
  readonly countdownSeconds: number;
  readonly currentModeId: string;
  readonly score?: number;
  readonly targetScore?: number;
  readonly timeLeft?: number;
  readonly timeLimit?: number;
  readonly statsDisplayOverride?: StatComponentConfig[];
  readonly isPaused?: boolean;
  readonly isEditor?: boolean;
}

/**
 * GameStats - Combined stats display (moves, compression bar, countdown)
 */
export default function GameStats({
  moves,
  maxMoves,
  compressionPercent,
  compressionActive,
  countdownSeconds,
  currentModeId,
  score = 0,
  targetScore,
  timeLeft = 0,
  timeLimit,
  statsDisplayOverride,
  isPaused = false,
  isEditor = false,
}: GameStatsProps) {
  const { colors } = useTheme();
  // Ensure score is always a valid number (guard against NaN/undefined)
  const safeScore = Number.isFinite(score) ? score : 0;
  const safeTimeLeft = Number.isFinite(timeLeft) ? timeLeft : 0;
  const activeMode = getModeById(currentModeId);
  const statsDisplay = statsDisplayOverride ??
    activeMode.statsDisplay ?? [
      { type: 'moves' },
      { type: 'compressionBar' },
      { type: 'countdown' },
    ];

  // In editor mode, show a simplified editor stats bar instead of game stats
  if (isEditor) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          width: '100%',
          maxWidth: 400,
          marginBottom: 12,
          position: 'relative',
          zIndex: 1,
          padding: '8px 16px',
          background: '#a855f708',
          border: '1px solid #a855f730',
          borderRadius: 12,
        }}
      >
        <span style={{ fontSize: 14, color: '#a855f7' }}>🛠️</span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#a855f7' }}>
          LEVEL EDITOR
        </span>
        <span style={{ fontSize: 10, color: '#6b21a8' }}>|</span>
        <span style={{ fontSize: 11, color: '#c084fc' }}>
          Grid: {maxMoves}×{maxMoves}
        </span>
        <span style={{ fontSize: 10, color: '#6b21a8' }}>|</span>
        <span style={{ fontSize: 10, color: colors.text.tertiary }}>Tap tiles to edit</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        maxWidth: 400,
        marginBottom: 12,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Paused indicator */}
      {isPaused && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `${colors.status.warning}15`,
            border: `1px solid ${colors.status.warning}50`,
            borderRadius: 8,
            padding: '4px 12px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: colors.status.warning,
            zIndex: 10,
            animation: 'pulse 1s ease-in-out infinite',
          }}
        >
          ⏸ PAUSED
        </div>
      )}
      {statsDisplay.map((stat: StatComponentConfig) => {
        switch (stat.type) {
          case 'moves':
            return <MovesCounter key="moves" moves={moves} maxMoves={maxMoves} colors={colors} />;
          case 'compressionBar':
            return (
              <CompressionBar
                key="compressionBar"
                percent={compressionPercent}
                active={compressionActive}
                colors={colors}
              />
            );
          case 'countdown':
            return (
              <CountdownTimer
                key="countdown"
                seconds={countdownSeconds}
                active={compressionActive}
                colors={colors}
              />
            );
          case 'score':
            return (
              <ScoreDisplay
                key="score"
                score={safeScore}
                targetScore={targetScore}
                colors={colors}
              />
            );
          case 'timeleft':
            return (
              <TimeleftDisplay
                key="timeleft"
                timeLeft={safeTimeLeft}
                timeLimit={timeLimit}
                colors={colors}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
