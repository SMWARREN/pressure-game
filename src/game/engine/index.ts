// PRESSURE - Pressure Engine
// The main game engine that coordinates all game mechanics.
// This is fully customizable - swap out any part for different behavior.

import { TimerSystem, createTimerSystem } from './timer';
import { AudioSystem, createAudioSystem } from './audio';
import { PersistenceSystem, createPersistenceSystem } from './persistence';
import { CompressionSystem, createCompressionSystem } from './compression';
import type {
  IPressureEngine,
  PressureEngineConfig,
  EngineContext,
  SoundEffect,
  PersistedState,
  WallAdvanceResult,
} from './types';
import type { AchievementEngine } from '../achievements/engine';
import type { GameState, Level, Tile } from '../types';
import { getModeById } from '../modes';
import { getConnectedTiles } from '../modes/utils';
import { saveHighscore, saveReplay } from '../api/leaderboards';

// Re-export types and systems
export * from './types';
export { TimerSystem, createTimerSystem } from './timer';
export { AudioSystem, createAudioSystem } from './audio';
export { PersistenceSystem, createPersistenceSystem } from './persistence';
export { CompressionSystem, createCompressionSystem } from './compression';

/**
 * Default engine configuration
 */
const DEFAULT_CONFIG: PressureEngineConfig = {
  storageKey: 'pressure_save_v3',
  audioEnabled: true,
  defaultCompressionDelay: 10000,
  tickInterval: 1000,
};

/**
 * The main Pressure Engine class.
 * Coordinates timer, audio, persistence, and compression systems.
 * Can be extended or replaced for custom game behavior.
 */
export class PressureEngine implements IPressureEngine {
  private readonly config: PressureEngineConfig;
  private readonly timer: TimerSystem;
  private readonly audio: AudioSystem;
  private readonly persistence: PersistenceSystem;
  private readonly compression: CompressionSystem;

  // Store reference for callbacks
  private getState: (() => GameState) | null = null;
  private setState: ((partial: Partial<GameState>) => void) | null = null;
  private achievementEngine: AchievementEngine | null = null;

  constructor(config: PressureEngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.timer = createTimerSystem(this.config.tickInterval);
    this.audio = createAudioSystem(this.config.audioEnabled);
    this.persistence = createPersistenceSystem(
      this.config.storageKey,
      this.config.persistenceBackend
    );
    this.compression = createCompressionSystem();
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Initialize the engine with store access
   */
  init(getState: () => GameState, setState: (partial: Partial<GameState>) => void): void {
    this.getState = getState;
    this.setState = setState;
  }

  /**
   * Set the achievement engine instance
   */
  setAchievementEngine(engine: AchievementEngine): void {
    this.achievementEngine = engine;
  }

  /**
   * Destroy the engine and cleanup resources
   */
  destroy(): void {
    this.timer.destroy();
    this.audio.destroy();
    this.getState = null;
    this.setState = null;
  }

  // ─── Store Integration ──────────────────────────────────────────────────────

  /**
   * Create an engine context for the current state
   */
  createContext(): EngineContext {
    const state = this.getState!();
    return {
      modeId: state.currentModeId,
      level: state.currentLevel,
      getState: this.getState!,
      setState: this.setState!,
      sfx: (name: SoundEffect) => this.playSound(name),
    };
  }

  // ─── Timers ────────────────────────────────────────────────────────────────

  /**
   * Start the game timer
   */
  startTimer(): void {
    this.timer.startTimer(() => {
      if (this.getState && this.setState) {
        const updates = this.onTick();
        if (updates) {
          this.setState(updates);
          // After applying tick updates, check win condition.
          // This enables tick-driven win detection (e.g. Fuse chain reaction
          // reaching all relays) without bypassing the win animation.
          const s = this.getState();
          // Guard: only check win if still playing and no win check is pending
          if (s.status === 'playing' && s.currentLevel && !s._winCheckPending) {
            const mode = getModeById(s.currentModeId);
            const ms = { score: s.score, targetScore: s.currentLevel.targetScore };
            const { won } = mode.checkWin(
              s.tiles,
              s.currentLevel.goalNodes,
              s.moves,
              s.currentLevel.maxMoves,
              ms
            );
            if (won) this.handleWin(s.tiles, s.currentLevel.goalNodes);
          }
        }
      }
    });
  }

  /**
   * Stop the game timer
   */
  stopTimer(): void {
    this.timer.stopTimer();
  }

  /**
   * Clear all pending timers
   */
  clearTimers(): void {
    this.timer.clearAll();
  }

  /**
   * Schedule a timeout
   */
  setTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
    return this.timer.setTimeout(fn, delay);
  }

