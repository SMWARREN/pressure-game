import { getModeById } from '@/game/modes';
import { StatComponentConfig } from '@/game/modes/types'; // Import the new type
/**
 * CompressionBar - Visual indicator showing wall compression progress
 */
function CompressionBar({ percent, active }: { percent: number; active: boolean }) {
  const color = percent > 66 ? '#ef4444' : percent > 33 ? '#f59e0b' : '#22c55e';
  const glow =
    percent > 66
      ? 'rgba(239,68,68,0.5)'
      : percent > 33
        ? 'rgba(245,158,11,0.4)'
        : 'rgba(34,197,94,0.3)';
  const label = !active
    ? 'WAITING'
    : percent > 66
      ? '⚠ CRITICAL'
      : percent > 33
        ? 'WARNING'
        : 'ACTIVE';

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
        <span style={{ color: '#3a3a55' }}>WALLS</span>
        <span
          style={{ color: active ? color : '#3a3a55', fontWeight: 800, transition: 'color 0.3s' }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: '#080814',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #131325',
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
function MovesCounter({ moves, maxMoves }: { moves: number; maxMoves: number }) {
  const hasLimit = maxMoves && maxMoves > 0;
  const outOfMoves = hasLimit && moves >= maxMoves;
  const color = outOfMoves ? '#ef4444' : '#fff';
  const bgColor = outOfMoves ? 'rgba(239,68,68,0.1)' : '#07070e';
  const borderColor = outOfMoves ? '#ef444460' : '#12122a';

  return (
    <div
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
              color: outOfMoves ? '#ef4444' : '#3a3a55',
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
                color: '#ef4444',
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
            color: '#3a3a55',
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
function CountdownTimer({ seconds, active }: { seconds: number; active: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#07070e',
        border: '1px solid #12122a',
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
          color: seconds <= 3 && active ? '#ef4444' : '#fff',
          transition: 'color 0.2s',
        }}
      >
        {seconds}
      </div>
      <div style={{ fontSize: 8, color: '#3a3a55', letterSpacing: '0.12em', marginTop: 2 }}>
        SEC
      </div>
    </div>
  );
}

/**
 * ScoreDisplay - Shows current score vs target score with a progress bar
 */
function ScoreDisplay({ score, targetScore }: { score: number; targetScore?: number }) {
  const pct = targetScore ? Math.min((score / targetScore) * 100, 100) : 0;
  const color = pct >= 100 ? '#22c55e' : pct > 40 ? '#f472b6' : '#f59e0b';
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
        {targetScore !== undefined && (
          <span style={{ color: '#3a3a55' }}>TARGET {targetScore}</span>
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
          {score}
        </div>
        {targetScore !== undefined && (
          <div
            style={{
              flex: 1,
              height: 6,
              background: '#080814',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid #131325',
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
function TimeleftDisplay({ timeLeft, timeLimit }: { timeLeft: number; timeLimit?: number }) {
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
            color: urgent ? '#ef4444' : '#60a5fa',
            fontWeight: 800,
            transition: 'color 0.3s',
          }}
        >
          TIME LEFT
        </span>
        {timeLimit !== undefined && <span style={{ color: '#3a3a55' }}>{timeLimit}s</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: urgent ? '#ef4444' : '#60a5fa',
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
              background: '#080814',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid #131325',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                borderRadius: 4,
                background: urgent
                  ? 'linear-gradient(90deg, #ef444480, #ef4444)'
                  : 'linear-gradient(90deg, #3b82f680, #60a5fa)',
                transition: 'width 1s linear, background 0.4s',
                boxShadow:
                  pct > 10
                    ? `0 0 10px ${urgent ? 'rgba(239,68,68,0.5)' : 'rgba(96,165,250,0.4)'}`
                    : 'none',
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
          background: 'rgba(168,85,247,0.08)',
          border: '1px solid rgba(168,85,247,0.3)',
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
        <span style={{ fontSize: 10, color: '#3a3a55' }}>Tap tiles to edit</span>
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
            background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.5)',
            borderRadius: 8,
            padding: '4px 12px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: '#fbbf24',
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
            return <MovesCounter key="moves" moves={moves} maxMoves={maxMoves} />;
          case 'compressionBar':
            return (
              <CompressionBar
                key="compressionBar"
                percent={compressionPercent}
                active={compressionActive}
              />
            );
          case 'countdown':
            return (
              <CountdownTimer
                key="countdown"
                seconds={countdownSeconds}
                active={compressionActive}
              />
            );
          case 'score':
            return <ScoreDisplay key="score" score={safeScore} targetScore={targetScore} />;
          case 'timeleft':
            return <TimeleftDisplay key="timeleft" timeLeft={safeTimeLeft} timeLimit={timeLimit} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
