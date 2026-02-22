// PRESSURE - Core Game Types

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export interface Tile {
  id: string
  type: 'empty' | 'wall' | 'node' | 'path' | 'crushed'
  x: number
  y: number
  connections: Direction[]
  isGoalNode: boolean
  canRotate: boolean
  justRotated?: boolean
  justCrushed?: boolean
}

export interface Level {
  id: number
  name: string
  world: number
  gridSize: number
  tiles: Tile[]
  compressionDelay: number
  maxMoves: number
  goalNodes: Position[]
  isGenerated?: boolean
  par?: number
  solution?: { x: number; y: number; rotations: number }[] | null
}

export interface GameState {
  currentLevel: Level | null
  tiles: Tile[]
  wallOffset: number
  compressionActive: boolean
  compressionDelay: number
  moves: number
  status: 'menu' | 'tutorial' | 'idle' | 'playing' | 'won' | 'lost'
  completedLevels: number[]
  bestMoves: Record<number, number>
  history: Tile[][]
  lastRotatedPos: Position | null
  showTutorial: boolean
  generatedLevels: Level[]
  elapsedSeconds: number
  screenShake: boolean
  timeUntilCompression: number
  wallsJustAdvanced: boolean
  showingWin: boolean
  connectedTiles: Set<string>
  wallAdvancing: boolean   // true while advanceWalls animation is in flight
}

export interface GameActions {
  loadLevel: (level: Level) => void
  restartLevel: () => void
  startGame: () => void
  tapTile: (x: number, y: number) => void
  advanceWalls: () => void
  checkWin: () => boolean
  goToMenu: () => void
  undoMove: () => void
  completeTutorial: () => void
  addGeneratedLevel: (level: Level) => void
  deleteGeneratedLevel: (id: number) => void
  tickTimer: () => void
  tickCompressionTimer: () => void
  triggerShake: () => void
}
