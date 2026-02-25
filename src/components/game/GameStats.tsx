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
 */
function MovesCounter({ moves, maxMoves }: { moves: number; maxMoves: number }) {
  const outOfMoves = moves >= maxMoves;
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
        minWidth: 54,
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
  moves: number;
  maxMoves: number;
  compressionPercent: number;
  compressionActive: boolean;
  countdownSeconds: number;
  currentModeId: string;
  score?: number;
  targetScore?: number;
  timeLeft?: number;
  timeLimit?: number;
  statsDisplayOverride?: StatComponentConfig[];
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
