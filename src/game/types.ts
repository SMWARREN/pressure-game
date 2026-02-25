// PRESSURE - Core Game Types
// Single source of truth for all types used across the game.
// Re-exports mode-specific types so consumers only need one import.

/* ═══════════════════════════════════════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════════════════════════════════════ */

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

/** Mathematical operators for Quantum Chain mode */
export type OperatorSymbol = '+' | '-' | '*' | '/'; // Add more as needed

/** Effects for Quantum Flux tiles in Quantum Chain mode */
export type QuantumFluxEffect = 'double' | 'halve' | 'add' | 'subtract'; // Add more as needed

/** Specific data for 'number' type tiles */
export interface NumberTileData extends Record<string, unknown> {
  baseValue: number;
  currentValue?: number; // Computed value after flux
}

/** Specific data for 'operator' type tiles */
export interface OperatorTileData extends Record<string, unknown> {
  symbol: OperatorSymbol;
}

/** Specific data for 'quantumFlux' type tiles */
export interface QuantumFluxTileData extends Record<string, unknown> {
  effect: QuantumFluxEffect;
  value?: number; // e.g., for 'add 5' or 'subtract 3'
}

/** Specific data for 'target' type tiles */
export interface TargetTileData extends Record<string, unknown> {
  targetSum: number;
  isFulfilled: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TILE
   The fundamental unit of the game grid.
   Modes can extend behavior via `displayData` without changing the core type.
   This is what allows swapping between pipe puzzles, slots, candy crush, etc.
═══════════════════════════════════════════════════════════════════════════ */

export type TileType =
  | 'path'
  | 'node'
  | 'wall'
  | 'crushed'
  | 'empty'
  | 'number'
  | 'operator'
  | 'quantumFlux'
  | 'target';

export interface Tile {
  id: string;
  x: number;
  y: number;
  type: TileType;
  /** Pipe connection directions — can be repurposed by modes (e.g., match directions) */
  connections: Direction[];
  canRotate: boolean;
  isGoalNode: boolean;
  justRotated?: boolean;
  justCrushed?: boolean;
  /**
   * Arbitrary mode-specific display data.
   * For slots: { symbol: '🍒', reel: 0 }
   * For candy crush: { color: 'red', shape: 'circle' }
   * Pipe modes leave this undefined.
   */
  displayData?:
    | NumberTileData
    | OperatorTileData
    | QuantumFluxTileData
    | TargetTileData
    | (Record<string, unknown> & {
        symbol?: any;
        frozen?: any;
        isNew?: any;
        activeSymbols?: any;
      });
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL
═══════════════════════════════════════════════════════════════════════════ */

export interface Level {
  id: number;
  name: string;
  world: number;
  gridSize: number;
  tiles: Tile[];
  goalNodes: Position[];
  maxMoves: number;
  compressionDelay: number;
  compressionEnabled?: boolean;
  isGenerated?: boolean;
  solution?: { x: number; y: number; rotations: number }[];
  /** Score-based modes: win when score reaches this value */
  targetScore?: number;
  /** Time-based modes: game over when elapsedSeconds reaches this value (in seconds) */
  timeLimit?: number;
  /** Unlimited/endless mode: beat your previous high score to win */
  isUnlimited?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════════════════════════════ */

export type GameStatus = 'menu' | 'idle' | 'playing' | 'won' | 'lost' | 'tutorial';

export interface GameState {
  currentLevel: Level | null;
  tiles: Tile[];
  wallOffset: number;
  compressionActive: boolean;
  compressionDelay: number;
  moves: number;
  modeState?: Record<string, unknown>;
  status: GameStatus;
  completedLevels: number[];
  bestMoves: Record<number, number>;
  history: Tile[][];
  lastRotatedPos: Position | null;
  showTutorial: boolean;
  seenTutorials: string[];
  generatedLevels: Level[];
  elapsedSeconds: number;
  screenShake: boolean;
  timeUntilCompression: number;
  wallsJustAdvanced: boolean;
  showingWin: boolean;
  connectedTiles: Set<string>;
  currentModeId: string;
  compressionOverride: boolean | null;
  animationsEnabled: boolean;
  /** Running score — used by score-based modes like Candy */
  score: number;
  /** Guards against re-entrant win checks */
  _winCheckPending: boolean;
  /** Timestamp to trigger walkthrough replay when set */
  _replayWalkthrough?: number;
  /** Reason for the current loss — shown in the game-over overlay */
  lossReason: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAME ACTIONS
═══════════════════════════════════════════════════════════════════════════ */

export interface GameActions {
  loadLevel: (level: Level) => void;
  restartLevel: () => void;
  startGame: () => void;
  tapTile: (x: number, y: number) => void;
  checkWin: () => boolean;
  undoMove: () => void;
  advanceWalls: () => void;
  tickTimer: () => void;
  tickCompressionTimer: () => void;
  triggerShake: () => void;
  goToMenu: () => void;
  completeTutorial: () => void;
  replayTutorial: () => void;
  replayWalkthrough: () => void;
  setGameMode: (modeId: string) => void;
  setCompressionOverride: (enabled: boolean | null) => void;
  addGeneratedLevel: (level: Level) => void;
  deleteGeneratedLevel: (id: number) => void;
  toggleAnimations: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RE-EXPORTS — consumers import everything from '@/game/types'
═══════════════════════════════════════════════════════════════════════════ */

export type {
  TutorialStep,
  TutorialDemoType,
  GameModeConfig,
  TapResult,
  WinResult,
  LossResult,
  WallCompressionSetting,
  TileRenderer,
} from './modes/types';
