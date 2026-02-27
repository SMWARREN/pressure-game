/**
 * AchievementToast - Shows a popup when an achievement is earned
 */

import { useState, useEffect } from 'react';
import { getAchievementEngine } from '@/game/achievements/engine';

interface AchievementToastProps {
  achievementId: string;
  onClose: () => void;
}

function AchievementToast({ achievementId, onClose }: AchievementToastProps) {
  const engine = getAchievementEngine();
  const achievement = engine.getAchievement(achievementId);

  if (!achievement) return null;

  const rarityColors: Record<string, string> = {
    common: '#22c55e',
    uncommon: '#3b82f6',
    rare: '#a855f7',
    legendary: '#f59e0b',
  };

  const color = rarityColors[achievement.rarity] || '#22c55e';

  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(20px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)',
        border: `2px solid ${color}`,
        borderRadius: 16,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: `0 4px 24px ${color}40`,
        zIndex: 2000,
        animation: 'achievementSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        style={{
          fontSize: 32,
          filter: `drop-shadow(0 0 8px ${color}80)`,
        }}
      >
        {achievement.icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 10,
            color: color,
            letterSpacing: '0.15em',
            fontWeight: 800,
          }}
        >
          ACHIEVEMENT UNLOCKED
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginTop: 2 }}>
          {achievement.name}
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          {achievement.description}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: `1px solid ${color}40`,
          background: 'transparent',
          color: color,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ✓
      </button>
    </div>
  );
}

// Inject animation styles
let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.textContent = `
    @keyframes achievementSlideIn {
      0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.9); }
      100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(el);
}

/**
 * AchievementToastContainer - Manages showing achievement toasts
 */
export function AchievementToastContainer() {
  const [toasts, setToasts] = useState<string[]>([]);

  useEffect(() => {
    ensureStyles();
    const engine = getAchievementEngine();

    const checkRecent = () => {
      const recent = engine.getRecentlyEarned();
      if (recent.length > 0) {
        setToasts((prev) => [...prev, ...recent]);
      }
    };

    // Check on mount
    checkRecent();

    // Subscribe to achievement updates
    const unsubscribe = engine.subscribe(checkRecent);

    // Poll for new achievements (fallback)
    const interval = setInterval(checkRecent, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t !== id));
  };

  return (
    <>
      {toasts.map((id, index) => (
        <div
          key={id}
          style={{
            position: 'fixed',
            top: `calc(max(20px, env(safe-area-inset-top)) + ${index * 90}px)`,
            left: 0,
            right: 0,
            zIndex: 2000 + index,
          }}
        >
          <AchievementToast achievementId={id} onClose={() => removeToast(id)} />
        </div>
      ))}
    </>
  );
}

export default AchievementToast;
