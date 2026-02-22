// PRESSURE - Core Game Types
// Single source of truth for all types used across the game.
// Re-exports mode-specific types so consumers only need one import.

/* ═══════════════════════════════════════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════════════════════════════════════ */

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Position {
  x: number
  y: number
}

/* ═══════════════════════════════════════════════════════════════════════════
   TILE
   The fundamental unit of the game grid.
   Modes can extend behavior via `displayData` without changing the core type.
   This is what allows swapping between pipe puzzles, slots, candy crush, etc.
═══════════════════════════════════════════════════════════════════════════ */

export type TileType = 'path' | 'node' | 'wall' | 'crushed' | 'empty'

export interface Tile {
  id: string
  x: number
  y: number
  type: TileType
  /** Pipe connection directions — can be repurposed by modes (e.g., match directions) */
  connections: Direction[]
  canRotate: boolean
  isGoalNode: boolean
  justRotated?: boolean
  justCrushed?: boolean
  /**
   * Arbitrary mode-specific display data.
   * For slots: { symbol: '🍒', reel: 0 }
   * For candy crush: { color: 'red', shape: 'circle' }
   * Pipe modes leave this undefined.
   */
  displayData?: Record<string, unknown>
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL
═══════════════════════════════════════════════════════════════════════════ */

export interface Level {
  id: number
  name: string
  world: number
  gridSize: number
  tiles: Tile[]
  goalNodes: Position[]
  maxMoves: number
  compressionDelay: number
  compressionEnabled?: boolean
  isGenerated?: boolean
  solution?: { x: number; y: number; rotations: number }[]
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════════════════════════════ */

export type GameStatus = 'menu' | 'idle' | 'playing' | 'won' | 'lost' | 'tutorial'

export interface GameState {
  currentLevel: Level | null
  tiles: Tile[]
  wallOffset: number
  compressionActive: boolean
  compressionDelay: number
  moves: number
  status: GameStatus
  completedLevels: number[]
  bestMoves: Record<number, number>
  history: Tile[][]
  lastRotatedPos: Position | null
  showTutorial: boolean
  seenTutorials: string[]
  generatedLevels: Level[]
  elapsedSeconds: number
  screenShake: boolean
  timeUntilCompression: number
  wallsJustAdvanced: boolean
  showingWin: boolean
  connectedTiles: Set<string>
  currentModeId: string
  compressionOverride: boolean | null
  /** Guards against re-entrant win checks */
  _winCheckPending: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAME ACTIONS
═══════════════════════════════════════════════════════════════════════════ */

export interface GameActions {
  loadLevel: (level: Level) => void
  restartLevel: () => void
  startGame: () => void
  tapTile: (x: number, y: number) => void
  checkWin: () => boolean
  undoMove: () => void
  advanceWalls: () => void
  tickTimer: () => void
  tickCompressionTimer: () => void
  triggerShake: () => void
  goToMenu: () => void
  completeTutorial: () => void
  setGameMode: (modeId: string) => void
  setCompressionOverride: (enabled: boolean | null) => void
  addGeneratedLevel: (level: Level) => void
  deleteGeneratedLevel: (id: number) => void
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
} from './modes/types'
