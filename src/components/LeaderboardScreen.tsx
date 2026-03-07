import { useEffect, useState, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { getLeaderboard } from '@/game/api/leaderboards';
import { StarField } from './game/StarField';
import ProfileScreen from './ProfileScreen';

export interface LeaderboardScreenProps {
  readonly onBack: () => void;
}

interface LeaderboardEntry {
  userId: string;
  username?: string;
  score: number;
  levelId?: number;
  createdAt?: string;
}

const PRESSURE_MODES = [
  { id: 'classic', label: 'Pressure', icon: '⚡', color: '#a78bfa' },
  { id: 'blitz', label: 'Blitz', icon: '🔥', color: '#f97316' },
  { id: 'zen', label: 'Zen', icon: '🧘', color: '#34d399' },
];

export default function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const { colors } = useTheme();
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch leaderboard when mode changes
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboard(selectedMode, 50);
        setLeaderboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedMode]);

  const modeConfig = useMemo(
    () => PRESSURE_MODES.find((m) => m.id === selectedMode),
    [selectedMode]
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: colors.game.header,
        color: colors.text.primary,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      <StarField />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        style={{
          width: '100%',
          flexShrink: 0,
          zIndex: 2,
          position: 'relative',
          borderBottom: `1px solid ${colors.border.primary}`,
          background: colors.game.footer,
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'max(16px, env(safe-area-inset-top)) 20px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 600,
          }}
        >
          <button
            onClick={onBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: `1px solid ${colors.border.primary}`,
              background: 'rgba(255,255,255,0.02)',
              color: colors.text.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
            title="Back"
          >
            ←
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div
              style={{
                fontSize: 'clamp(1.5rem, 8vw, 2.5rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              🏆 LEADERBOARDS
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
            }}
          />
        </div>
      </header>

      {/* ── MODE SELECTOR ──────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: 420,
          flexShrink: 0,
          background: colors.game.footer,
          borderBottom: `1px solid ${colors.border.primary}`,
          zIndex: 2,
          position: 'relative',
          gap: 6,
          padding: '8px 12px',
          justifyContent: 'center',
        }}
      >
        {PRESSURE_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            style={{
              flex: 1,
              maxWidth: 120,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${selectedMode === mode.id ? mode.color : colors.border.primary}`,
              background: selectedMode === mode.id ? `${mode.color}20` : 'rgba(255,255,255,0.02)',
              color: selectedMode === mode.id ? mode.color : colors.text.primary,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* ── LEADERBOARD CONTENT ────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 600,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px',
          gap: 8,
        }}
      >
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: colors.text.tertiary,
              fontSize: 14,
            }}
          >
            Loading leaderboard...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 16,
              background: colors.status.error + '15',
              border: `1px solid ${colors.status.error}40`,
              borderRadius: 8,
              color: colors.status.error,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: colors.text.tertiary,
              fontSize: 14,
            }}
          >
            No scores yet. Be the first!
          </div>
        )}

        {selectedUserId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
            }}
          >
            <ProfileScreen />
          </div>
        )}

        {!loading &&
          !error &&
          leaderboard.length > 0 &&
          leaderboard.map((entry, index) => {
            const getRankColor = () => {
              if (index === 0) return '#fbbf24';
              if (index === 1) return '#c0c0c0';
              if (index === 2) return '#cd7f32';
              return colors.text.tertiary;
            };
            const rankColor = getRankColor();
            return (
              <button
                key={`${entry.userId}-${index}`}
                onClick={() => setSelectedUserId(entry.userId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px',
                  background: index < 3 ? `${rankColor}10` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${index < 3 ? rankColor + '40' : colors.border.primary}`,
                  borderRadius: 8,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  minHeight: 'unset',
                  minWidth: 'unset',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    index < 3 ? `${rankColor}20` : 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    index < 3 ? `${rankColor}10` : 'rgba(255,255,255,0.02)';
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    minWidth: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    color: rankColor,
                  }}
                >
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && <span style={{ fontSize: 14 }}>#{index + 1}</span>}
                </div>

                {/* Username */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.username || entry.userId || 'Anonymous'}
                  </div>
                  {entry.createdAt && (
                    <div
                      style={{
                        fontSize: 10,
                        color: colors.text.tertiary,
                        marginTop: 2,
                      }}
                    >
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div
                  style={{
                    textAlign: 'right',
                    minWidth: 80,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: modeConfig?.color,
                    }}
                  >
                    {entry.score}
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
