/**
 * AchievementToast - Shows a popup when an achievement is earned
 */

import { useState, useEffect } from 'react';
import { useAchievements } from '@/game/contexts';

interface AchievementToastProps {
  readonly achievementId: string;
  readonly onClose: () => void;
}

function AchievementToast({ achievementId, onClose }: AchievementToastProps) {
  const engine = useAchievements();
  const achievement = engine.getAchievement(achievementId);

  // Auto-close after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

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
  if (stylesInjected || !globalThis.document) return;
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
 * BatchAchievementCard - Shows multiple grouped achievements with auto-close
 */
function BatchAchievementCard({ batch, batchIndex, onClose }: { batch: string[]; batchIndex: number; onClose: () => void }) {
  const engine = useAchievements();

  // Auto-close: 4 sec for single, 6 sec for 2-3, 8 sec for 4+
  useEffect(() => {
    const duration = batch.length === 1 ? 4000 : batch.length <= 3 ? 6000 : 8000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [batch.length, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(20px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)',
        border: '2px solid #f59e0b',
        borderRadius: 16,
        padding: '16px 20px',
        maxWidth: 'min(90vw, 400px)',
        boxShadow: '0 4px 24px #f59e0b40',
        zIndex: 2000 + batchIndex,
        animation: 'achievementSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#f59e0b', letterSpacing: '0.15em', fontWeight: 800 }}>
          ✨ {batch.length} ACHIEVEMENT{batch.length > 1 ? 'S' : ''} UNLOCKED
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #f59e0b40',
            background: 'transparent',
            color: '#f59e0b',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ✓
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {batch.map((id) => {
          const achievement = engine.getAchievement(id);
          if (!achievement) return null;
          const rarityColors: Record<string, string> = {
            common: '#22c55e',
            uncommon: '#3b82f6',
            rare: '#a855f7',
            legendary: '#f59e0b',
          };
          const color = rarityColors[achievement.rarity] || '#22c55e';
          return (
            <div key={id} style={{ borderLeft: `2px solid ${color}`, paddingLeft: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: color }}>
                {achievement.icon} {achievement.name}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                {achievement.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * AchievementToastContainer - Manages showing achievement toasts (grouped by batch)
 */
export function AchievementToastContainer() {
  const [batches, setBatches] = useState<string[][]>([]);
  const engine = useAchievements();

  useEffect(() => {
    ensureStyles();

    let batchQueue: string[] = [];
    let batchTimer: ReturnType<typeof setTimeout> | null = null;

    const flushBatch = () => {
      if (batchQueue.length > 0) {
        setBatches((prev) => [...prev, [...batchQueue]]);
        batchQueue = [];
      }
      batchTimer = null;
    };

    const checkRecent = () => {
      const recent = engine.getRecentlyEarned();
      if (recent.length > 0) {
        // Add to current batch
        batchQueue.push(...recent);

        // Clear existing timer
        if (batchTimer) clearTimeout(batchTimer);

        // Wait 200ms for more achievements, then flush batch
        batchTimer = setTimeout(flushBatch, 200);
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
      if (batchTimer) clearTimeout(batchTimer);
    };
  }, []);

  const removeBatch = (index: number) => {
    setBatches((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {batches.map((batch, batchIndex) => (
        <div key={batchIndex} style={{ position: 'fixed', left: 0, right: 0, zIndex: 2000 + batchIndex }}>
          <BatchAchievementCard batch={batch} batchIndex={batchIndex} onClose={() => removeBatch(batchIndex)} />
        </div>
      ))}
    </>
  );
}

export default AchievementToast;
