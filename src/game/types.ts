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
  /** Decoy tiles look like path tiles but aren't part of the solution path */
  isDecoy?: boolean;
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

/** Compression direction - which sides the walls compress from */
export type CompressionDirection =
  | 'all'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-bottom'
  | 'left-right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left-right'
  | 'bottom-left-right'
  | 'left-top-bottom'
  | 'right-top-bottom'
  | 'none';

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
  /** Which directions walls compress from. Default: 'all' (from all sides) */
  compressionDirection?: CompressionDirection;
  isGenerated?: boolean;
  solution?: { x: number; y: number; rotations: number }[];
  /** Score-based modes: win when score reaches this value */
  targetScore?: number;
  /** Time-based modes: game over when elapsedSeconds reaches this value (in seconds) */
  timeLimit?: number;
  /** Unlimited/endless mode: beat your previous high score to win */
  isUnlimited?: boolean;
  /** Opt-in feature flags for arcade modes (wildcard/bomb/comboChain/rain tiles) */
  features?: {
    wildcards?: boolean;
    bombs?: boolean;
    comboChain?: boolean;
    rain?: boolean;
    ice?: boolean;     // candy: frozen tiles spawn periodically
    thieves?: boolean; // shopping: thieves spawn periodically
  };
  /** Non-square grid support. gridCols = columns (x), gridRows = rows (y). Falls back to gridSize. */
  gridCols?: number;
  gridRows?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════════════════════════════ */

export type GameStatus = 'menu' | 'idle' | 'playing' | 'won' | 'lost' | 'tutorial' | 'paused';

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
  /** Whether the game is currently paused */
  isPaused: boolean;
  /** Whether the full-screen Arcade Hub picker is open */
  showArcadeHub: boolean;
  /** Currently selected world in the menu — persisted so returning from a level goes back to the same world */
  selectedWorld: number;
  /** Last played level ID per mode — used to highlight the level in the menu */
  lastPlayedLevelId: Record<string, number>;
  /** Editor state object */
  editor: EditorState;
}

/** Editor state */
export interface EditorState {
  /** Whether the editor is enabled */
  enabled: boolean;
  /** Which tool is selected */
  tool: 'select' | 'move' | 'node' | 'path' | 'wall' | 'eraser' | 'rotate' | 'decoy' | null;
  /** Currently selected tile position */
  selectedTile: { x: number; y: number } | null;
  /** Move source tile (for move tool) */
  moveSource: { x: number; y: number } | null;
  /** Connection presets for path tiles */
  connectionPreset: Direction[] | null;
  /** Custom grid size for editor (null = use level's gridSize) */
  gridSize: number | null;
  /** Compression direction for the level */
  compressionDirection: CompressionDirection;
  /** Saved state before entering editor (to restore on exit) */
  savedState: {
    tiles: Tile[];
    goalNodes: Position[];
    gridSize: number;
  } | null;
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
  openArcadeHub: () => void;
  closeArcadeHub: () => void;
  setSelectedWorld: (world: number) => void;
  toggleEditor: () => void;
  setEditorTool: (
    tool: 'select' | 'move' | 'node' | 'path' | 'wall' | 'eraser' | 'rotate' | 'decoy' | null
  ) => void;
  setEditorSelectedTile: (pos: { x: number; y: number } | null) => void;
  editorUpdateTile: (x: number, y: number) => void;
  editorRotateTile: (clockwise?: boolean) => void;
  editorMoveTile: (fromX: number, fromY: number, toX: number, toY: number) => void;
  editorToggleGoalNode: (x: number, y: number) => void;
  exportLevel: () => string;
  editorResizeGrid: (delta: number) => void;
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
