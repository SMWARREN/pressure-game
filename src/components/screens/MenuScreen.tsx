import { useEffect, useMemo, useState } from 'react';
import { Level } from '@/game/types';
import { GameEndEvent } from '@/game/stats/types';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';
import { getModeById } from '@/game/modes';
import { ReplayEngine } from '@/game/stats/replay';
import { statsEngine } from '@/game/stats';
import { getUnlimitedHighScores } from '@/game/unlimited';
import { StarField } from '../game/StarField';
import ModeSelectorModal from '../ModeSelectorModal';
import StatsScreen from '../StatsScreen';
import AchievementsScreen from '../AchievementsScreen';
import ReplayOverlay from '../game/ReplayOverlay';
import { SettingsPanel } from '../modals/SettingsPanel';
import { LevelGeneratorPanel } from '../modals/LevelGeneratorPanel';

export interface MenuScreenProps {
  readonly onLevelSelected?: () => void;
}

export function MenuScreen({ onLevelSelected }: MenuScreenProps) {
  const {
    completedLevels,
    bestMoves,
    loadLevel,
    currentModeId,
    setGameMode,
    animationsEnabled,
    toggleAnimations,
    replayTutorial,
    replayWalkthrough,
    generatedLevels,
    selectedWorld,
    setSelectedWorld,
    lastPlayedLevelId,
  } = useGameStore(
    useShallow((s) => ({
      completedLevels: s.completedLevels,
      bestMoves: s.bestMoves,
      loadLevel: s.loadLevel,
      currentModeId: s.currentModeId,
      setGameMode: s.setGameMode,
      animationsEnabled: s.animationsEnabled,
      toggleAnimations: s.toggleAnimations,
      replayTutorial: s.replayTutorial,
      replayWalkthrough: s.replayWalkthrough,
      generatedLevels: s.generatedLevels,
      selectedWorld: s.selectedWorld,
      setSelectedWorld: s.setSelectedWorld,
      lastPlayedLevelId: s.lastPlayedLevelId,
    }))
  );
  const [view, setView] = useState<'levels' | 'workshop'>('levels');
  const world = selectedWorld;
  const [showModeModal, setShowModeModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [replayEventFromStats, setReplayEventFromStats] = useState<GameEndEvent | null>(null);

  const activeMode = getModeById(currentModeId);
  const levels = activeMode.getLevels();

  // Reset world + view when the active mode changes
  useEffect(() => {
    const lastPlayedId = lastPlayedLevelId[currentModeId];
    if (lastPlayedId) {
      const lastPlayedLevel = levels.find((l) => l.id === lastPlayedId);
      if (lastPlayedLevel) {
        setSelectedWorld(lastPlayedLevel.world);
        if (!activeMode.supportsWorkshop) setView('levels');
        return;
      }
    }
    setSelectedWorld(activeMode.worlds[0]?.id ?? 1);
    if (!activeMode.supportsWorkshop) setView('levels');
  }, [currentModeId]);

  const worldMap = new Map(activeMode.worlds.map((w) => [w.id, w]));

  // Unlimited levels count as done when the player has any high score
  const unlimitedHighScores = getUnlimitedHighScores();
  const isLevelDone = (level: Level) =>
    completedLevels.includes(level.id) ||
    !!(level.isUnlimited && (unlimitedHighScores[`${currentModeId}:${level.id}`] ?? 0) > 0);

  const totalDone = levels.filter((l) => isLevelDone(l)).length;
  const pct = Math.round((totalDone / levels.length) * 100);

  // Best score per level for score-based modes
  const bestScores = useMemo(() => {
    const map: Record<number, number> = {};
    const ends = statsEngine
      .getBackend()
      .getAll()
      .filter(
        (e): e is GameEndEvent =>
          e.type === 'game_end' && e.modeId === currentModeId && e.outcome === 'won'
      );
    for (const e of ends) {
      if (e.score > 0 && (!map[e.levelId] || e.score > map[e.levelId])) map[e.levelId] = e.score;
    }
    return map;
  }, [currentModeId]); // eslint-disable-line

  if (showStats)
    return (
      <StatsScreen
        onBack={() => setShowStats(false)}
        onReplay={(evt: GameEndEvent) => {
          const lvl =
            ReplayEngine.findLevel(evt.levelId) ??
            generatedLevels.find((l) => l.id === evt.levelId) ??
            null;
          if (!lvl) return;
          setReplayEventFromStats(evt);
          setShowStats(false);
        }}
      />
    );

  if (showAchievements) return <AchievementsScreen onBack={() => setShowAchievements(false)} />;

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
      <StarField />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        style={{
          width: '100%',
          flexShrink: 0,
          zIndex: 2,
          position: 'relative',
          borderBottom: '1px solid #12122a',
          background: 'rgba(6,6,15,0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'max(16px, env(safe-area-inset-top)) 20px 14px',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(2rem, 10vw, 3.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.06em',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 40%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PRESSURE
        </div>
        <div style={{ fontSize: 10, color: '#3a3a55', letterSpacing: '0.25em', marginTop: 4 }}>
          PIPE PUZZLE
        </div>
        <div style={{ marginTop: 10, width: '100%', maxWidth: 260 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: '#25253a',
              marginBottom: 4,
            }}
          >
            <span>
              {totalDone}/{levels.length} COMPLETE
            </span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 4, background: '#0d0d1f', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #6366f1, #a5b4fc)',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </header>

      {/* ── PRESSURE SERIES MODE SWITCHER ──────────────────────── */}
      {(['classic', 'blitz', 'zen'] as const).includes(
        currentModeId as 'classic' | 'blitz' | 'zen'
      ) && (
        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: 420,
            flexShrink: 0,
            background: 'rgba(6,6,15,0.9)',
            borderBottom: '1px solid #0a0a1f',
            zIndex: 2,
            position: 'relative',
            gap: 6,
            padding: '8px 12px',
          }}
        >
          {(
            [
              { id: 'classic', label: 'Pressure', icon: '⚡', color: '#a78bfa' },
              { id: 'blitz', label: 'Blitz', icon: '🔥', color: '#f97316' },
              { id: 'zen', label: 'Zen', icon: '🧘', color: '#34d399' },
            ] as const
          ).map(({ id, label, icon, color }) => {
            const active = currentModeId === id;
            return (
              <button
                key={id}
                onClick={() => {
                  if (!active) setGameMode(id);
                }}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 10,
                  border: `1.5px solid ${active ? color + '55' : '#12122a'}`,
                  background: active ? `${color}18` : 'transparent',
                  color: active ? color : '#2e2e48',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  cursor: active ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <span>{icon}</span>
                <span>{label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── NAV TABS ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: 420,
          flexShrink: 0,
          borderBottom: '1px solid #12122a',
          zIndex: 2,
          position: 'relative',
        }}
      >
        {(
          [
            ['levels', 'Levels'],
            ...(activeMode.supportsWorkshop ? [['workshop', 'Workshop']] : []),
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v as 'levels' | 'workshop')}
            style={{
              flex: 1,
              padding: '13px 8px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: view === v ? '#a5b4fc' : '#3a3a55',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              borderBottom: view === v ? '2px solid #6366f1' : '2px solid transparent',
              transition: 'all 0.15s',
              minHeight: 48,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SCROLLABLE CONTENT ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: 420,
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: '20px 16px max(24px, env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {view === 'levels' && (
            <>
              {/* ── World tagline / flavour text ── */}
              {(() => {
                const wm = worldMap.get(world);
                if (!wm) return null;
                return (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div
                      style={{
                        fontSize: 'clamp(22px, 7vw, 30px)',
                        fontWeight: 900,
                        color: wm.color,
                        letterSpacing: '-0.03em',
                        filter: `drop-shadow(0 0 16px ${wm.color}60)`,
                      }}
                    >
                      {wm.icon} {wm.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#3a3a55',
                        marginTop: 4,
                        letterSpacing: '0.1em',
                      }}
                    >
                      {wm.tagline.toUpperCase()}
                    </div>
                  </div>
                );
              })()}

              {/* ── World selector ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}
              >
                {activeMode.worlds.map((wDef) => {
                  const lvls = levels.filter((l) => l.world === wDef.id);
                  const done = lvls.filter((l) => isLevelDone(l)).length;
                  const active = world === wDef.id;
                  return (
                    <button
                      key={wDef.id}
                      onClick={() => setSelectedWorld(wDef.id)}
                      style={{
                        padding: '14px 8px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        border: `1.5px solid ${active ? wDef.color + '60' : '#12122a'}`,
                        background: active ? `${wDef.color}12` : '#07070e',
                        transition: 'all 0.2s',
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          filter: active ? `drop-shadow(0 0 8px ${wDef.color}80)` : 'none',
                        }}
                      >
                        {wDef.icon}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: active ? wDef.color : '#3a3a55',
                        }}
                      >
                        {wDef.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#25253a' }}>
                        {done}/{lvls.length}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── Level grid ── */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#25253a',
                    letterSpacing: '0.2em',
                    marginBottom: 10,
                    paddingLeft: 2,
                  }}
                >
                  SELECT LEVEL
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                    gap: 'clamp(8px, 2vw, 12px)',
                  }}
                >
                  {levels
                    .filter((l) => l.world === world)
                    .map((level) => {
                      const done = isLevelDone(level);
                      const best = bestMoves[level.id];
                      const unlimitedBest = level.isUnlimited
                        ? (unlimitedHighScores[`${currentModeId}:${level.id}`] ?? 0)
                        : 0;
                      const scoreBest =
                        !level.isUnlimited && level.targetScore ? bestScores[level.id] : undefined;
                      const wm = worldMap.get(world) ?? activeMode.worlds[0];
                      const worldLevels = levels.filter((l) => l.world === world);
                      const displayNum = worldLevels.findIndex((l) => l.id === level.id) + 1;
                      const isLastPlayed = lastPlayedLevelId[currentModeId] === level.id;
                      return (
                        <button
                          key={level.id}
                          onClick={() => {
                            loadLevel(level);
                            onLevelSelected?.();
                          }}
                          style={{
                            aspectRatio: '1',
                            borderRadius: 14,
                            cursor: 'pointer',
                            border: `1.5px solid ${isLastPlayed ? '#6366f1' : done ? wm.color + '50' : '#12122a'}`,
                            background: isLastPlayed
                              ? `linear-gradient(145deg, #6366f120 0%, #6366f108 100%)`
                              : done
                                ? `linear-gradient(145deg, ${wm.color}18 0%, ${wm.color}0a 100%)`
                                : 'linear-gradient(145deg, #0a0a16 0%, #07070e 100%)',
                            color: isLastPlayed ? '#a5b4fc' : done ? wm.color : '#2a2a3e',
                            fontSize: 'clamp(15px, 4vw, 18px)',
                            fontWeight: 900,
                            position: 'relative',
                            boxShadow: isLastPlayed
                              ? `0 0 16px #6366f130`
                              : done
                                ? `0 0 16px ${wm.color}15`
                                : 'none',
                            transition: 'all 0.15s',
                            minWidth: 48,
                            minHeight: 48,
                          }}
                        >
                          {displayNum}
                          {/* Last played indicator */}
                          {isLastPlayed && !done && (
                            <div
                              style={{
                                position: 'absolute',
                                top: -6,
                                right: -6,
                                borderRadius: 8,
                                background: '#6366f1',
                                padding: '1px 5px',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: 9,
                                color: '#fff',
                                fontWeight: 900,
                                boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ▶
                            </div>
                          )}
                          {(level.isUnlimited && unlimitedBest > 0) ||
                          scoreBest !== undefined ||
                          best !== undefined ? (
                            <div
                              style={{
                                position: 'absolute',
                                top: -6,
                                right: -6,
                                borderRadius: 8,
                                background: '#fbbf24',
                                padding: '1px 5px',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: 9,
                                color: '#000',
                                fontWeight: 900,
                                boxShadow: '0 0 8px rgba(251,191,36,0.6)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {level.isUnlimited && unlimitedBest > 0
                                ? `🏆 ${unlimitedBest >= 1000 ? `${Math.floor(unlimitedBest / 1000)}k` : unlimitedBest}`
                                : scoreBest !== undefined
                                  ? `★ ${scoreBest >= 1000 ? `${Math.floor(scoreBest / 1000)}k` : scoreBest}`
                                  : `★ ${best}`}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                </div>
              </div>
            </>
          )}
          {view === 'workshop' && <LevelGeneratorPanel onLoad={loadLevel} />}
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer
        style={{
          width: '100%',
          flexShrink: 0,
          zIndex: 2,
          borderTop: '1px solid #12122a',
          background: 'rgba(6,6,15,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(10px, 1.5vh, 14px) 20px max(12px, env(safe-area-inset-bottom))',
          gap: 12,
        }}
      >
        {/* ── SETTINGS BUTTON ────────────────────── */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px solid #1e1e3540',
            background: 'transparent',
            cursor: 'pointer',
          }}
          title="Settings"
        >
          <span style={{ fontSize: 16 }}>⚙️</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#3a3a55',
            }}
          >
            SETTINGS
          </span>
        </button>

        {/* ── CHANGE MODE BUTTON ─────────────────── */}
        <button
          onClick={() => setShowModeModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: `1px solid ${activeMode.color}40`,
            background: `${activeMode.color}10`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 14 }}>{activeMode.icon}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: activeMode.color,
            }}
          >
            {activeMode.name.toUpperCase()}
          </span>
          <span style={{ fontSize: 9, color: activeMode.color + '80' }}>▼</span>
        </button>
      </footer>

      {/* ── SETTINGS PANEL ──────────────────────────────────────── */}
      <SettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        animationsEnabled={animationsEnabled}
        onToggleAnimations={toggleAnimations}
        onShowStats={() => setShowStats(true)}
        onShowAchievements={() => setShowAchievements(true)}
        onHowToPlay={replayTutorial}
        onRewatchWalkthrough={replayWalkthrough}
        hasWalkthrough={!!activeMode.walkthrough}
      />

      {/* ── MODE SELECTOR MODAL ─────────────────────────────────── */}
      <ModeSelectorModal visible={showModeModal} onClose={() => setShowModeModal(false)} />

      {/* ── REPLAY OVERLAY (launched from stats screen) ─────────── */}
      {replayEventFromStats &&
        (() => {
          const level = ReplayEngine.findLevel(replayEventFromStats.levelId);
          if (!level) return null;
          const engine = new ReplayEngine(replayEventFromStats, level);
          return (
            <ReplayOverlay
              event={replayEventFromStats}
              engine={engine}
              onClose={() => setReplayEventFromStats(null)}
            />
          );
        })()}
    </div>
  );
}
