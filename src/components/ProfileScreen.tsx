/**
 * User Profile Screen
 * Displays user stats, achievements, and leaderboard position
 */

import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useGameStore } from '@/game/store';
import { getUserProfile, getLeaderboard, getUserAchievements } from '@/game/api/leaderboards';

interface UserStats {
  userId: string;
  username?: string;
  totalScore: number;
  levelsCompleted: number;
  achievements: Array<{ id: string; name: string; icon: string; unlockedAt: string }>;
  rankings: Record<string, number>; // mode -> rank
}

interface ProfileScreenProps {
  userId?: string;
  onClose?: () => void;
}

export default function ProfileScreen({ userId: propUserId, onClose }: ProfileScreenProps) {
  const { colors } = useTheme();
  const closeArcadeHub = useGameStore((s) => s.closeArcadeHub);
  const closeProfile = onClose || closeArcadeHub;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userId = propUserId || localStorage.getItem('pressure_user_id') || 'anonymous';

        // Fetch user profile
        const profile = await getUserProfile(userId);
        if (!profile) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        // Fetch achievements
        const achievements = await getUserAchievements(userId);

        // Fetch rankings for each mode
        const modes = ['classic', 'blitz', 'zen', 'candy', 'shoppingSpree', 'gemBlast'];
        const rankings: Record<string, number> = {};

        for (const mode of modes) {
          const leaderboard = await getLeaderboard(mode, 100);
          const rank = leaderboard.findIndex((entry) => (entry.userId || entry.user_id) === userId);
          if (rank >= 0) rankings[mode] = rank + 1;
        }

        setUserStats({
          userId,
          username: profile.username || userId,
          totalScore: profile.totalScore || 0,
          levelsCompleted: profile.levelsCompleted || 0,
          achievements: achievements,
          rankings,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [propUserId]);

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: colors.game.header,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.tertiary,
        }}
      >
        Loading profile...
      </div>
    );
  }

  if (error || !userStats) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: colors.game.header,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.status.error,
          gap: 20,
        }}
      >
        <div>{error || 'Profile not available'}</div>
        <button
          onClick={closeProfile}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: `1px solid ${colors.border.primary}`,
            background: colors.bg.tertiary,
            color: colors.text.primary,
            cursor: 'pointer',
            minHeight: 'unset',
            minWidth: 'unset',
          }}
        >
          Back
        </button>
      </div>
    );
  }

  const modeColors: Record<string, string> = {
    classic: '#6366f1',
    blitz: '#f59e0b',
    zen: '#10b981',
    candy: '#f472b6',
    shoppingSpree: '#ec4899',
    gemBlast: '#06b6d4',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: colors.game.header,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          borderBottom: `1px solid ${colors.border.primary}`,
        }}
      >
        <button
          onClick={closeProfile}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `1.5px solid ${colors.border.secondary}`,
            background: colors.bg.tertiary,
            color: colors.status.info,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            minHeight: 'unset',
            minWidth: 'unset',
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.text.primary }}>
            {userStats.username}
          </div>
          <div style={{ fontSize: 10, color: colors.text.tertiary }}>Profile</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Stats Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: '12px',
              background: colors.bg.secondary,
              borderRadius: 8,
              border: `1px solid ${colors.border.primary}`,
            }}
          >
            <div style={{ fontSize: 10, color: colors.text.tertiary }}>Total Score</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>
              {userStats.totalScore.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              padding: '12px',
              background: colors.bg.secondary,
              borderRadius: 8,
              border: `1px solid ${colors.border.primary}`,
            }}
          >
            <div style={{ fontSize: 10, color: colors.text.tertiary }}>Levels Done</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>
              {userStats.levelsCompleted}
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div>
          <div
            style={{ fontSize: 12, fontWeight: 800, color: colors.text.tertiary, marginBottom: 8 }}
          >
            RANKINGS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(modeColors).map(([mode, color]) => {
              const rank = userStats.rankings[mode];
              return (
                <div
                  key={mode}
                  style={{
                    padding: '8px 12px',
                    background: colors.bg.secondary,
                    borderRadius: 6,
                    border: `1px solid ${color}40`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: color }}>
                    {rank ? `#${rank}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div
            style={{ fontSize: 12, fontWeight: 800, color: colors.text.tertiary, marginBottom: 8 }}
          >
            ACHIEVEMENTS ({userStats.achievements.length})
          </div>
          {userStats.achievements.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {userStats.achievements.map((ach) => (
                <div
                  key={ach.id}
                  style={{
                    padding: '8px',
                    background: colors.bg.secondary,
                    borderRadius: 6,
                    border: `1px solid #22c55e40`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 20 }}>{ach.icon}</div>
                  <div style={{ fontSize: 9, textAlign: 'center', color: colors.text.tertiary }}>
                    {ach.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: colors.text.tertiary, fontSize: 12 }}>No achievements yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
