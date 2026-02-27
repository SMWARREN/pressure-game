/**
 * AchievementsScreen - Full-screen view of all achievements
 * Shows earned/unearned achievements with progress bars and total points
 */

import { useMemo } from 'react';
import { getAchievementEngine } from '@/game/achievements/engine';
import { Achievement, AchievementCategory, AchievementRarity } from '@/game/achievements/types';

/* ── styles ───────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: '#07070e',
  borderRadius: 14,
  padding: '14px 16px',
};

const label: React.CSSProperties = {
  fontSize: 10,
  color: '#25253a',
  letterSpacing: '0.2em',
  marginBottom: 8,
};

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
  achievement: Achievement;
  progress: { current: number; target: number; earned: boolean; earnedAt?: number } | undefined;
}

function AchievementCard({ achievement, progress }: AchievementCardProps) {
  const isEarned = progress?.earned ?? false;
  const isHidden = achievement.hidden && !isEarned;
  const color = rarityColors[achievement.rarity];
  const pct = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 0;

  // Hidden achievements show a mystery card
  if (isHidden) {
    return (
      <div
        style={{
          ...card,
          border: '1px solid #12122a',
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
            background: '#12122a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          ❓
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#3a3a55' }}>???</div>
          <div style={{ fontSize: 11, color: '#25253a', marginTop: 4 }}>Hidden achievement</div>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: '#12122a',
            fontSize: 10,
            fontWeight: 700,
            color: '#3a3a55',
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
        border: isEarned ? `1px solid ${color}40` : '1px solid #12122a',
        background: isEarned ? `linear-gradient(145deg, ${color}08 0%, #07070e 100%)` : '#07070e',
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
          background: isEarned ? `${color}15` : '#12122a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          filter: isEarned ? `drop-shadow(0 0 8px ${color}60)` : 'none',
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
              color: isEarned ? '#fff' : '#6b7280',
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
            color: isEarned ? '#9ca3af' : '#4b5563',
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
                background: '#0d0d1f',
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
                color: '#3a3a55',
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
          <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>
            Earned {new Date(progress.earnedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Points badge */}
      <div
        style={{
          padding: '6px 12px',
          borderRadius: 10,
          background: isEarned ? `${color}20` : '#12122a',
          border: isEarned ? `1px solid ${color}40` : '1px solid transparent',
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

export default function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const engine = getAchievementEngine();

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
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #0f0f28 0%, #06060f 70%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── header ─────────────────────────────────────────────── */}
      <header
        style={{
          width: '100%',
          flexShrink: 0,
          borderBottom: '1px solid #12122a',
          background: 'rgba(6,6,15,0.75)',
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
            border: '1px solid #12122a',
            background: 'rgba(255,255,255,0.02)',
            color: '#a5b4fc',
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
          <div style={{ fontSize: 10, color: '#3a3a55', letterSpacing: '0.15em', marginTop: 1 }}>
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
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{totalPoints}</div>
          <div style={{ fontSize: 8, color: '#fbbf2480', letterSpacing: '0.1em' }}>POINTS</div>
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
            color: '#25253a',
            marginBottom: 6,
          }}
        >
          <span>OVERALL PROGRESS</span>
          <span>{overallPct}%</span>
        </div>
        <div style={{ height: 6, background: '#0d0d1f', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${overallPct}%`,
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
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
          {(
            ['progression', 'skill', 'dedication', 'special'] as AchievementCategory[]
          ).map((category) => {
            const categoryAchievements = byCategory[category];
            if (categoryAchievements.length === 0) return null;

            const categoryEarned = categoryAchievements.filter(
              (a) => engine.getProgress(a.id)?.earned
            ).length;

            return (
              <div key={category}>
                <div
                  style={{
                    ...label,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{categoryIcons[category]}</span>
                  <span>{categoryLabels[category]}</span>
                  <span style={{ color: '#3a3a55' }}>
                    ({categoryEarned}/{categoryAchievements.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {categoryAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      progress={engine.getProgress(achievement.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}