  /**
   * Handle timer tick - returns state updates
   */
  // ── Tick helpers ─────────────────────────────────────────────────────────
  private handleModeTick(
    mode: ReturnType<typeof getModeById>,
    state: GameState,
    currentLevel: Level,
    newElapsedSeconds: number,
    stateChanges: Partial<GameState>
  ): void {
    if (!mode.onTick) return;
    const modeState = {
      score: state.score,
      targetScore: currentLevel.targetScore,
      levelId: currentLevel.id,
      world: currentLevel.world,
      features: currentLevel.features,
      timeLeft: currentLevel.timeLimit
        ? Math.max(0, currentLevel.timeLimit - newElapsedSeconds)
        : undefined,
    };
    const modeChanges = mode.onTick(state, modeState);
    if (modeChanges) {
      Object.assign(stateChanges, modeChanges);
    }
  }

  private checkTimeLimit(
    currentLevel: Level,
    newElapsedSeconds: number,
    state: GameState,
    stateChanges: Partial<GameState>
  ): Partial<GameState> | null {
    if (!currentLevel.timeLimit || newElapsedSeconds < currentLevel.timeLimit) {
      return null;
    }
    const currentScore = state.score;
    const targetScore = currentLevel.targetScore ?? Infinity;
    return currentScore < targetScore
      ? { ...stateChanges, status: 'lost', lossReason: "Time's up!" }
      : null;
  }

  private handleCompression(
    currentLevel: Level,
    currentModeId: string,
    compressionOverride: boolean | null,
    timeUntilCompression: number,
    stateChanges: Partial<GameState>
  ): Partial<GameState> | null {
    const compressionEnabled = this.compression.resolveEnabled(
      currentLevel,
      currentModeId,
      compressionOverride
    );

    if (!compressionEnabled) {
      return stateChanges;
    }

    let newTimeUntilCompression = timeUntilCompression - 1000;
    if (newTimeUntilCompression <= 0) {
      newTimeUntilCompression = currentLevel.compressionDelay;
      if (this.setState) {
        this.setState({ ...stateChanges, timeUntilCompression: newTimeUntilCompression });
      }
      this.advanceWalls();
      return null;
    }

    stateChanges.timeUntilCompression = newTimeUntilCompression;
    return stateChanges;
  }

  onTick(): Partial<GameState> | null {
    if (!this.getState || !this.setState) return null;

    const state = this.getState();
    const {
      status,
      timeUntilCompression,
      compressionActive,
      currentLevel,
      currentModeId,
      compressionOverride,
      elapsedSeconds,
      isPaused,
    } = state;

    if (status !== 'playing' || !currentLevel || isPaused) return null;

    const newElapsedSeconds = elapsedSeconds + 1;
    let stateChanges: Partial<GameState> = { elapsedSeconds: newElapsedSeconds };

    const mode = getModeById(currentModeId);
    this.handleModeTick(mode, state, currentLevel, newElapsedSeconds, stateChanges);

    const timeLimitResult = this.checkTimeLimit(
      currentLevel,
      newElapsedSeconds,
      state,
      stateChanges
    );
    if (timeLimitResult) return timeLimitResult;

    if (!compressionActive) {
      return stateChanges;
    }

    return this.handleCompression(
      currentLevel,
      currentModeId,
      compressionOverride,
      timeUntilCompression,
      stateChanges
    );
  }

