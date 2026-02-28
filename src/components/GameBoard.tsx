import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';
import { getSolution } from '@/game/levels';
import TutorialScreen from './TutorialScreen';
import { WalkthroughOverlay, useWalkthrough } from './WalkthroughOverlay';
import { getModeById } from '../game/modes';
import { getAchievementEngine } from '@/game/achievements/engine';
import GameGrid from './game/GameGrid';
import GameStats from './game/GameStats';
import { statsEngine } from '@/game/stats';
import type { GameEndEvent } from '@/game/stats/types';
import ReplayOverlay from '@/components/game/ReplayOverlay';
import { ReplayEngine } from '@/game/stats/replay';
import UnlimitedRulesDialog from './UnlimitedRulesDialog';
import { getUnlimitedHighScore, setUnlimitedHighScore } from '@/game/unlimited';
import HowToPlayModal from './HowToPlayModal';
import ArcadeHubScreen from './ArcadeHubScreen';
import PressureHubScreen from './PressureHubScreen';
import ParticleLayer, { type ParticleSystemHandle } from './game/ParticleLayer';
import { useViewport } from './hooks/useViewport';
import { StarField } from './game/StarField';
import { Overlay } from './overlays/Overlay';
import { ensureNotifStyles, ensureSpinnerStyles } from './utils/styles';
import { EditorToolbar } from './editor/EditorToolbar';
import { PauseOverlay } from './modals/PauseOverlay';
import { FeatureInfoSheet } from './modals/FeatureInfoSheet';
import { MenuScreen } from './screens/MenuScreen';
import { LevelHeader } from './game/LevelHeader';
import { FeatureIndicators } from './game/FeatureIndicators';
import { GameFooter } from './game/GameFooter';
import { NotificationLog } from './game/NotificationLog';

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATION & ANIMATION SETUP
   Isolated in its own component + imperative ref so 60fps RAF updates
   never cause the full GameBoard to re-render.
═══════════════════════════════════════════════════════════════════════════ */

import React from 'react';

/* (CompressionBar, Pipes, and GameTile are provided by src/components/game/
   — GameBoard uses GameGrid which threads tileRenderer through to each tile) */

/* ═══════════════════════════════════════════════════════════════════════════
   OVERLAY SCREENS
═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   ICON BUTTON STYLE
═══════════════════════════════════════════════════════════════════════════ */

const iconBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: '1px solid #12122a',
  background: 'rgba(255,255,255,0.02)',
  color: '#3a3a55',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
  flexShrink: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN GAME BOARD COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function GameBoard() {
  const {
    currentLevel,
    tiles,
    wallOffset,
    compressionActive,
    moves,
    status,
    elapsedSeconds,
    screenShake,
    timeUntilCompression,
    wallsJustAdvanced,
    loadLevel,
    startGame,
    tapTile,
    restartLevel,
    goToMenu,
    undoMove,
    completeTutorial,
    generatedLevels,
    history,
    currentModeId,
    animationsEnabled,
    toggleAnimations,
    score,
    lossReason,
    modeState,
    pauseGame,
    resumeGame,
    isPaused,
    toggleEditor,
    editor,
    setEditorTool,
    editorUpdateTile,
    showArcadeHub,
    showPressureHub,
  } = useGameStore(
    useShallow((s) => ({
      currentLevel: s.currentLevel,
      tiles: s.tiles,
      wallOffset: s.wallOffset,
      compressionActive: s.compressionActive,
      moves: s.moves,
      status: s.status,
      elapsedSeconds: s.elapsedSeconds,
      screenShake: s.screenShake,
      timeUntilCompression: s.timeUntilCompression,
      wallsJustAdvanced: s.wallsJustAdvanced,
      loadLevel: s.loadLevel,
      startGame: s.startGame,
      tapTile: s.tapTile,
      restartLevel: s.restartLevel,
      goToMenu: s.goToMenu,
      undoMove: s.undoMove,
      completeTutorial: s.completeTutorial,
      generatedLevels: s.generatedLevels,
      history: s.history,
      currentModeId: s.currentModeId,
      animationsEnabled: s.animationsEnabled,
      toggleAnimations: s.toggleAnimations,
      score: s.score,
      lossReason: s.lossReason,
      modeState: s.modeState,
      pauseGame: s.pauseGame,
      resumeGame: s.resumeGame,
      isPaused: s.isPaused,
      toggleEditor: s.toggleEditor,
      editor: s.editor,
      setEditorTool: s.setEditorTool,
      setEditorSelectedTile: s.setEditorSelectedTile,
      editorUpdateTile: s.editorUpdateTile,
      editorRotateTile: s.editorRotateTile,
      showArcadeHub: s.showArcadeHub,
      showPressureHub: s.showPressureHub,
    }))
  );

  const particleRef = useRef<ParticleSystemHandle>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);
  const [rejectedPos, setRejectedPos] = useState<{ x: number; y: number } | null>(null);
  const [notification, setNotification] = useState<{
    text: string;
    key: number;
    isScore: boolean;
  } | null>(null);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notifLog, setNotifLog] = useState<Array<{ id: number; text: string; isScore: boolean }>>(
    []
  );

  // Clean up notification timeout on unmount to avoid state updates on unmounted component
  useEffect(() => {
    return () => {
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    };
  }, []);
  const [replayEvent, setReplayEvent] = useState<GameEndEvent | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showUnlimitedRules, setShowUnlimitedRules] = useState(false);
  const [unlimitedPreviousScore, setUnlimitedPreviousScore] = useState<number | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showFeatureInfo, setShowFeatureInfo] = useState<{
    icon: string;
    name: string;
    description: string;
  } | null>(null);
  const { w: vw, h: vh } = useViewport();

  // Pause game when How to Play modal is open
  useEffect(() => {
    if (showHowToPlay && status === 'playing') {
      pauseGame();
    }
    return () => {
      if (showHowToPlay && status === 'playing') {
        resumeGame();
      }
    };
  }, [showHowToPlay, status, pauseGame, resumeGame]);

  // Pause game when feature info sheet is open
  useEffect(() => {
    if (showFeatureInfo && status === 'playing') {
      pauseGame();
    }
    return () => {
      if (showFeatureInfo && status === 'playing') {
        resumeGame();
      }
    };
  }, [showFeatureInfo, status, pauseGame, resumeGame]);

  // Inject notification CSS and spinner CSS once on mount
  useEffect(() => {
    ensureNotifStyles();
    ensureSpinnerStyles();
  }, []);

  const showNotification = useCallback((text: string, isScore = false) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    const id = Date.now();
    setNotification({ text, key: id, isScore });
    notifTimeoutRef.current = setTimeout(() => setNotification(null), 1400);
    setNotifLog((prev) => [...prev.slice(-9), { id, text, isScore }]);
  }, []);

  // Get mode early for solution check
  const mode = getModeById(currentModeId);

  // Only compute solution for pipe-based modes (classic, blitz, zen, quantum_chain, etc.)
  // Non-pipe modes (gravity, memory, candy, etc.) have their own win conditions
  // Skip solution computation in editor mode
  // LAZY: Solution is only computed when user clicks hint, not on level load
  const isPipeMode =
    !mode.tileRenderer ||
    mode.tileRenderer.type === 'default' ||
    mode.tileRenderer.hidePipes === false;
  const [computedSolution, setComputedSolution] = useState<
    { x: number; y: number; rotations: number }[] | null
  >(null);
  const [isComputingSolution, setIsComputingSolution] = useState(false);

  // Compute solution lazily when hint is requested
  const computeSolution = useCallback(() => {
    if (
      !currentLevel ||
      !isPipeMode ||
      editor.enabled ||
      computedSolution !== null ||
      isComputingSolution
    )
      return;
    setIsComputingSolution(true);
    // Use setTimeout to defer computation to next tick, allowing UI to render first
    setTimeout(() => {
      const sol = getSolution(currentLevel);
      setComputedSolution(sol);
      setIsComputingSolution(false);
    }, 0);
  }, [currentLevel, isPipeMode, editor.enabled, computedSolution, isComputingSolution]);

  // Reset solution when level changes
  useEffect(() => {
    setComputedSolution(null);
    setIsComputingSolution(false);
  }, [currentLevel?.id]);

  const solution = computedSolution;

  // Level-specific all-time record — computed once per level load, not reactive
  const levelRecord = useMemo(() => {
    if (!currentLevel) return undefined;
    const ends = statsEngine
      .getBackend()
      .getAll()
      .filter((e): e is GameEndEvent => e.type === 'game_end' && e.levelId === currentLevel.id);
    return { attempts: ends.length, wins: ends.filter((e) => e.outcome === 'won').length };
  }, [currentLevel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build replay engine whenever a replay is requested
  // Falls back to generatedLevels so Workshop levels are also replayable
  const replayEngine = useMemo(() => {
    if (!replayEvent) return null;
    const level =
      ReplayEngine.findLevel(replayEvent.levelId) ??
      generatedLevels.find((l) => l.id === replayEvent.levelId) ??
      null;
    if (!level) return null;
    return new ReplayEngine(replayEvent, level);
  }, [replayEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === 'won' && animationsEnabled && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          particleRef.current?.burst(
            cx + (Math.random() - 0.5) * 120,
            cy + (Math.random() - 0.5) * 100,
            i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#a5b4fc' : '#fbbf24',
            14,
            i % 2 === 0 ? 'star' : 'circle'
          );
        }, i * 80);
      }
    }
  }, [status, animationsEnabled]);

  const CANDY_BURST_COLORS: Record<string, string> = {
    '🍎': '#ef4444',
    '🍊': '#f97316',
    '🍋': '#eab308',
    '🫐': '#6366f1',
    '🍓': '#ec4899',
  };

  // Handle tile tap - routes to editor or game logic
  const handleTileTap = useCallback(
    (x: number, y: number) => {
      // In editor mode, use editor actions
      if (editor.enabled && editor.tool) {
        editorUpdateTile(x, y);
        return;
      }

      if (status !== 'playing') return;
      const tile = tiles.find((t) => t.x === x && t.y === y);
      if (!tile?.canRotate) return;

      // Zustand set() is synchronous — read before/after to detect validity and score change
      const prevMoves = useGameStore.getState().moves;
      const prevScore = useGameStore.getState().score;
      tapTile(x, y);
      const accepted = useGameStore.getState().moves > prevMoves;
      const scoreDelta = useGameStore.getState().score - prevScore;

      if (animationsEnabled && boardRef.current && currentLevel) {
        const rect = boardRef.current.getBoundingClientRect();
        const gs = currentLevel.gridSize;
        const px = rect.left + (x + 0.5) * (rect.width / gs);
        const py = rect.top + (y + 0.5) * (rect.height / gs);

        if (accepted) {
          const sym = tile.displayData?.symbol as string | undefined;
          const color = sym && CANDY_BURST_COLORS[sym] ? CANDY_BURST_COLORS[sym] : '#f59e0b';
          particleRef.current?.burst(px, py, color, sym ? 8 : 5);
        } else {
          particleRef.current?.burst(px, py, '#ef4444', 4);
        }
      }

      if (accepted) {
        // Mode gets first crack at the notification (can include combo text + score delta).
        // Falls back to plain "+N" if the mode returns null.
        const tappedMode = getModeById(currentModeId);
        let notifText: string | null = null;
        if (tappedMode.getNotification) {
          const freshState = useGameStore.getState();
          // Merge scoreDelta into modeState so every mode's getNotification can read it
          const notifModeState = { ...(freshState.modeState ?? {}), scoreDelta };
          notifText = tappedMode.getNotification(
            freshState.tiles,
            freshState.moves,
            notifModeState
          );
        }
        if (!notifText && scoreDelta > 0) notifText = `+${scoreDelta}`;
        if (notifText) showNotification(notifText, scoreDelta > 0);
      } else {
        setRejectedPos({ x, y });
        setTimeout(() => setRejectedPos(null), 380);
      }
    },
    [status, tiles, currentLevel, tapTile, animationsEnabled, currentModeId, showNotification]
  );

  // ── WALKTHROUGH SYSTEM ────────────────────────────────────────────────────
  // Get walkthrough config from the mode itself (hooks must be called before early returns)
  const walkthroughConfig = useMemo(() => {
    if (!currentLevel || currentLevel.isGenerated) return null;
    // Check if this level matches the walkthrough's target level
    const config = mode.walkthrough;
    if (!config || config.levelId !== currentLevel.id) return null;
    return config;
  }, [currentLevel, mode.walkthrough]);

  // Use walkthrough hook to manage state
  const {
    isActive: walkthroughActive,
    currentStepIndex: walkthroughStepIndex,
    currentStep: walkthroughStep,
    advance: advanceWalkthrough,
    skip: skipWalkthrough,
  } = useWalkthrough(walkthroughConfig, boardRef);

  // ── UNLIMITED LEVEL HANDLING ─────────────────────────────────────────────
  // Show rules dialog when an Unlimited level is loaded (status = idle)
  const isUnlimited = currentLevel?.isUnlimited ?? false;

  useEffect(() => {
    if (currentLevel?.isUnlimited && status === 'idle') {
      // Load previous high score
      const highScore = getUnlimitedHighScore(currentModeId, currentLevel.id);
      setUnlimitedPreviousScore(highScore);
      setShowUnlimitedRules(true);
    } else {
      setShowUnlimitedRules(false);
    }
  }, [currentLevel?.id, currentLevel?.isUnlimited, status, currentModeId]);

  // Handle Unlimited level win/loss based on high score
  const handleUnlimitedStart = useCallback(() => {
    setShowUnlimitedRules(false);
    startGame();
  }, [startGame]);

  // Save unlimited high score and detect new record whenever survival game ends
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!isUnlimited || !currentLevel) return;
    if (status === 'lost' || status === 'won') {
      const previousBest = getUnlimitedHighScore(currentModeId, currentLevel.id) ?? 0;
      setUnlimitedHighScore(currentModeId, currentLevel.id, score);
      setIsNewHighScore(score > previousBest);
    } else if (status === 'idle') {
      setIsNewHighScore(false);
    }
  }, [status]); // eslint-disable-line

  // Clear notification log when a new level loads or the game resets to idle
  useEffect(() => {
    setNotifLog([]);
  }, [currentLevel?.id]); // eslint-disable-line
  useEffect(() => {
    if (status === 'idle') setNotifLog([]);
  }, [status]); // eslint-disable-line

  // ── ACHIEVEMENT CHECKING ────────────────────────────────────────────────────
  // Check achievements when a level ends (win or loss)
  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return;
    if (!currentLevel) return;

    const achievementEngine = getAchievementEngine();

    // Update daily streak when playing a game
    const currentStreak = achievementEngine.updateDailyStreak();

    // Check if this level was won without hints (no hint button clicked)
    // We track this by checking if showHint was ever true during the game
    // For now, we'll pass 0 for noHintsLevels and let the engine track it cumulatively
    // The hint tracking would need to be added to the store if we want per-level tracking

    // Determine if this was a speedrun (under 10 seconds)
    const isSpeedrun = status === 'won' && elapsedSeconds < 10;

    // Check if moves were under par (level has optimal moves defined)
    // For now, we'll use a simple heuristic: if the level was won, count it
    const isMovesUnderPar = status === 'won';

    // Check achievements
    achievementEngine.checkAchievements({
      levelsCompleted: status === 'won' ? 1 : 0,
      movesUnderPar: isMovesUnderPar ? 1 : 0,
      speedruns: isSpeedrun ? 1 : 0,
      currentStreak,
      noHintsLevels: status === 'won' && !showHint ? 1 : 0,
      perfectWorlds: 0, // This would need world-level tracking
      wallsSurvived: 0, // This would need wall tracking during gameplay
      currentModeId,
      currentLevelId: currentLevel.id,
    });
  }, [status, currentLevel, elapsedSeconds, currentModeId, showHint]);

  // Early returns for tutorial and menu screens (must come AFTER all hooks)
  if (status === 'tutorial') return <TutorialScreen onComplete={completeTutorial} />;
  if (showArcadeHub) return <ArcadeHubScreen />;
  if (showPressureHub) return <PressureHubScreen />;
  if (status === 'menu' || !currentLevel) return <MenuScreen />;

  const gs = currentLevel.gridSize;
  const maxOff = Math.floor(gs / 2);
  const comprPct = Math.round((wallOffset / maxOff) * 100);
  const hintPos = showHint && solution?.length ? solution[0] : null;

  // Use the active mode's level list so NEXT works in every mode (Candy, Blitz, etc.)
  // Check if this level is part of the mode's defined levels (even if procedurally generated)
  const modeLevels = mode.getLevels();
  const isInModeLevels = modeLevels.some((l) => l.id === currentLevel.id);
  // For workshop levels (not in mode's level list), navigate within generatedLevels
  const allLevels = isInModeLevels ? [...modeLevels, ...generatedLevels] : generatedLevels;
  const currentIndex = allLevels.findIndex((l) => l.id === currentLevel.id);
  const nextLevel =
    currentIndex >= 0 && currentIndex < allLevels.length - 1 ? allLevels[currentIndex + 1] : null;

  // Compute display level number (1-based position in mode's level list)
  const levelDisplayNum = modeLevels.findIndex((l) => l.id === currentLevel.id) + 1;

  const reachedTarget = score >= (currentLevel.targetScore ?? Infinity);
  const outOfTaps = !isUnlimited && moves >= currentLevel.maxMoves && !reachedTarget;
  const winTitle = outOfTaps ? 'OUT OF TAPS' : (mode.overlayText?.win ?? 'CONNECTED');
  const lossTitle = lossReason ?? mode.overlayText?.loss ?? 'CRUSHED';

  // Footer visibility — only show controls that make sense for the active mode
  const showUndoBtn = mode.supportsUndo !== false;
  const showHintBtn = solution !== null; // null for non-pipe modes (candy, outbreak, etc.)

  // Non-square grid support
  const gridCols = currentLevel.gridCols ?? gs;
  const gridRows = currentLevel.gridRows ?? gs;
  const maxDim = Math.max(gridCols, gridRows);

  // Responsive board: header ~62px + stats ~52px + plugin strip ~24px + footer ~62px + gaps ~24px = ~224px
  const hasFeatures = Boolean(
    currentLevel.features && Object.values(currentLevel.features).some(Boolean)
  );
  const reserved = hasFeatures ? 224 : 200;
  const maxAvailW = Math.min(vw * 0.97, 460);
  const maxAvailH = Math.max(vh - reserved, 160);
  const gap = maxDim >= 9 ? 2 : maxDim > 5 ? 3 : 4;
  const padding = maxDim >= 9 ? 4 : maxDim > 5 ? 8 : 10;
  const tileSizeByW = Math.floor((maxAvailW - padding * 2 - gap * (gridCols - 1)) / gridCols);
  const tileSizeByH = Math.floor((maxAvailH - padding * 2 - gap * (gridRows - 1)) / gridRows);
  const tileSize = Math.max(1, Math.min(tileSizeByW, tileSizeByH));
  const boardWidth = tileSize * gridCols + padding * 2 + gap * (gridCols - 1);
  const boardHeight = tileSize * gridRows + padding * 2 + gap * (gridRows - 1);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeStr =
    status === 'playing' ? `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')}` : '';
  const countdownSecs = Math.ceil(timeUntilCompression / 1000);

  // For timed levels (e.g. Frozen world): countdown to game-over
  const timeLeft = currentLevel.timeLimit
    ? Math.max(0, currentLevel.timeLimit - elapsedSeconds)
    : undefined;
  // Override statsDisplay when the level has a time limit
  const levelStatsDisplay = currentLevel.timeLimit
    ? [{ type: 'score' as const }, { type: 'timeleft' as const }]
    : undefined;

  // Compute the onReplay callback: win overlay uses latest, unlimited loss uses best-score game
  const onReplayForOverlay = (() => {
    const show = status === 'won' || (isUnlimited && status === 'lost');
    if (!show) return undefined;
    const allEnds = statsEngine
      .getBackend()
      .getAll()
      .filter(
        (e): e is GameEndEvent =>
          e.type === 'game_end' &&
          e.levelId === (currentLevel?.id ?? -1) &&
          (e.moveLog?.length ?? 0) > 0
      );
    if (!allEnds.length) return undefined;
    const target = isUnlimited
      ? allEnds.reduce((best, e) => (e.score > best.score ? e : best), allEnds[0])
      : allEnds[allEnds.length - 1];
    return () => setReplayEvent(target);
  })();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'radial-gradient(ellipse 70% 50% at 50% -5%, #0d0d22 0%, #06060f 100%)',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overflow: 'hidden',
          transform: animationsEnabled && screenShake ? 'translateX(-4px)' : 'none',
          transition: animationsEnabled && screenShake ? 'none' : 'transform 0.05s ease',
          zIndex: 1,
        }}
      >
        <StarField />

        {/* Particles — isolated component, won't re-render the rest of the board */}
        <ParticleLayer ref={particleRef} />

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <LevelHeader
          currentLevel={currentLevel}
          levelDisplayNum={levelDisplayNum}
          onMenu={goToMenu}
          onRestart={restartLevel}
          iconBtn={iconBtn}
        />

        {/* ── STATS ROW ───────────────────────────────────────────── */}
        <GameStats
          moves={moves}
          currentModeId={currentModeId}
          maxMoves={currentLevel.maxMoves}
          compressionPercent={comprPct}
          compressionActive={compressionActive}
          countdownSeconds={countdownSecs}
          score={score}
          targetScore={currentLevel.targetScore}
          timeLeft={timeLeft}
          timeLimit={currentLevel.timeLimit}
          statsDisplayOverride={levelStatsDisplay}
          isPaused={isPaused}
          isEditor={editor.enabled}
        />

        {/* ── FEATURE INDICATORS — shows active features for this level ── */}
        <FeatureIndicators currentLevel={currentLevel} onShowFeatureInfo={setShowFeatureInfo} />

        {/* ── GAME BOARD — centered in flex-1 container ────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            position: 'relative',
            zIndex: 1,
            padding: '4px 0',
          }}
        >
          <div
            ref={boardRef}
            style={{
              position: 'relative',
              width: boardWidth,
              height: boardHeight,
              background: 'linear-gradient(145deg, #0a0a16, #07070e)',
              borderRadius: 18,
              padding,
              border: `2px solid ${wallsJustAdvanced ? '#ef444480' : '#12122a'}`,
              boxShadow: wallsJustAdvanced
                ? '0 0 40px rgba(239,68,68,0.3), inset 0 0 40px rgba(239,68,68,0.05)'
                : '0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.2)',
              transition: 'border-color 0.3s, box-shadow 0.3s',
              flexShrink: 0,
            }}
          >
            {/* Tile grid + wall overlay — delegated to GameGrid which passes
              mode.tileRenderer down to each GameTile, enabling candy crush,
              slots, match-3, or any custom visual without touching this file. */}
            <GameGrid
              tiles={tiles}
              compressionDirection={
                currentLevel?.compressionDirection ?? editor.compressionDirection ?? 'all'
              }
              gridSize={gs}
              gridCols={gridCols}
              gridRows={gridRows}
              gap={gap}
              tileSize={tileSize}
              wallOffset={wallOffset}
              wallsJustAdvanced={wallsJustAdvanced}
              compressionActive={compressionActive}
              hintPos={hintPos}
              hintTiles={
                mode.getHintTiles
                  ? mode.getHintTiles(tiles, currentLevel.goalNodes, modeState)
                  : undefined
              }
              status={status}
              onTileTap={handleTileTap}
              animationsEnabled={animationsEnabled}
              tileRenderer={mode.tileRenderer}
              rejectedPos={rejectedPos}
              editorMode={editor.enabled}
            />

            {/* Pause overlay - hide when editor is enabled */}
            {isPaused && !editor.enabled && (
              <PauseOverlay onResume={resumeGame} onMenu={goToMenu} />
            )}

            {/* Editor mode indicator in top bar - no blocking overlay */}

            {/* Overlay screens - hide for Unlimited levels when rules dialog is shown, or when walkthrough is active, or when paused, or when editor is enabled */}
            {!(isUnlimited && showUnlimitedRules) &&
              !walkthroughActive &&
              !isPaused &&
              !editor.enabled && (
                <Overlay
                  status={status}
                  moves={moves}
                  levelName={currentLevel.name}
                  onStart={isUnlimited ? handleUnlimitedStart : startGame}
                  onNext={() => nextLevel && loadLevel(nextLevel)}
                  onMenu={goToMenu}
                  onRetry={restartLevel}
                  solution={solution}
                  hasNext={!!nextLevel}
                  elapsedSeconds={elapsedSeconds}
                  winTitle={winTitle}
                  lossTitle={lossTitle}
                  finalScore={score}
                  targetScore={currentLevel.targetScore}
                  levelRecord={levelRecord}
                  onReplay={onReplayForOverlay}
                  newHighScore={isNewHighScore}
                />
              )}
            {/* Score / mode notification — floats above the board, fades out */}
            {notification && (
              <div
                key={notification.key}
                style={{
                  position: 'absolute',
                  top: -24,
                  left: '50%',
                  animation: 'notifFloat 1.4s ease forwards',
                  fontSize: 15,
                  fontWeight: 900,
                  color: notification.isScore ? mode.color : '#fbbf24',
                  letterSpacing: '0.05em',
                  pointerEvents: 'none',
                  zIndex: 20,
                  whiteSpace: 'nowrap',
                  textShadow: `0 0 12px ${notification.isScore ? mode.color : '#fbbf24'}99`,
                }}
              >
                {notification.text}
              </div>
            )}
          </div>
        </div>

        {/* ── REPLAY OVERLAY ──────────────────────────────────────── */}
        {replayEngine && replayEvent && (
          <ReplayOverlay
            event={replayEvent}
            engine={replayEngine}
            onClose={() => setReplayEvent(null)}
          />
        )}

        {/* ── WALKTHROUGH OVERLAY ──────────────────────────────────── */}
        {walkthroughActive && walkthroughConfig && (
          <WalkthroughOverlay
            steps={walkthroughConfig.steps}
            currentStepIndex={walkthroughStepIndex}
            onAdvance={advanceWalkthrough}
            onSkip={skipWalkthrough}
            targetTile={walkthroughStep?.targetTile}
            boardRef={boardRef}
            gridSize={gs}
            onStartGame={startGame}
          />
        )}

        {/* ── UNLIMITED RULES DIALOG ────────────────────────────────── */}
        {showUnlimitedRules && currentLevel && (
          <UnlimitedRulesDialog
            levelName={currentLevel.name}
            previousScore={unlimitedPreviousScore}
            onStart={handleUnlimitedStart}
            onBack={goToMenu}
            modeId={currentModeId}
            features={currentLevel.features}
            onWatchBest={(() => {
              const ends = statsEngine
                .getBackend()
                .getAll()
                .filter(
                  (e): e is GameEndEvent =>
                    e.type === 'game_end' &&
                    e.levelId === currentLevel.id &&
                    (e.moveLog?.length ?? 0) > 0
                );
              if (!ends.length) return undefined;
              const best = ends.reduce((b, e) => (e.score > b.score ? e : b), ends[0]);
              return () => {
                setShowUnlimitedRules(false);
                setReplayEvent(best);
              };
            })()}
          />
        )}

        {/* ── FOOTER / CONTROLS ───────────────────────────────────── */}
        <footer
          style={{
            width: '100%',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
            borderTop: '1px solid #0e0e22',
            background: 'rgba(6,6,15,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(10px, 3vw, 20px)',
            padding: 'clamp(8px, 1.5vh, 12px) 16px max(10px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Editor toggle - always visible */}
          <button
            onClick={toggleEditor}
            style={{
              ...iconBtn,
              color: editor.enabled ? '#22c55e' : '#a855f7',
              border: editor.enabled ? '1px solid #22c55e40' : '1px solid #a855f740',
              background: editor.enabled ? 'rgba(34,197,94,0.1)' : 'transparent',
            }}
            title={editor.enabled ? 'Exit Editor' : 'Level Editor'}
          >
            <span style={{ fontSize: 16 }}>{editor.enabled ? '✓' : '🛠️'}</span>
          </button>

          {/* In editor mode, show simplified footer with grid controls */}
          {editor.enabled ? (
            <>
              {/* Grid size controls */}
              <button
                onClick={() => useGameStore.getState().editorResizeGrid(-1)}
                style={{
                  ...iconBtn,
                  color: '#a855f7',
                  border: '1px solid #a855f740',
                }}
                title="Decrease Grid"
              >
                <span style={{ fontSize: 18 }}>−</span>
              </button>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 44,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 900, color: '#a855f7' }}>
                  {editor.gridSize ?? gs}×{editor.gridSize ?? gs}
                </div>
                <div style={{ fontSize: 8, color: '#3a3a55', letterSpacing: '0.1em' }}>GRID</div>
              </div>
              <button
                onClick={() => useGameStore.getState().editorResizeGrid(1)}
                style={{
                  ...iconBtn,
                  color: '#a855f7',
                  border: '1px solid #a855f740',
                }}
                title="Increase Grid"
              >
                <span style={{ fontSize: 18 }}>+</span>
              </button>
            </>
          ) : (
            <GameFooter
              showUndoBtn={showUndoBtn}
              showHintBtn={showHintBtn}
              timeStr={timeStr}
              showHint={showHint}
              isComputingSolution={isComputingSolution}
              isPaused={isPaused}
              status={status}
              animationsEnabled={animationsEnabled}
              history={history}
              iconBtn={iconBtn}
              onUndo={undoMove}
              onHint={() => {
                if (computedSolution === null && !isComputingSolution) {
                  computeSolution();
                }
                setShowHint((h) => !h);
              }}
              onPauseResume={() => (isPaused ? resumeGame : pauseGame)()}
              onHowToPlay={() => setShowHowToPlay(true)}
              onToggleAnimations={toggleAnimations}
              computeSolution={computeSolution}
            />
          )}
        </footer>

        {/* How to Play Modal */}
        {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

        {/* Feature Info Sheet */}
        <FeatureInfoSheet feature={showFeatureInfo} onClose={() => setShowFeatureInfo(null)} />

        {/* ── EDITOR TOOLBAR ─────────────────────────────────────── */}
        {editor.enabled && (
          <div
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 100,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '8px 12px',
              background: 'rgba(10,10,22,0.95)',
              borderRadius: 16,
              border: '1px solid #a855f740',
              boxShadow: '0 4px 24px rgba(168,85,247,0.2)',
              zIndex: 100,
              maxWidth: '95vw',
            }}
          >
            <EditorToolbar
              editor={editor}
              tiles={tiles}
              setEditorTool={setEditorTool}
              showNotification={showNotification}
            />
          </div>
        )}
      </div>

      {/* ── NOTIFICATION LOG — fixed right panel, escapes overflow:hidden ── */}
      {status === 'playing' && (
        <NotificationLog notifLog={notifLog} mode={mode} viewportWidth={vw} boardMaxWidth={238} />
      )}
    </>
  );
}
