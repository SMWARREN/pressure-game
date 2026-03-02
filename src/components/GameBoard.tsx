import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/game/store';
import { useStats, useAchievements } from '@/game/contexts';
import { useShallow } from 'zustand/react/shallow';
import TutorialScreen from './TutorialScreen';
import { WalkthroughOverlay, useWalkthrough } from './WalkthroughOverlay';
import { getModeById } from '../game/modes';
import GameGrid from './game/GameGrid';
import GameStats from './game/GameStats';
import type { GameEndEvent } from '@/game/stats/types';
import ReplayOverlay from '@/components/game/ReplayOverlay';
import UnlimitedRulesDialog from './UnlimitedRulesDialog';
import { getUnlimitedHighScore, setUnlimitedHighScore } from '@/game/unlimited';
import HowToPlayModal from './HowToPlayModal';
import ArcadeHubScreen from './ArcadeHubScreen';
import PressureHubScreen from './PressureHubScreen';
import ParticleLayer, { type ParticleSystemHandle } from './game/ParticleLayer';
import { useViewport } from './hooks/useViewport';
import { useTheme } from '@/hooks/useTheme';
import { usePauseOnCondition } from '@/hooks/usePauseOnCondition';
import { useSolutionComputation, useLevelRecord, useReplayEngine, useNotificationSystem, useTapRejection, useAcceptedTapNotification } from './hooks/useGameBoardInitialization';
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
import {
  getParticleBurstColor,
  getParticleBurstShape,
  computeBoardDimensions,
  computeTimeStrings,
  computeLevelNavigation,
  computeLevelDisplayNum,
  computeOverlayProps,
  computeCompressionPercent,
} from './game/GameBoardUtils';

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATION & ANIMATION SETUP
   Isolated in its own component + imperative ref so 60fps RAF updates
   never cause the full GameBoard to re-render.
═══════════════════════════════════════════════════════════════════════════ */

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

// Extract GameBoard store state into custom hook for reduced complexity
function useGameBoardState() {
  return useGameStore(
    useShallow((s) => ({
      status: s.status,
      tiles: s.tiles,
      currentLevel: s.currentLevel,
      currentModeId: s.currentModeId,
      moves: s.moves,
      score: s.score,
      elapsedSeconds: s.elapsedSeconds,
      wallOffset: s.wallOffset,
      wallsJustAdvanced: s.wallsJustAdvanced,
      compressionActive: s.compressionActive,
      isPaused: s.isPaused,
      animationsEnabled: s.animationsEnabled,
      screenShake: s.screenShake,
      editor: s.editor,
      history: s.history,
      lossReason: s.lossReason,
      modeState: s.modeState,
      timeUntilCompression: s.timeUntilCompression,
      generatedLevels: s.generatedLevels,
      showArcadeHub: s.showArcadeHub,
      showPressureHub: s.showPressureHub,
      tapTile: s.tapTile,
      loadLevel: s.loadLevel,
      startGame: s.startGame,
      restartLevel: s.restartLevel,
      goToMenu: s.goToMenu,
      pauseGame: s.pauseGame,
      resumeGame: s.resumeGame,
      completeTutorial: s.completeTutorial,
      toggleEditor: s.toggleEditor,
      setEditorTool: s.setEditorTool,
      editorUpdateTile: s.editorUpdateTile,
      undoMove: s.undoMove,
      toggleAnimations: s.toggleAnimations,
    }))
  );
}

