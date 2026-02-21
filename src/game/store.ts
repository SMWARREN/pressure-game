// PRESSURE - Game Store (fully fixed)
import { create } from 'zustand'
import { GameState, GameActions, Level, Tile, Position, Direction } from './types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const STORAGE_KEY = 'pressure_save_v2'

// ─── Timeout Registry ─────────────────────────────────────────────────────────
// All timeouts go through here so clearAllTimeouts() can nuke every pending
// callback before a level transition — preventing stale state writes.
const activeTimeouts = new Set<ReturnType<typeof setTimeout>>()

function addTimeout(fn: () => void, delay: number) {
  const id = setTimeout(() => {
    activeTimeouts.delete(id)
    fn()
  }, delay)
  activeTimeouts.add(id)
  return id
}

export function clearAllTimeouts() {
  activeTimeouts.forEach(id => clearTimeout(id))
  activeTimeouts.clear()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rotateConnections(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

export function checkConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true
  const getTile = (x: number, y: number) => tiles.find(t => t.x === x && t.y === y)
  const visited = new Set<string>()
  const connected = new Set<string>()
  const queue: Position[] = [goals[0]]
  const startKey = `${goals[0].x},${goals[0].y}`
  visited.add(startKey)
  connected.add(startKey)

  while (queue.length > 0) {
    const curr = queue.shift()!
    const tile = getTile(curr.x, curr.y)
    if (!tile) continue
    for (const d of tile.connections) {
      let nx = curr.x, ny = curr.y
      if (d === 'up') ny--; else if (d === 'down') ny++
      else if (d === 'left') nx--; else if (d === 'right') nx++
      const key = `${nx},${ny}`
      if (visited.has(key)) continue
      const neighbor = getTile(nx, ny)
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue
      if (neighbor.connections.includes(OPP[d])) {
        visited.add(key)
        queue.push({ x: nx, y: ny })
        if (goals.some(g => g.x === nx && g.y === ny)) connected.add(key)
      }
    }
  }
  return goals.every(g => connected.has(`${g.x},${g.y}`))
}

export function getConnectedTiles(tiles: Tile[], goals: Position[]): Set<string> {
  if (goals.length < 2) return new Set()
  const getTile = (x: number, y: number) => tiles.find(t => t.x === x && t.y === y)
  const visited = new Set<string>()
  const queue: Position[] = [goals[0]]
  visited.add(`${goals[0].x},${goals[0].y}`)
  while (queue.length > 0) {
    const curr = queue.shift()!
    const tile = getTile(curr.x, curr.y)
    if (!tile) continue
    for (const d of tile.connections) {
      let nx = curr.x, ny = curr.y
      if (d === 'up') ny--; else if (d === 'down') ny++
      else if (d === 'left') nx--; else if (d === 'right') nx++
      const key = `${nx},${ny}`
      if (visited.has(key)) continue
      const neighbor = getTile(nx, ny)
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue
      if (neighbor.connections.includes(OPP[d])) {
        visited.add(key)
        queue.push({ x: nx, y: ny })
      }
    }
  }
  return visited
}

// ─── Grid Shrink ──────────────────────────────────────────────────────────────
// After walls advance, if the ring at dist===wallOffset is entirely dead
// (only wall/crushed tiles — no node, path, or empty remains there),
// strip it and collapse the board by wallOffset+1 cells on each side.
//
// We do NOT loop: after one shrink wallOffset resets to 0, and the new border
// at dist=0 is always type:'wall' — looping would cause infinite collapse.
// Empty tiles count as "live" space because they could matter for routing.
function shrinkGrid(
  tiles: Tile[],
  level: Level,
  wallOffset: number
): { tiles: Tile[]; level: Level; wallOffset: number } {
  const gs = level.gridSize
  const wo = wallOffset

  // Check if the ring at dist===wo is entirely dead (wall or crushed only)
  const ringHasLiveContent = tiles.some(tile => {
    const dist = Math.min(tile.x, tile.y, gs - 1 - tile.x, gs - 1 - tile.y)
    return dist === wo && (tile.type === 'node' || tile.type === 'path' || tile.type === 'empty')
  })

  if (ringHasLiveContent) return { tiles, level, wallOffset }

  const strip = wo + 1
  const newGs = gs - strip * 2
  if (newGs < 3) return { tiles, level, wallOffset }

  // Keep only interior non-wall/non-crushed tiles, remap coords
  const interior = tiles
    .filter(tile =>
      tile.x >= strip && tile.x < gs - strip &&
      tile.y >= strip && tile.y < gs - strip &&
      tile.type !== 'wall' && tile.type !== 'crushed'
    )
    .map(tile => ({ ...tile, x: tile.x - strip, y: tile.y - strip }))

  // Fresh wall border
  const walls: Tile[] = []
  for (let i = 0; i < newGs; i++) {
    walls.push({ id: `sw-t${i}`, type: 'wall', x: i, y: 0, connections: [], isGoalNode: false, canRotate: false })
    walls.push({ id: `sw-b${i}`, type: 'wall', x: i, y: newGs - 1, connections: [], isGoalNode: false, canRotate: false })
    if (i > 0 && i < newGs - 1) {
      walls.push({ id: `sw-l${i}`, type: 'wall', x: 0, y: i, connections: [], isGoalNode: false, canRotate: false })
      walls.push({ id: `sw-r${i}`, type: 'wall', x: newGs - 1, y: i, connections: [], isGoalNode: false, canRotate: false })
    }
  }

  const newTiles = [...walls, ...interior]
  const newLevel = {
    ...level,
    gridSize: newGs,
    goalNodes: level.goalNodes.map(g => ({ x: g.x - strip, y: g.y - strip })),
    tiles: newTiles,
  }

  return { tiles: newTiles, level: newLevel, wallOffset: 0 }
}

// ─── Persistence ──────────────────────────────────────────────────────────────
type SaveData = { completedLevels: number[]; bestMoves: Record<number, number>; showTutorial: boolean; generatedLevels: Level[] }

function loadSaved(): SaveData {
  if (typeof window === 'undefined') return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [] }
    const p = JSON.parse(raw)
    return {
      completedLevels: p.completedLevels ?? [],
      bestMoves: p.bestMoves ?? {},
      showTutorial: p.showTutorial ?? true,
      generatedLevels: p.generatedLevels ?? [],
    }
  } catch {
    return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [] }
  }
}