  // ─── Audio ─────────────────────────────────────────────────────────────────

  /**
   * Play a sound effect
   */
  playSound(name: SoundEffect): void {
    this.audio.play(name);
  }

  /**
   * Enable or disable audio
   */
  setAudioEnabled(enabled: boolean): void {
    this.audio.setEnabled(enabled);
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    return this.audio.isEnabled();
  }

  // ─── Persistence ───────────────────────────────────────────────────────────

  /**
   * Load persisted state from storage
   */
  loadPersisted(): PersistedState {
    return this.persistence.load();
  }

  /**
   * Save state to storage
   */
  persist(state: GameState): void {
    this.persistence.save(state);
  }

  /**
   * Build persistence payload from state
   */
  buildPersistPayload(state: GameState): PersistedState {
    return this.persistence.buildPayload(state);
  }

  // ─── Walkthrough Persistence ───────────────────────────────────────────

  /**
   * Check if a walkthrough has been seen
   */
  isWalkthroughSeen(modeId: string, levelId: number): boolean {
    return this.persistence.isWalkthroughSeen(modeId, levelId);
  }

  /**
   * Mark a walkthrough as seen
   */
  markWalkthroughSeen(modeId: string, levelId: number): void {
    this.persistence.markWalkthroughSeen(modeId, levelId);
  }

  /**
   * Reset a walkthrough
   */
  resetWalkthrough(modeId: string, levelId: number): void {
    this.persistence.resetWalkthrough(modeId, levelId);
  }

  /**
   * Mark multiple walkthroughs as seen
   */
  markAllWalkthroughsSeen(modes: string[], levelIds: number[]): void {
    this.persistence.markAllWalkthroughsSeen(modes, levelIds);
  }

  // ─── High Score Persistence ────────────────────────────────────────────

  /**
   * Get high score for a level
   */
  getHighScore(modeId: string, levelId: number): number | null {
    return this.persistence.getHighScore(modeId, levelId);
  }

  /**
   * Set high score for a level
   */
  setHighScore(modeId: string, levelId: number, score: number): void {
    this.persistence.setHighScore(modeId, levelId, score);
  }

  // ─── State Editor Presets ───────────────────────────────────────────────

  /**
   * Get all editor presets
   */
  getEditorPresets(): unknown[] {
    return this.persistence.getEditorPresets();
  }

  /**
   * Save editor presets
   */
  setEditorPresets(presets: unknown[]): void {
    this.persistence.setEditorPresets(presets);
  }

  // ─── Compression ───────────────────────────────────────────────────────────

  /**
   * Resolve whether compression is enabled
   */
  resolveCompressionEnabled(
    level: Level | null,
    modeId: string,
    override: boolean | null
  ): boolean {
    return this.compression.resolveEnabled(level, modeId, override);
  }

  /**
   * Advance walls by one step
   */
  advanceWalls(): WallAdvanceResult | null {
    if (!this.getState || !this.setState) return null;

    const state = this.getState();
    const { tiles, wallOffset, currentLevel, status } = state;

    if (!currentLevel || status !== 'playing') return null;

    const ctx = this.createContext();
    const result = this.compression.advance(tiles, wallOffset, currentLevel, ctx);

    if (result.gameOver) {
      this.stopTimer();
      this.playSound('lose');
      this.setState({
        tiles: result.tiles,
        wallOffset: result.newOffset,
        status: 'lost',
        wallsJustAdvanced: true,
        lossReason: result.lossReason,
      });
    } else if (result.newOffset > wallOffset) {
      // Walls actually advanced — animate and play sound
      this.playSound('crush');
      this.setState({
        tiles: result.tiles,
        wallOffset: result.newOffset,
        wallsJustAdvanced: true,
      });

      // Track walls survived for achievements
      this.trackWallsSurvived();

      // Clear wallsJustAdvanced after animation
      this.setTimeout(() => {
        if (this.setState) {
          this.setState({ wallsJustAdvanced: false });
        }
      }, 600);
    }
    // else: max offset already reached — walls didn't move, do nothing

    return result;
  }