export default function GameBoard() {
  // Destructure from store using useShallow to avoid unnecessary re-renders
  const {
    status,
    tiles,
    currentLevel,
    currentModeId,
    moves,
    score,
    elapsedSeconds,
    wallOffset,
    wallsJustAdvanced,
    compressionActive,
    isPaused,
    animationsEnabled,
    screenShake,
    editor,
    history,
    lossReason,
    modeState,
    timeUntilCompression,
    generatedLevels,
    showArcadeHub,
    showPressureHub,
    tapTile,
    loadLevel,
    startGame,
    restartLevel,
    goToMenu,
    pauseGame,
    resumeGame,
    completeTutorial,
    toggleEditor,
    setEditorTool,
    editorUpdateTile,
    undoMove,
    toggleAnimations,
  } = useGameBoardState();

  const stats = useStats();
  const achievementEngine = useAchievements();

  const particleRef = useRef<ParticleSystemHandle>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);
  const { notification, notifLog, showNotification, setNotifLog } = useNotificationSystem();
  const { rejectedPos, handleRejectedTap } = useTapRejection();
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
  const { colors } = useTheme();

  // Pause game when How to Play modal is open
  usePauseOnCondition(showHowToPlay, status, pauseGame, resumeGame);

  // Pause game when feature info sheet is open
  usePauseOnCondition(showFeatureInfo, status, pauseGame, resumeGame);

  // Inject notification CSS and spinner CSS once on mount
  useEffect(() => {
    ensureNotifStyles();
    ensureSpinnerStyles();
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

  const { solution, isComputing: isComputingSolution, computeSolution } = useSolutionComputation(
    currentLevel,
    isPipeMode,
    editor.enabled
  );

  // Level-specific all-time record — computed once per level load, not reactive
  const levelRecord = useLevelRecord(currentLevel);

  // Build replay engine whenever a replay is requested
  // Falls back to generatedLevels so Workshop levels are also replayable
  const replayEngine = useReplayEngine(replayEvent, generatedLevels);

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
            getParticleBurstColor(i),
            14,
            getParticleBurstShape(i)
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

  // Helper to show particle burst on tap
  const showParticleBurst = useCallback(
    (x: number, y: number, tile: any, accepted: boolean) => {
      if (!animationsEnabled || !boardRef.current || !currentLevel) return;
      const rect = boardRef.current.getBoundingClientRect();
      const gs = currentLevel.gridSize;
      const px = rect.left + (x + 0.5) * (rect.width / gs);
      const py = rect.top + (y + 0.5) * (rect.height / gs);
      const sym = tile.displayData?.symbol as string | undefined;
      if (accepted) {
        const color = sym && CANDY_BURST_COLORS[sym] ? CANDY_BURST_COLORS[sym] : '#f59e0b';
        particleRef.current?.burst(px, py, color, sym ? 8 : 5);
      } else {
        particleRef.current?.burst(px, py, '#ef4444', 4);
      }
    },
    [animationsEnabled, currentLevel]
  );

  // Helper to show notification for accepted tap
  const handleAcceptedTap = useAcceptedTapNotification(currentModeId, showNotification);

  // Handle tile tap - routes to editor or game logic
  const handleTileTap = useCallback(
    (x: number, y: number) => {
      if (editor.enabled && editor.tool) {
        editorUpdateTile(x, y);
        return;
      }

      if (status !== 'playing') return;
      const tile = tiles.find((t) => t.x === x && t.y === y);
      if (!tile?.canRotate) return;

      const prevMoves = useGameStore.getState().moves;
      const prevScore = useGameStore.getState().score;
      tapTile(x, y);
      const accepted = useGameStore.getState().moves > prevMoves;
      const scoreDelta = useGameStore.getState().score - prevScore;

      showParticleBurst(x, y, tile, accepted);
      if (accepted) {
        handleAcceptedTap(scoreDelta);
      } else {
        handleRejectedTap(x, y);
      }
    },
    [status, tiles, tapTile, editor, editorUpdateTile, showParticleBurst, handleAcceptedTap, handleRejectedTap]
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
  }, [status, currentLevel, elapsedSeconds, currentModeId, showHint, achievementEngine]);

  // Helper: find best-scoring game event from array
  const findBestScoreEvent = (events: GameEndEvent[]): GameEndEvent => {
    return events.reduce((best, e) => (e.score > best.score ? e : best), events[0]);
  };

  // Extract computation of replay events (must be before early returns)
  const computeReplayEvents = useCallback((): GameEndEvent[] => {
    if (!currentLevel) return [];
    return stats
      .getBackend()
      .getAll()
      .filter(
        (e): e is GameEndEvent =>
          e.type === 'game_end' &&
          e.levelId === currentLevel.id &&
          (e.moveLog?.length ?? 0) > 0
      );
  }, [stats, currentLevel?.id]);

  // Compute the onReplay callback: win overlay uses latest, unlimited loss uses best-score game
  // (must be before early returns)
  const onReplayForOverlay = useMemo(() => {
    const shouldShow = status === 'won' || (isUnlimited && status === 'lost');
    if (!shouldShow) return undefined;
    const allEnds = computeReplayEvents();
    if (!allEnds.length) return undefined;
    const target = isUnlimited ? findBestScoreEvent(allEnds) : allEnds[allEnds.length - 1];
    return () => setReplayEvent(target);
  }, [status, isUnlimited, computeReplayEvents, findBestScoreEvent, setReplayEvent]);

  // Compute the onWatchBest callback for unlimited rules dialog (must be before early returns)
  const onWatchBestUnlimited = useMemo(() => {
    const ends = computeReplayEvents();
    if (!ends.length) return undefined;
    const best = findBestScoreEvent(ends);
    return () => {
      setShowUnlimitedRules(false);
      setReplayEvent(best);
    };
  }, [computeReplayEvents, findBestScoreEvent]);

  // Check if we're in test/harness mode (skip tutorial for E2E tests)
  // Early returns for tutorial and menu screens (must come AFTER all hooks)
  // Guard clauses for special screens (reduces nesting depth)
  if (status === 'tutorial') return <TutorialScreen onComplete={completeTutorial} />;
  if (showArcadeHub) return <ArcadeHubScreen />;
  if (showPressureHub) return <PressureHubScreen />;
  if (!currentLevel || status === 'menu') return <MenuScreen />;

  const gs = currentLevel.gridSize;
  const comprPct = computeCompressionPercent(wallOffset, gs);
  const hintPos = showHint && solution?.length ? solution[0] : null;

  // Use the active mode's level list so NEXT works in every mode (Candy, Blitz, etc.)
  const modeLevels = mode.getLevels();
  const { nextLevel } = computeLevelNavigation(modeLevels, generatedLevels, currentLevel.id);
  const levelDisplayNum = computeLevelDisplayNum(modeLevels, currentLevel.id);

  const { winTitle, lossTitle } = computeOverlayProps({
    score,
    targetScore: currentLevel.targetScore,
    moves,
    maxMoves: currentLevel.maxMoves,
    isUnlimited,
    lossReason,
    mode,
    elapsedSeconds,
  });

  // Footer visibility — only show controls that make sense for the active mode
  const showUndoBtn = mode.supportsUndo !== false;
  const showHintBtn = solution !== null; // null for non-pipe modes (candy, outbreak, etc.)

  // Non-square grid support
  const gridCols = currentLevel.gridCols ?? gs;
  const gridRows = currentLevel.gridRows ?? gs;

  // Responsive board: header ~62px + stats ~52px + plugin strip ~24px + footer ~62px + gaps ~24px = ~224px
  const hasFeatures = Boolean(
    currentLevel.features && Object.values(currentLevel.features).some(Boolean)
  );
  const { tileSize, boardWidth, boardHeight, gap, padding } = computeBoardDimensions(
    vw,
    vh,
    gridCols,
    gridRows,
    hasFeatures
  );

  const { timeStr: computedTimeStr, timeLeft } = computeTimeStrings(
    elapsedSeconds,
    currentLevel.timeLimit
  );
  const shouldShowTimeStr = status === 'playing';
  const timeStr = shouldShowTimeStr ? computedTimeStr : '';
  const countdownSecs = Math.ceil(timeUntilCompression / 1000);
  // Override statsDisplay when the level has a time limit
  const hasTimeLimit = currentLevel.timeLimit != null;
  const levelStatsDisplay = hasTimeLimit
    ? [{ type: 'score' as const }, { type: 'timeleft' as const }]
    : undefined;

  // Extract conditional editor button styles (S3358: reduce nested ternaries)
  const isEditorActive = editor.enabled;
  const editorButtonStyles = isEditorActive
    ? { color: '#22c55e', border: '1px solid #22c55e40', background: 'rgba(34,197,94,0.1)' }
    : { color: '#a855f7', border: '1px solid #a855f740', background: 'transparent' };
  const editorButtonTitle = isEditorActive ? 'Exit Editor' : 'Level Editor';
  const editorButtonIcon = isEditorActive ? '✓' : '🛠️';

  return (
    <>
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
              background: colors.bg.board,
              borderRadius: 18,
              padding,
              border: `2px solid ${wallsJustAdvanced ? colors.status.error + '50' : colors.border.primary}`,
              boxShadow: wallsJustAdvanced
                ? `0 0 40px ${colors.status.error}4d, inset 0 0 40px ${colors.status.error}0d`
                : `0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.2)`,
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
            onWatchBest={onWatchBestUnlimited}
          />
        )}

        {/* ── FOOTER / CONTROLS ───────────────────────────────────── */}
        <footer
          style={{
            width: '100%',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
            borderTop: `1px solid ${colors.border.primary}`,
            background: colors.game.footer,
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
              ...editorButtonStyles,
            }}
            title={editorButtonTitle}
          >
            <span style={{ fontSize: 16 }}>{editorButtonIcon}</span>
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
                if (solution === null && !isComputingSolution) {
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
              background: colors.game.overlay,
              borderRadius: 16,
              border: `1px solid ${colors.status.info}40`,
              boxShadow: `0 4px 24px ${colors.status.info}33`,
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

// HMR cleanup for GameBoard
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Intentional placeholder for HMR cleanup debugging
  });
}
