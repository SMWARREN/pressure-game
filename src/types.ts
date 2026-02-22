// PRESSURE - Core Game Types

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export interface Tile {
  x: number
  y: number
  type: 'empty' | 'path' | 'node' | 'wall' | 'crushed'
  connections: Direction[]
  canRotate: boolean
  isGoalNode: boolean
  justRotated?: boolean
  justCrushed?: boolean
}

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
  solution?: { x: number; y: number; rotations: number }[]
}

export interface GameState {
  currentLevel: Level | null
  tiles: Tile[]
  wallOffset: number
  compressionActive: boolean
  compressionDelay: number
  moves: number
  status: 'menu' | 'idle' | 'playing' | 'won' | 'lost' | 'tutorial'
  completedLevels: number[]
  bestMoves: Record<number, number>
  history: Tile[][]
  lastRotatedPos: Position | null
  /** Legacy: true = show tutorial on first launch */
  showTutorial: boolean
  /** Per-mode tutorial tracking: list of mode IDs whose tutorial has been seen */
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
}

export interface GameActions {
  setGameMode: (modeId: string) => void
  setCompressionOverride: (enabled: boolean | null) => void
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
  addGeneratedLevel: (level: Level) => void
  deleteGeneratedLevel: (id: number) => void
}