  // ─── Game Flow Helpers ─────────────────────────────────────────────────────

  /**
   * Get initial state for a new level
   */
  getInitialLevelState(level: Level): Partial<GameState> {
    const state = this.getState!();
    const mode = getModeById(state.currentModeId);
    const initialModeState = mode.initialState ? mode.initialState(state) : {};

    // Clear any pending timeouts from previous game
    this.clearTimers();

    // Save the last played level ID for this mode
    const modeId = state.currentModeId;
    const newLastPlayed = { ...state.lastPlayedLevelId, [modeId]: level.id };
    this.persist({ ...state, lastPlayedLevelId: newLastPlayed });

    // Copy tiles and apply mode-specific initialization (e.g., beam tracing for Laser Relay)
    let tiles = level.tiles.map((t) => ({ ...t, connections: [...t.connections] }));
    if (mode.initTiles) {
      tiles = mode.initTiles(tiles, level);
    }

    return {
      currentLevel: level,
      tiles,
      wallOffset: 0,
      compressionActive: false,
      compressionDelay: level.compressionDelay,
      moves: 0,
      status: 'idle',
      history: [],
      lastRotatedPos: null,
      elapsedSeconds: 0,
      screenShake: false,
      timeUntilCompression: level.compressionDelay,
      wallsJustAdvanced: false,
      showingWin: false,
      connectedTiles: new Set(),
      score: 0,
      lossReason: null,
      modeState: initialModeState,
      _winCheckPending: false,
      isPaused: false,
      lastPlayedLevelId: newLastPlayed,
    };
  }

  /**
   * Get initial game state from persisted data
   */
  getInitialState(): GameState {
    const saved = this.loadPersisted();
    const needsTutorial = saved.showTutorial || !saved.seenTutorials.includes(saved.currentModeId);

    return {
      currentLevel: null,
      tiles: [],
      wallOffset: 0,
      compressionActive: false,
      compressionDelay: 10000,
      moves: 0,
      status: needsTutorial ? 'tutorial' : 'menu',
      completedLevels: saved.completedLevels,
      bestMoves: saved.bestMoves,
      history: [],
      lastRotatedPos: null,
      showTutorial: saved.showTutorial,
      seenTutorials: saved.seenTutorials,
      generatedLevels: saved.generatedLevels,
      elapsedSeconds: 0,
      screenShake: false,
      timeUntilCompression: 0,
      wallsJustAdvanced: false,
      showingWin: false,
      connectedTiles: new Set(),
      currentModeId: saved.currentModeId,
      compressionOverride: null,
      animationsEnabled: saved.animationsEnabled,
      theme: saved.theme,
      score: 0,
      lossReason: null,
      modeState: {},
      _winCheckPending: false,
      isPaused: false,
      showArcadeHub: false,
      showPressureHub: false,
      lastPlayedLevelId: saved.lastPlayedLevelId,
      selectedWorld: 1,
      editor: {
        enabled: false,
        tool: null,
        selectedTile: null,
        moveSource: null,
        connectionPreset: null,
        gridSize: null,
        compressionDirection: 'all',
        savedState: null,
      },
      featuredLevel: null,
    };
  }

