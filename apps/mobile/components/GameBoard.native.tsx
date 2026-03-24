import React, { useMemo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
// Text and Pressable used for idle overlay below
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';
import { getModeById } from '@/game/modes';
import { setUnlimitedHighScore } from '@/game/unlimited';
import GameGrid from './GameGrid.native';
import WallOverlay from './WallOverlay.native';
import StarField from './StarField.native';
import WinOverlay from './WinOverlay.native';
import LossOverlay from './LossOverlay.native';
import FeatureIndicators from './FeatureIndicators.native';
import StatsBar from './StatsBar.native';
import GameBoardFooter from './GameBoardFooter.native';
import { styles } from './GameBoardStyles.native';

function computeTileSize(availW: number, availH: number, cols: number, rows: number): number {
  const maxDim = Math.max(cols, rows);
  const gap = maxDim <= 5 ? 4 : 3;
  const byW = Math.floor((availW - gap * (cols - 1)) / cols);
  const byH = Math.floor((availH - gap * (rows - 1)) / rows);
  return Math.max(20, Math.min(byW, byH));
}

export default function GameBoard() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const {
    tiles,
    currentLevel,
    status,
    moves,
    score,
    elapsedSeconds,
    wallOffset,
    wallsJustAdvanced,
    compressionActive,
    connectedTiles,
    timeUntilCompression,
    isPaused,
    history,
    currentModeId,
    modeState,
    lossReason,
    levelWins,
    levelAttempts,
    tapTile,
    startGame,
    restartLevel,
    loadLevel,
    goToMenu,
    undoMove,
    pauseGame,
    resumeGame,
  } = useGameStore(
    useShallow((state) => ({
      tiles: state.tiles,
      currentLevel: state.currentLevel,
      status: state.status,
      moves: state.moves,
      score: state.score,
      elapsedSeconds: state.elapsedSeconds,
      wallOffset: state.wallOffset,
      wallsJustAdvanced: state.wallsJustAdvanced,
      compressionActive: state.compressionActive,
      connectedTiles: state.connectedTiles,
      timeUntilCompression: state.timeUntilCompression,
      isPaused: state.isPaused,
      history: state.history,
      currentModeId: state.currentModeId,
      modeState: state.modeState,
      lossReason: state.lossReason,
      levelWins: state.levelWins,
      levelAttempts: state.levelAttempts,
      tapTile: state.tapTile,
      startGame: state.startGame,
      loadLevel: state.loadLevel,
      restartLevel: state.restartLevel,
      goToMenu: state.goToMenu,
      undoMove: state.undoMove,
      pauseGame: state.pauseGame,
      resumeGame: state.resumeGame,
    }))
  );

  const mode = getModeById(currentModeId);

  // 1-based level number within the current mode's level list
  const allModeLevels = mode.getLevels?.() ?? [];
  const levelNumber = currentLevel
    ? allModeLevels.findIndex((l) => l.id === currentLevel.id) + 1
    : 0;

  // Countdown seconds from timeUntilCompression (ms)
  const countdownSec = Math.ceil((timeUntilCompression ?? 0) / 1000);

  // Compression bar fill % — starts full, drains to 0
  const compressionDelay = currentLevel?.compressionDelay ?? 15000;
  const compressionPct = Math.max(
    0,
    Math.min(100, ((timeUntilCompression ?? 0) / compressionDelay) * 100)
  );

  const maxMoves = currentLevel?.maxMoves ?? null;
  const isUnlimited = currentLevel?.isUnlimited ?? false;

  // Track unlimited high scores when game ends
  useEffect(() => {
    if (!isUnlimited || !currentLevel) return;
    if (status === 'lost' || status === 'won') {
      setUnlimitedHighScore(currentModeId, currentLevel.id, score);
    }
  }, [status, isUnlimited, currentLevel, currentModeId, score]);

  // Unlimited levels (timeLimit set) override statsDisplay to score + timeleft
  const hasTimeLimit = currentLevel?.timeLimit != null;
  const timeLeft = hasTimeLimit
    ? Math.max(0, currentLevel!.timeLimit! - elapsedSeconds)
    : undefined;
  const activeStatsDisplay = hasTimeLimit
    ? [{ type: 'score' as const }, { type: 'timeleft' as const }]
    : (mode.statsDisplay ?? []);

  const showMoves = activeStatsDisplay.some((s) => s.type === 'moves');
  const showScore = activeStatsDisplay.some((s) => s.type === 'score');
  const showTimeLeft = activeStatsDisplay.some((s) => s.type === 'timeleft');
  const showStats = activeStatsDisplay.length > 0;
  const showCompression = activeStatsDisplay.some((s) => s.type === 'compressionBar');
  const showCountdown = activeStatsDisplay.some((s) => s.type === 'countdown');
  const showUndo = mode.supportsUndo !== false;
  const showTimer = showCompression || showCountdown;

  // Tile size calculation — fill available vertical space
  const HEADER_H = 64;
  const STATS_H = showStats ? 64 : 0;
  const hasFeatures = currentLevel?.features && Object.values(currentLevel.features).some(Boolean);
  const FEATURES_H = hasFeatures ? 36 : 0;
  const FOOTER_H = 64;
  const SAFE_TOP = insets.top;
  const SAFE_BOT = insets.bottom;
  const availH = height - HEADER_H - STATS_H - FEATURES_H - FOOTER_H - SAFE_TOP - SAFE_BOT - 32;
  const availW = width - 24;

  const gridCols = currentLevel?.gridCols ?? currentLevel?.gridSize ?? 5;
  const gridRows = currentLevel?.gridRows ?? currentLevel?.gridSize ?? 5;

  const tileSize = useMemo(
    () => computeTileSize(availW, availH, gridCols, gridRows),
    [availW, availH, gridCols, gridRows]
  );

  const gap = Math.max(gridCols, gridRows) <= 5 ? 4 : 3;

  const handleTileTap = useCallback(
    (x: number, y: number) => {
      tapTile(x, y);
    },
    [tapTile]
  );

  if (!currentLevel) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StarField />

      {/* ── HEADER ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={goToMenu} hitSlop={8}>
          <Text style={styles.iconBtnText}>←</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.levelName}>{currentLevel.name}</Text>
          <Text style={styles.levelSub}>
            LEVEL {levelNumber > 0 ? levelNumber : currentLevel.id}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn} onPress={restartLevel} hitSlop={8}>
            <Text style={styles.iconBtnText}>↺</Text>
          </Pressable>
        </View>
      </View>

      {/* ── STATS BAR ───────────────────────────────── */}
      {showStats && (
        <StatsBar
          mode={mode}
          score={score}
          moves={moves}
          maxMoves={maxMoves}
          countdownSec={countdownSec}
          compressionPct={compressionPct}
          compressionActive={compressionActive}
          timeLeft={timeLeft}
          showScore={showScore}
          showMoves={showMoves}
          showCompression={showCompression}
          showCountdown={showCountdown}
          showTimeLeft={showTimeLeft}
        />
      )}

      {/* ── FEATURE INDICATORS ──────────────────────────── */}
      <FeatureIndicators features={currentLevel?.features} tiles={tiles} modeState={modeState} />

      {/* ── GAME GRID ───────────────────────────────── */}
      <View style={styles.gridWrap}>
        <View style={styles.boardBorder}>
          <GameGrid
            tiles={tiles}
            gridSize={tileSize}
            gridCols={gridCols}
            gridRows={gridRows}
            gap={gap}
            wallOffset={wallOffset}
            wallsJustAdvanced={wallsJustAdvanced}
            compressionActive={compressionActive}
            connectedTiles={connectedTiles}
            compressionDirection={currentLevel.compressionDirection ?? 'all'}
            onTileTap={handleTileTap}
            tileRenderer={mode.tileRenderer}
          />
          <WallOverlay
            wallOffset={wallOffset}
            gridCols={gridCols}
            gridRows={gridRows}
            tileSize={tileSize}
            gap={gap}
            isPlaying={status === 'playing'}
            compressionDirection={currentLevel.compressionDirection ?? 'all'}
          />
        </View>
      </View>

      {/* ── FOOTER CONTROLS ─────────────────────────── */}
      <GameBoardFooter
        showUndo={showUndo}
        showTimer={showTimer}
        isPaused={isPaused}
        historyLength={history.length}
        timeUntilCompression={timeUntilCompression}
        paddingBottom={insets.bottom + 4}
        onUndo={undoMove}
        onPause={pauseGame}
        onResume={resumeGame}
      />

      {/* ── IDLE OVERLAY (READY TO START) ───────────── */}
      {status === 'idle' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayLabel}>READY</Text>
          <Text style={styles.overlayTitle}>{currentLevel.name}</Text>
          <Text style={styles.overlayLevelSub}>
            LEVEL {levelNumber > 0 ? levelNumber : currentLevel.id}
          </Text>
          <Pressable style={[styles.overlayBtn, styles.overlayBtnPrimary]} onPress={startGame}>
            <Text style={[styles.overlayBtnText, { color: '#fff' }]}>START</Text>
          </Pressable>
        </View>
      )}

      {/* ── WIN OVERLAY ─────────────────────────────── */}
      {status === 'won' && (
        <WinOverlay
          mode={mode}
          currentLevel={currentLevel}
          currentModeId={currentModeId}
          moves={moves}
          score={score}
          elapsedSeconds={elapsedSeconds}
          levelWins={levelWins}
          levelAttempts={levelAttempts}
          restartLevel={restartLevel}
          goToMenu={goToMenu}
          loadLevel={loadLevel}
        />
      )}

      {/* ── LOSS OVERLAY ─────────────────────────────── */}
      {status === 'lost' && (
        <LossOverlay
          mode={mode}
          currentLevel={currentLevel}
          currentModeId={currentModeId}
          moves={moves}
          score={score}
          elapsedSeconds={elapsedSeconds}
          lossReason={lossReason}
          levelWins={levelWins}
          levelAttempts={levelAttempts}
          restartLevel={restartLevel}
          goToMenu={goToMenu}
        />
      )}
    </View>
  );
}
