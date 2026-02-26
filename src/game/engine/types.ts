// PRESSURE - Engine Types
// Defines the interface for the pressure engine which handles all game mechanics.
// This can be swapped out or extended for different game behaviors.

import { GameState, Level, Tile } from '../types';

/**
 * Configuration for the pressure engine
 */
export interface PressureEngineConfig {
  /** Storage key for persistence */
  storageKey?: string;
  /** Whether audio is enabled by default */
  audioEnabled?: boolean;
  /** Default compression delay in ms */
  defaultCompressionDelay?: number;
  /** Timer tick interval in ms */
  tickInterval?: number;
}

/**
 * Context passed to engine hooks for mode-specific behavior
 */
export interface EngineContext {
  modeId: string;
  level: Level | null;
  getState: () => GameState;
  setState: (partial: Partial<GameState>) => void;
  sfx: (name: SoundEffect) => void;
}

/**
 * Sound effect names
 */
export type SoundEffect = 'rotate' | 'win' | 'lose' | 'crush' | 'start' | 'undo';

/**
 * Persistence data structure
 */
export interface PersistedState {
  completedLevels: number[];
  bestMoves: Record<number, number>;
  showTutorial: boolean;
  generatedLevels: Level[];
  currentModeId: string;
  seenTutorials: string[];
  animationsEnabled: boolean;
  lastPlayedLevelId: Record<string, number>;
  editorEnabled: boolean;
}

/**
 * Result of a wall advancement
 */
export interface WallAdvanceResult {
  tiles: Tile[];
  newOffset: number;
  gameOver: boolean;
  lossReason: string | null;
}

/**
 * Interface for the Pressure Engine
 * All methods are optional so modes can opt-in to only what they need.
 */
export interface IPressureEngine {
  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /** Called when the engine is initialized with store access */
  init?(getState: () => GameState, setState: (partial: Partial<GameState>) => void): void;

  /** Called when the engine is destroyed (cleanup) */
  destroy?(): void;

  // ─── Timers ────────────────────────────────────────────────────────────────

  /** Start the game timer */
  startTimer?(ctx: EngineContext): void;

  /** Stop the game timer */
  stopTimer?(): void;

  /** Clear all pending timers */
  clearTimers?(): void;

  /** Called on each timer tick */
  onTick?(ctx: EngineContext): Partial<GameState> | null;

  // ─── Audio ─────────────────────────────────────────────────────────────────

  /** Play a sound effect */
  playSound?(name: SoundEffect): void;

  /** Enable or disable audio */
  setAudioEnabled?(enabled: boolean): void;

  // ─── Persistence ───────────────────────────────────────────────────────────

  /** Load persisted state from storage */
  loadPersisted?(): PersistedState;

  /** Save state to storage */
  persist?(state: GameState): void;

  // ─── Compression ───────────────────────────────────────────────────────────

  /** Advance walls by one step */
  advanceWalls?(ctx: EngineContext): WallAdvanceResult | null;

  /** Resolve whether compression is enabled for current context */
  resolveCompressionEnabled?(
    level: Level | null,
    modeId: string,
    override: boolean | null
  ): boolean;

  // ─── Game Flow ─────────────────────────────────────────────────────────────

  /** Called when a level is loaded */
  onLoadLevel?(level: Level, ctx: EngineContext): Partial<GameState>;

  /** Called when a game starts */
  onGameStart?(ctx: EngineContext): Partial<GameState>;

  /** Called when a game ends (win or lose) */
  onGameEnd?(won: boolean, ctx: EngineContext): void;

  /** Called after a tile tap */
  onTileTap?(x: number, y: number, ctx: EngineContext): void;
}

/**
 * Factory function type for creating engines
 */
export type EngineFactory = (config?: PressureEngineConfig) => IPressureEngine;