  /**
   * Handle win condition
   */
  handleWin(tiles: Tile[], goalNodes: { x: number; y: number }[]): void {
    if (!this.getState || !this.setState) return;

    const state = this.getState();
    const mode = getModeById(state.currentModeId);

    // Store the level ID we're winning for - if it changes, abort
    const winningLevelId = state.currentLevel?.id;

    const connected = mode.getWinTiles
      ? mode.getWinTiles(tiles, goalNodes)
      : getConnectedTiles(tiles, goalNodes);

    this.stopTimer();
    this.playSound('win');

    this.setState({
      showingWin: true,
      connectedTiles: connected,
      compressionActive: false,
      _winCheckPending: true,
    });

    // Complete win after delay
    this.setTimeout(() => {
      if (!this.getState || !this.setState) return;

      const s = this.getState();

      // Guard: if we've already moved to a different level, abort
      if (s.currentLevel?.id !== winningLevelId) return;

      // Guard: if status changed (e.g., loaded new level), abort
      if (s.status !== 'playing' && s.status !== 'won') return;

      const level = s.currentLevel!;
      const newCompleted = [...new Set([...s.completedLevels, level.id])];
      const newBest = { ...s.bestMoves };
      const bestKey = `${s.currentModeId}:${level.id}`;
      if (!newBest[bestKey] || s.moves < newBest[bestKey]) {
        newBest[bestKey] = s.moves;
      }

      this.persist({
        ...s,
        completedLevels: newCompleted,
        bestMoves: newBest,
        showTutorial: false,
      });

      this.setState({
        status: 'won',
        completedLevels: newCompleted,
        bestMoves: newBest,
        _winCheckPending: false,
      });

      // Save highscore and replay to API (in background)
      saveHighscore(s.currentModeId, level.id, s.moves).catch((err) =>
        console.warn('Failed to save highscore to API:', err)
      );

      // Save replay (currently saves with empty moveLog - will be populated by stats engine)
      saveReplay(s.currentModeId, level.id, [], s.moves).catch((err) =>
        console.warn('Failed to save replay to API:', err)
      );

      // Check achievements after winning
      this.checkAchievementsOnWin(s, level);
    }, 600);
  }

  /**
   * Check achievements when a level is won
   */
  private checkAchievementsOnWin(state: GameState, level: Level): void {
    if (!this.achievementEngine) return;

    // We just completed 1 level (not a cumulative count)
    const levelsCompleted = 1;

    // Check if this was a speedrun (under 10 seconds)
    const speedruns = state.elapsedSeconds < 10 ? 1 : 0;

    // Check if moves were under par (par is typically maxMoves or a fraction of it)
    const movesUnderPar = level.maxMoves && state.moves < level.maxMoves ? 1 : 0;

    // Get current mode for mode-specific achievements
    const currentModeId = state.currentModeId;

    // Check for speed level achievement (under 5 seconds)
    const speedLevel = state.elapsedSeconds < 5;

    // Check for perfect level (no undo used = history empty or minimal)
    const perfectLevel = state.history.length === 0 || state.moves === 1;

    const newlyEarned = this.achievementEngine.checkAchievements({
      levelsCompleted,
      movesUnderPar,
      speedruns,
      currentStreak: this.achievementEngine.getCurrentStreak(),
      noHintsLevels: 0, // Not yet implemented
      perfectWorlds: 0, // Not yet implemented
      wallsSurvived: 0, // Tracked separately via advanceWalls
      currentModeId,
      currentLevelId: level.id,
      currentWorldId: level.world,
      speedLevel,
      perfectLevel,
    });

    if (newlyEarned.length > 0) {
      console.log('[Achievements] Newly earned:', newlyEarned);
    }

    // Check for "First Try" achievement
    this.achievementEngine.checkFirstTryAchievement(currentModeId, level.id);

    // Check for perfect streak achievement
    if (perfectLevel) {
      this.achievementEngine.checkPerfectStreakAchievement();
    }
  }

  /**
   * Track walls survived for achievements
   */
  private trackWallsSurvived(): void {
    if (!this.achievementEngine) return;
    const progress = this.achievementEngine.getProgress('survivor');
    const current = progress?.current ?? 0;
    this.achievementEngine.updateProgress('survivor', current + 1);
  }
}

/**
 * Create a pressure engine instance
 */
export function createPressureEngine(config?: PressureEngineConfig): PressureEngine {
  return new PressureEngine(config);
}
