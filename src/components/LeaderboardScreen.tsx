import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { getLeaderboard } from '@/game/api/leaderboards';
import { StarField } from './game/StarField';
import ProfileScreen from './ProfileScreen';
import ReplayOverlay from './game/ReplayOverlay';
import { SyncStatusIndicator } from './game/SyncStatusIndicator';
import { RGBA_COLORS, GAME_MODES } from '@/utils/constants';
import { ReplayEngine } from '@/game/stats/replay';
import type { GameEndEvent } from '@/game/stats/types';

export interface LeaderboardScreenProps {
  readonly onBack: () => void;
}

interface LeaderboardEntry {
  user_id?: string;
  userId?: string;
  username?: string;
  score?: number;
  total_score?: number;
  total_moves?: number;
  level_id?: number;
  levelId?: number;
  created_at?: string;
  createdAt?: string;
}

const PRESSURE_MODES = [
  { id: 'global', label: 'Global', icon: '🌍', color: '#60a5fa' },
  { id: GAME_MODES.CLASSIC, label: 'Pressure', icon: '⚡', color: '#a78bfa' },
  { id: GAME_MODES.BLITZ, label: 'Blitz', icon: '🔥', color: '#f97316' },
  { id: GAME_MODES.ZEN, label: 'Zen', icon: '🧘', color: '#34d399' },
];

function getRankColor(index: number, colors: ReturnType<typeof useTheme>['colors']): string {
  if (index === 0) return '#fbbf24';
  if (index === 1) return '#c0c0c0';
  if (index === 2) return '#cd7f32';
  return colors.text.tertiary;
}

function getRankMedal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}

function LeaderboardRow({
  entry,
  index,
  colors,
  onSelect,
  isGlobal,
}: {
  entry: LeaderboardEntry;
  index: number;
  colors: ReturnType<typeof useTheme>['colors'];
  onSelect: (userId: string) => void;
  isGlobal?: boolean;
}) {
  const rankColor = getRankColor(index, colors);
  const medal = getRankMedal(index);
  const isTopThree = index < 3;

  return (
    <button
      key={`${entry.user_id || entry.userId || 'unknown'}-${index}`}
      onClick={() => {
        const userId = entry.user_id || entry.userId;
        if (userId) onSelect(userId);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px',
        background: isTopThree ? `${rankColor}10` : RGBA_COLORS.TRANSPARENT_WHITE_02,
        border: `1px solid ${isTopThree ? rankColor + '40' : colors.border.primary}`,
        borderRadius: 8,
        transition: 'all 0.2s',
        cursor: 'pointer',
        minHeight: 'unset',
        minWidth: 'unset',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isTopThree
          ? `${rankColor}20`
          : RGBA_COLORS.TRANSPARENT_WHITE_04;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isTopThree
          ? `${rankColor}10`
          : RGBA_COLORS.TRANSPARENT_WHITE_02;
      }}
    >
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
        {isTopThree ? medal : <span style={{ fontSize: 14 }}>{medal}</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.text.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {entry.username || entry.user_id || entry.userId || 'Anonymous'}
        </div>
        {(entry.created_at || entry.createdAt) && (
          <div
            style={{
              fontSize: 10,
              color: colors.text.tertiary,
              marginTop: 2,
            }}
          >
            {new Date(entry.created_at || entry.createdAt!).toLocaleDateString()}
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: 'right',
          minWidth: isGlobal ? 100 : 80,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: rankColor,
          }}
        >
          {isGlobal ? entry.total_score : entry.score}
        </div>
        {isGlobal && (
          <div
            style={{
              fontSize: 10,
              color: colors.text.tertiary,
              marginTop: 2,
            }}
          >
            {entry.total_moves} moves
          </div>
        )}
      </div>
    </button>
  );
}

export default function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const { colors } = useTheme();
  const [selectedMode, setSelectedMode] = useState<string>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replayEvent, setReplayEvent] = useState<GameEndEvent | null>(null);

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
              background: RGBA_COLORS.TRANSPARENT_WHITE_02,
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SyncStatusIndicator />
          </div>
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
              background:
                selectedMode === mode.id ? `${mode.color}20` : RGBA_COLORS.TRANSPARENT_WHITE_02,
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
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: 20,
              background: colors.status.error + '15',
              border: `1px solid ${colors.status.error}40`,
              borderRadius: 8,
              color: colors.status.error,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            <div>{error}</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: colors.status.error,
                color: colors.game.header,
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 'unset',
                minWidth: 'unset',
              }}
            >
              <span style={{ fontSize: 20, marginRight: 8 }}>🔄</span>
              Retry
            </button>
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
            <ProfileScreen
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
              onWatchReplay={(moveLog, mode, levelId) => {
                setSelectedUserId(null);
                setReplayEvent({
                  type: 'game_end',
                  ts: Date.now(),
                  modeId: mode,
                  levelId,
                  sessionId: 'preview',
                  outcome: 'won',
                  score: 0,
                  moves: moveLog.length,
                  elapsedSeconds: 0,
                  moveLog: moveLog,
                  lossReason: null,
                });
              }}
            />
          </div>
        )}

        {!loading &&
          !error &&
          leaderboard.length > 0 &&
          leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={`${entry.user_id || entry.userId || 'unknown'}-${index}`}
              entry={entry}
              index={index}
              colors={colors}
              onSelect={setSelectedUserId}
              isGlobal={selectedMode === 'global'}
            />
          ))}
      </div>

      {/* ── REPLAY OVERLAY ─────────────────────────────────────── */}
      {replayEvent &&
        (() => {
          const level = ReplayEngine.findLevel(replayEvent.levelId);
          if (!level) return null;
          const engine = new ReplayEngine(replayEvent, level);
          return (
            <ReplayOverlay
              event={replayEvent}
              engine={engine}
              onClose={() => setReplayEvent(null)}
            />
          );
        })()}
    </div>
  );
}
