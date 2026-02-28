// PRESSURE - Stats Screen
// Full-screen stats view, navigated to from the menu footer.
// Reads directly from the stats backend — no Zustand dependency.

import { useMemo } from 'react';
import { statsEngine } from '@/game/stats';
import type { GameEndEvent } from '@/game/stats/types';
import { GAME_MODES } from '@/game/modes';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ── styles ───────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: '#07070e',
  border: '1px solid #12122a',
  borderRadius: 14,
  padding: '14px 16px',
};

const label: React.CSSProperties = {
  fontSize: 10,
  color: '#25253a',
  letterSpacing: '0.2em',
  marginBottom: 4,
};

const big: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: '-0.03em',
  lineHeight: 1,
};

/* ── component ────────────────────────────────────────────────────────────── */

export default function StatsScreen({
  onBack,
  onReplay,
}: {
  readonly onBack: () => void;
  readonly onReplay?: (event: GameEndEvent) => void;
}) {
  const stats = useMemo(() => {
    const all = statsEngine.getBackend().getAll();
    const ends = all.filter((e): e is GameEndEvent => e.type === 'game_end');

    const totalGames = ends.length;
    const totalWins = ends.filter((e) => e.outcome === 'won').length;
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    const totalSeconds = ends.reduce((s, e) => s + e.elapsedSeconds, 0);

    const byMode = GAME_MODES.map((mode) => {
      const me = ends.filter((e) => e.modeId === mode.id);
      const mw = me.filter((e) => e.outcome === 'won').length;
      return {
        mode,
        games: me.length,
        wins: mw,
        winRate: me.length > 0 ? Math.round((mw / me.length) * 100) : 0,
      };
    }).filter((m) => m.games > 0);

    const recent = [...ends].reverse().slice(0, 10);

    return { totalGames, totalWins, winRate, totalSeconds, byMode, recent };
  }, []);

  const isEmpty = stats.totalGames === 0;

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
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em' }}>STATS</div>
          <div style={{ fontSize: 10, color: '#3a3a55', letterSpacing: '0.15em', marginTop: 1 }}>
            ALL TIME
          </div>
        </div>
      </header>

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
            padding: '20px 16px max(24px, env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {isEmpty ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 0',
                color: '#25253a',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              Play some levels to see your stats here.
            </div>
          ) : (
            <>
              {/* ── summary row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div style={{ ...card, textAlign: 'center' }}>
                  <div style={label}>GAMES</div>
                  <div style={big}>{stats.totalGames}</div>
                </div>
                <div style={{ ...card, textAlign: 'center' }}>
                  <div style={label}>WIN RATE</div>
                  <div style={{ ...big, color: stats.winRate >= 50 ? '#22c55e' : '#ef4444' }}>
                    {stats.winRate}%
                  </div>
                </div>
                <div style={{ ...card, textAlign: 'center' }}>
                  <div style={label}>TIME</div>
                  <div style={big}>{fmtTime(stats.totalSeconds)}</div>
                </div>
              </div>

              {/* ── wins / losses ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 20 }}>✦</div>
                  <div>
                    <div style={label}>WINS</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e' }}>
                      {stats.totalWins}
                    </div>
                  </div>
                </div>
                <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 20 }}>✕</div>
                  <div>
                    <div style={label}>LOSSES</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>
                      {stats.totalGames - stats.totalWins}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── by mode ── */}
              {stats.byMode.length > 0 && (
                <div>
                  <div style={{ ...label, marginBottom: 10 }}>BY MODE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.byMode.map(({ mode, games, wins, winRate }) => (
                      <div
                        key={mode.id}
                        style={{
                          ...card,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div style={{ fontSize: 22, flexShrink: 0 }}>{mode.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                            {mode.name}
                          </div>
                          {/* win bar */}
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
                                width: `${winRate}%`,
                                background: mode.color,
                                borderRadius: 2,
                                transition: 'width 0.5s ease',
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: mode.color }}>
                            {winRate}%
                          </div>
                          <div style={{ fontSize: 10, color: '#3a3a55' }}>
                            {wins}/{games}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── recent games ── */}
              {stats.recent.length > 0 && (
                <div>
                  <div style={{ ...label, marginBottom: 10 }}>RECENT GAMES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stats.recent.map((e, i) => {
                      const mode = GAME_MODES.find((m) => m.id === e.modeId);
                      const won = e.outcome === 'won';
                      const hasReplay = onReplay && e.moveLog && e.moveLog.length > 0;
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            background: '#07070e',
                            borderRadius: 10,
                            border: `1px solid ${won ? '#22c55e20' : '#ef444420'}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: won ? '#22c55e' : '#ef4444',
                              width: 14,
                              flexShrink: 0,
                            }}
                          >
                            {won ? '✦' : '✕'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              {mode?.icon} {mode?.name ?? e.modeId} · Lv {e.levelId}
                            </div>
                            <div style={{ fontSize: 10, color: '#3a3a55', marginTop: 1 }}>
                              {e.moves} {e.moves === 1 ? 'move' : 'moves'} ·{' '}
                              {fmtTime(e.elapsedSeconds)}
                              {e.score > 0 ? ` · ${e.score} pts` : ''}
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: '#25253a', flexShrink: 0 }}>
                            {fmtDate(e.ts)}
                          </div>
                          {hasReplay && (
                            <button
                              onClick={() => onReplay(e)}
                              title="Watch replay"
                              style={{
                                width: 32,
                                height: 28,
                                borderRadius: 8,
                                border: '1px solid #1e1e3580',
                                background: 'rgba(165,180,252,0.07)',
                                color: '#a5b4fc',
                                cursor: 'pointer',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              ▶
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── clear data ── */}
              <button
                onClick={() => {
                  if (confirm('Clear all stats? This cannot be undone.')) {
                    statsEngine.getBackend().clear();
                    // force re-mount by popping back and letting parent re-open if needed
                    onBack();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: '1.5px solid #ef444430',
                  background: 'rgba(239,68,68,0.04)',
                  color: '#ef444460',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                CLEAR ALL DATA
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
