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
        }}
      >
        {moves}
      </div>
      <div style={{ fontSize: 8, color: '#3a3a55', letterSpacing: '0.12em', marginTop: 2 }}>
        / {maxMoves}
      </div>
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

interface GameStatsProps {
  moves: number;
  maxMoves: number;
  compressionPercent: number;
  compressionActive: boolean;
  countdownSeconds: number;
  currentModeId: string; // Add this prop
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
  currentModeId, // Destructure the new prop
}: GameStatsProps) {
  const activeMode = getModeById(currentModeId);
  const statsDisplay = activeMode.statsDisplay || [
    { type: 'moves' },
    { type: 'compressionBar' },
    { type: 'countdown' },
  ]; // Default to all if not specified

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
          default:
            return null; // Should not happen with type checking
        }
      })}
    </div>
  );
}
