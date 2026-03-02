/**
 * AchievementsScreen - Full-screen view of all achievements
 * Shows earned/unearned achievements with progress bars and total points
 */

import { useMemo } from 'react';
import { useAchievements } from '@/game/contexts';
import { useTheme } from '@/hooks/useTheme';
import { Achievement, AchievementCategory, AchievementRarity } from '@/game/achievements/types';

/* ── styles ───────────────────────────────────────────────────────────────── */
// Styles now created dynamically in component

const rarityColors: Record<AchievementRarity, string> = {
  common: '#22c55e',
  uncommon: '#3b82f6',
  rare: '#a855f7',
  legendary: '#f59e0b',
};

const categoryIcons: Record<AchievementCategory, string> = {
  progression: '📈',
  skill: '🎯',
  dedication: '📅',
  special: '⭐',
};

const categoryLabels: Record<AchievementCategory, string> = {
  progression: 'PROGRESSION',
  skill: 'SKILL',
  dedication: 'DEDICATION',
  special: 'SPECIAL',
};

/* ── achievement card component ───────────────────────────────────────────── */

interface AchievementCardProps {
  readonly achievement: Achievement;
  readonly progress:
    | { current: number; target: number; earned: boolean; earnedAt?: number }
    | undefined;
  readonly colors: ReturnType<typeof useTheme>['colors'];
  readonly card: React.CSSProperties;
}

function AchievementCard({ achievement, progress, colors, card }: AchievementCardProps) {
  const isEarned = progress?.earned ?? false;
  const isHidden = achievement.hidden && !isEarned;
  const color = rarityColors[achievement.rarity];
  const pct = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 0;

  // Extract conditional styles for earned achievements (S3358: reduce nested ternaries)
  const cardStyles = isEarned
    ? {
        border: `1px solid ${color}40`,
        background: `linear-gradient(145deg, ${color}08 0%, #07070e 100%)`,
      }
    : { border: '1px solid #12122a', background: '#07070e' };

  const iconStyles = isEarned
    ? { background: `${color}15`, filter: `drop-shadow(0 0 8px ${color}60)` }
    : { background: '#12122a', filter: 'none' };

  const badgeStyles = isEarned
    ? { background: `${color}20`, border: `1px solid ${color}40` }
    : { background: '#12122a', border: '1px solid transparent' };

  // Hidden achievements show a mystery card
  if (isHidden) {
    return (
      <div
        style={{
          ...card,
          border: `1px solid ${colors.border.primary}`,
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: colors.border.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          ❓
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: colors.text.tertiary }}>???</div>
          <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 4 }}>Hidden achievement</div>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: colors.border.primary,
            fontSize: 10,
            fontWeight: 700,
            color: colors.text.tertiary,
          }}
        >
          ???
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...card,
        ...cardStyles,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'all 0.2s',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          ...iconStyles,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {achievement.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 2,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: isEarned ? colors.text.primary : colors.text.secondary,
            }}
          >
            {achievement.name}
          </div>
          {isEarned && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: color,
                letterSpacing: '0.1em',
              }}
            >
              ✓
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: isEarned ? colors.text.secondary : colors.text.tertiary,
            marginBottom: 8,
          }}
        >
          {achievement.description}
        </div>

        {/* Progress bar */}
        {!isEarned && progress && (
          <div>
            <div
              style={{
                height: 4,
                background: colors.bg.tertiary,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}80)`,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 10,
                color: colors.text.tertiary,
                marginTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{progress.current}</span>
              <span>{progress.target}</span>
            </div>
          </div>
        )}

        {/* Earned date */}
        {isEarned && progress?.earnedAt && (
          <div style={{ fontSize: 10, color: colors.text.tertiary, marginTop: 4 }}>
            Earned {new Date(progress.earnedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Points badge */}
      <div
        style={{
          padding: '6px 12px',
          borderRadius: 10,
          ...badgeStyles,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: isEarned ? color : '#3a3a55',
          }}
        >
          {achievement.points}
        </div>
        <div style={{ fontSize: 8, color: isEarned ? color : '#25253a', letterSpacing: '0.1em' }}>
          PTS
        </div>
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────────── */

type AchievementsScreenProps = { readonly onBack: () => void };

export default function AchievementsScreen({ onBack }: AchievementsScreenProps) {
  const { colors } = useTheme();
  const engine = useAchievements();

  // Dynamic styles based on theme
  const cardStyle: React.CSSProperties = {
    background: colors.bg.secondary,
    borderRadius: 14,
    padding: '14px 16px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: '0.2em',
    marginBottom: 8,
  };

  const { achievements, earnedCount, totalPoints, maxPoints, byCategory } = useMemo(() => {
    const all = engine.getAllAchievements();
    const earned = engine.getEarnedAchievements();
    const total = engine.getTotalPoints();

    // Calculate max possible points
    const max = all.reduce((sum, a) => sum + a.points, 0);

    // Group by category
    const categories: Record<AchievementCategory, Achievement[]> = {
      progression: [],
      skill: [],
      dedication: [],
      special: [],
    };

    for (const a of all) {
      categories[a.category].push(a);
    }

    return {
      achievements: all,
      earnedCount: earned.length,
      totalPoints: total,
      maxPoints: max,
      byCategory: categories,
    };
  }, [engine]);

  const overallPct = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

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
      {/* ── header ─────────────────────────────────────────────── */}
      <header
        style={{
          width: '100%',
          flexShrink: 0,
          borderBottom: `1px solid ${colors.border.primary}`,
          background: colors.game.footer,
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 'max(14px, env(safe-area-inset-top)) 16px 14px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: `1px solid ${colors.border.primary}`,
            background: 'rgba(255,255,255,0.02)',
            color: colors.status.info,
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em' }}>
            ACHIEVEMENTS
          </div>
          <div style={{ fontSize: 10, color: colors.text.tertiary, letterSpacing: '0.15em', marginTop: 1 }}>
            {earnedCount}/{achievements.length} EARNED
          </div>
        </div>
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #fbbf2420 0%, #f59e0b10 100%)',
            border: '1px solid #fbbf2440',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900, color: colors.status.warning }}>{totalPoints}</div>
          <div style={{ fontSize: 8, color: `${colors.status.warning}80`, letterSpacing: '0.1em' }}>POINTS</div>
        </div>
      </header>

      {/* ── progress bar ──────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '16px 16px 0',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: colors.text.tertiary,
            marginBottom: 6,
          }}
        >
          <span>OVERALL PROGRESS</span>
          <span>{overallPct}%</span>
        </div>
        <div style={{ height: 6, background: colors.bg.tertiary, borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${overallPct}%`,
              background: `linear-gradient(90deg, ${colors.status.warning}, ${colors.status.warning}80)`,
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* ── scrollable body ────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          width: '100%',
          maxWidth: 420,
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        }}
      >
        <div
          style={{
            padding: '16px 16px max(24px, env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {(['progression', 'skill', 'dedication', 'special'] as AchievementCategory[]).map(
            (category) => {
              const categoryAchievements = byCategory[category];
              if (categoryAchievements.length === 0) return null;

              const categoryEarned = categoryAchievements.filter(
                (a) => engine.getProgress(a.id)?.earned
              ).length;

              return (
                <div key={category}>
                  <div
                    style={{
                      ...labelStyle,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{categoryIcons[category]}</span>
                    <span>{categoryLabels[category]}</span>
                    <span style={{ color: colors.text.tertiary }}>
                      ({categoryEarned}/{categoryAchievements.length})
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categoryAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        progress={engine.getProgress(achievement.id)}
                        colors={colors}
                        card={cardStyle}
                      />
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