function persist(data: SaveData) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// ─── Audio ────────────────────────────────────────────────────────────────────
function playTone(freq: number, type: OscillatorType, vol: number, duration: number) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type; osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration)
  } catch {}
}

export function sfx(event: 'rotate' | 'win' | 'lose' | 'crush' | 'start' | 'undo') {
  switch (event) {
    case 'rotate': playTone(440, 'triangle', 0.06, 0.12); break
    case 'win':
      playTone(523, 'sine', 0.2, 0.25)
      addTimeout(() => playTone(659, 'sine', 0.2, 0.25), 150)
      addTimeout(() => playTone(784, 'sine', 0.3, 0.35), 300)
      break
    case 'lose':
      playTone(220, 'sawtooth', 0.4, 0.35)
      addTimeout(() => playTone(180, 'sawtooth', 0.4, 0.4), 200)
      break
    case 'crush': playTone(150, 'square', 0.15, 0.3); break
    case 'start': playTone(392, 'triangle', 0.12, 0.18); break
    case 'undo': playTone(330, 'triangle', 0.06, 0.1); break
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
const saved = loadSaved()

const initialState: GameState = {
  currentLevel: null,
  tiles: [],
  wallOffset: 0,
  compressionActive: false,
  compressionDelay: 10000,
  moves: 0,
  status: saved.showTutorial ? 'tutorial' : 'menu',
  completedLevels: saved.completedLevels,
  bestMoves: saved.bestMoves,
  history: [],
  lastRotatedPos: null,
  showTutorial: saved.showTutorial,
  generatedLevels: saved.generatedLevels,
  elapsedSeconds: 0,
  screenShake: false,
  timeUntilCompression: 0,
  wallsJustAdvanced: false,
  showingWin: false,
  connectedTiles: new Set(),
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  loadLevel: (level: Level) => {
    // Nuke ALL pending timeouts first. This is the only safe place to do it —
    // any pending justCrushed/justRotated/wallsJustAdvanced clears will be
    // cancelled here, and the state is reset explicitly below instead.
    clearAllTimeouts()
    set({
      currentLevel: level,
      tiles: level.tiles.map(t => ({ ...t, connections: [...t.connections], justRotated: false, justCrushed: false })),
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
    })
  },

  restartLevel: () => {
    clearAllTimeouts()
    const { currentLevel } = get()
    if (currentLevel) get().loadLevel(currentLevel)
  },

  startGame: () => {
    const { currentLevel } = get()
    if (!currentLevel) return
    sfx('start')
    set({
      status: 'playing',
      elapsedSeconds: 0,
      timeUntilCompression: currentLevel.compressionDelay,
      showingWin: false,
      compressionActive: true,
    })
    // Defer one tick so zustand has committed status:'playing' before checkWin reads it
    addTimeout(() => { if (get().status === 'playing') get().checkWin() }, 0)
  },

  tapTile: (x: number, y: number) => {
    const { tiles, status, moves, currentLevel } = get()
    if (status !== 'playing') return
    const tile = tiles.find(t => t.x === x && t.y === y)
    if (!tile?.canRotate) return
    if (currentLevel && moves >= currentLevel.maxMoves) return

    sfx('rotate')
    const prevTiles = tiles.map(t => ({ ...t, connections: [...t.connections] }))
    const newTiles = tiles.map(t =>
      t.x === x && t.y === y
        ? { ...t, connections: rotateConnections(t.connections, 1), justRotated: true }
        : { ...t, justRotated: false }
    )

    set(state => ({
      tiles: newTiles,
      moves: moves + 1,
      history: [...state.history, prevTiles],
      lastRotatedPos: { x, y },
    }))

    addTimeout(() => {
      set(state => ({ tiles: state.tiles.map(t => ({ ...t, justRotated: false })) }))
    }, 300)

    get().checkWin()
  },

  undoMove: () => {
    const { history, moves, status } = get()
    if (status !== 'playing' || history.length === 0) return
    sfx('undo')
    const prev = history[history.length - 1]
    set(state => ({
      tiles: prev.map(t => ({ ...t, justRotated: false, justCrushed: false })),
      moves: moves - 1,
      history: state.history.slice(0, -1),
      lastRotatedPos: null,
    }))
  },

  advanceWalls: () => {
    const { wallOffset, status, tiles, currentLevel } = get()
    if (status !== 'playing' || !currentLevel) return

    const newOffset = wallOffset + 1
    const gridSize = currentLevel.gridSize
    let crushedNode = false
    let crushedAny = false

    const crushedTiles = tiles.map(t => {
      const dist = Math.min(t.x, t.y, gridSize - 1 - t.x, gridSize - 1 - t.y)
      if (dist < newOffset) {
        if (t.type === 'node') {
          crushedNode = true; crushedAny = true
          sfx('crush')
          return { ...t, type: 'crushed' as const, connections: [], canRotate: false, justCrushed: true }
        }
        if (t.type === 'path') {
          crushedAny = true
          return { ...t, type: 'crushed' as const, connections: [], canRotate: false, justCrushed: true }
        }
      }
      return t
    })

    if (crushedNode) {
      // Single atomic set() — avoids React rendering between status:'lost' and
      // the tile state, which previously caused a flash of wrong overlay
      sfx('lose')
      set({
        tiles: crushedTiles,
        wallOffset: newOffset,
        timeUntilCompression: currentLevel.compressionDelay,
        wallsJustAdvanced: true,
        status: 'lost',
        compressionActive: false,
        screenShake: true,
      })
      addTimeout(() => set({ wallsJustAdvanced: false, screenShake: false }), 600)
      addTimeout(() => set(s => ({ tiles: s.tiles.map(t => ({ ...t, justCrushed: false })) })), 600)
      return
    }

    // Try to shrink grid if outer ring is empty
    const { tiles: shrunkTiles, level: shrunkLevel, wallOffset: shrunkOffset } =
      shrinkGrid(crushedTiles, currentLevel, newOffset)
    const didShrink = shrunkLevel.gridSize < currentLevel.gridSize

    set({
      tiles: shrunkTiles,
      wallOffset: shrunkOffset,
      currentLevel: shrunkLevel,
      timeUntilCompression: currentLevel.compressionDelay,
      wallsJustAdvanced: true,
      screenShake: crushedAny || didShrink,
    })
    addTimeout(() => set({ wallsJustAdvanced: false, screenShake: false }), 600)
    addTimeout(() => set(s => ({ tiles: s.tiles.map(t => ({ ...t, justCrushed: false })) })), 600)
  },

  checkWin: () => {
    const { tiles, currentLevel, moves, status } = get()
    if (!currentLevel || status !== 'playing') return false

    if (checkConnected(tiles, currentLevel.goalNodes)) {
      const connected = getConnectedTiles(tiles, currentLevel.goalNodes)
      set({ showingWin: true, connectedTiles: connected, compressionActive: false })
      sfx('win')
      addTimeout(() => {
        set(state => {
          const newCompleted = [...new Set([...state.completedLevels, currentLevel.id])]
          const newBest = { ...state.bestMoves }
          if (!newBest[currentLevel.id] || moves < newBest[currentLevel.id]) newBest[currentLevel.id] = moves
          persist({ completedLevels: newCompleted, bestMoves: newBest, showTutorial: false, generatedLevels: state.generatedLevels })
          return { status: 'won', completedLevels: newCompleted, bestMoves: newBest, showingWin: false }
        })
      }, 1500)
      return true
    }
    return false
  },

  goToMenu: () => {
    clearAllTimeouts()
    set({ status: 'menu', currentLevel: null, compressionActive: false, showingWin: false })
  },

  completeTutorial: () => {
    const { completedLevels, bestMoves, generatedLevels } = get()
    persist({ completedLevels, bestMoves, showTutorial: false, generatedLevels })
    set({ showTutorial: false, status: 'menu' })
  },

  addGeneratedLevel: (level: Level) => {
    set(state => {
      const newGenerated = [...state.generatedLevels, level]
      persist({ completedLevels: state.completedLevels, bestMoves: state.bestMoves, showTutorial: false, generatedLevels: newGenerated })
      return { generatedLevels: newGenerated }
    })
  },

  deleteGeneratedLevel: (id: number) => {
    set(state => {
      const newGenerated = state.generatedLevels.filter(l => l.id !== id)
      persist({ completedLevels: state.completedLevels, bestMoves: state.bestMoves, showTutorial: false, generatedLevels: newGenerated })
      return { generatedLevels: newGenerated }
    })
  },

  tickTimer: () => {
    if (get().status === 'playing') set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
  },

  tickCompressionTimer: () => {
    const { status, compressionActive, timeUntilCompression } = get()
    if (status === 'playing' && compressionActive) {
      set({ timeUntilCompression: Math.max(0, timeUntilCompression - 1000) })
    }
  },

  triggerShake: () => {
    set({ screenShake: true })
    addTimeout(() => set({ screenShake: false }), 500)
  },
}))
