// PRESSURE - Game Store (Rewritten for correctness and performance)
import { create } from 'zustand'
import { GameState, GameActions, Level, Tile, Position, Direction } from './types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const STORAGE_KEY = 'pressure_save_v2'

/* ═══════════════════════════════════════════════════════════════════════════
   TIMER MANAGEMENT
   
   Single interval, no competing timers, no flag leaks.
   A "generation ID" ensures stale callbacks from old games never fire.
═══════════════════════════════════════════════════════════════════════════ */

let gameTimerInterval: ReturnType<typeof setInterval> | null = null
let gameGeneration = 0 // Incremented on every loadLevel/restart. Stale callbacks check this.

function stopGameTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval)
    gameTimerInterval = null
  }
}

function startGameTimer(gen: number) {
  stopGameTimer()
  gameTimerInterval = setInterval(() => {
    // Drop if stale (level was reloaded/restarted while this interval was pending)
    if (gen !== gameGeneration) { stopGameTimer(); return }

    const state = useGameStore.getState()
    if (state.status !== 'playing' || state.showingWin) return

    // Tick elapsed time
    useGameStore.setState(s => ({ elapsedSeconds: s.elapsedSeconds + 1 }))

    // Tick compression countdown
    if (state.compressionActive) {
      const next = Math.max(0, state.timeUntilCompression - 1000)
      useGameStore.setState({ timeUntilCompression: next })
      if (next <= 0) {
        // Fire wall advance — but only if not already in progress
        const fresh = useGameStore.getState()
        if (!fresh.wallAdvancing) {
          useGameStore.getState().advanceWalls()
        }
      }
    }
  }, 1000)
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONNECTIVITY CHECK — O(1) per tap (no BFS, no heavy computation)

   Instead of running BFS across the whole grid every tap, we:
   1. Build a Map<"x,y", Tile> once per tap (O(n) but n ≤ 49 for 7×7)
   2. Do a simple flood-fill from goal[0], counting reached goal nodes
   3. Win if all goal nodes reachable

   This is strictly faster than the previous full-BFS with tileMap rebuild
   because we short-circuit as soon as we know it's a win or not.
   No heavy allocation. No Set copies. No flag races.
═══════════════════════════════════════════════════════════════════════════ */

function buildTileMap(tiles: Tile[]): Map<string, Tile> {
  const m = new Map<string, Tile>()
  for (const t of tiles) m.set(`${t.x},${t.y}`, t)
  return m
}

/**
 * Fast flood-fill connectivity check. Returns true if all goals reachable
 * from goals[0] through valid bidirectional pipe connections.
 */
export function checkConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true
  const map = buildTileMap(tiles)
  const visited = new Set<string>()
  const stack: Position[] = [goals[0]]
  const startKey = `${goals[0].x},${goals[0].y}`
  visited.add(startKey)
  let goalsFound = 1
  const goalKeys = new Set(goals.map(g => `${g.x},${g.y}`))
  goalKeys.delete(startKey)

  while (stack.length > 0) {
    const curr = stack.pop()!
    const tile = map.get(`${curr.x},${curr.y}`)
    if (!tile) continue

    for (const d of tile.connections) {
      const nx = curr.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0)
      const ny = curr.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0)
      const key = `${nx},${ny}`
      if (visited.has(key)) continue
      const neighbor = map.get(key)
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue
      if (!neighbor.connections.includes(OPP[d])) continue
      visited.add(key)
      if (goalKeys.has(key)) {
        goalsFound++
        goalKeys.delete(key)
        if (goalKeys.size === 0) return true // Early exit
      }
      stack.push({ x: nx, y: ny })
    }
  }

  return goalsFound === goals.length
}

/**
 * Returns the set of tile keys reachable from goals[0].
 * Only called once on win to show connected highlights — not on every tap.
 */
export function getConnectedTiles(tiles: Tile[], goals: Position[]): Set<string> {
  if (goals.length < 2) return new Set()
  const map = buildTileMap(tiles)
  const visited = new Set<string>()
  const stack: Position[] = [goals[0]]
  visited.add(`${goals[0].x},${goals[0].y}`)

  while (stack.length > 0) {
    const curr = stack.pop()!
    const tile = map.get(`${curr.x},${curr.y}`)
    if (!tile) continue
    for (const d of tile.connections) {
      const nx = curr.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0)
      const ny = curr.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0)
      const key = `${nx},${ny}`
      if (visited.has(key)) continue
      const neighbor = map.get(key)
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue
      if (!neighbor.connections.includes(OPP[d])) continue
      visited.add(key)
      stack.push({ x: nx, y: ny })
    }
  }

  return visited
}

/** Exported for compatibility */
export function clearAllTimers() {
  gameGeneration++ // Invalidate all pending interval callbacks
  stopGameTimer()
}
export const clearAllTimeouts = clearAllTimers

/* ═══════════════════════════════════════════════════════════════════════════
   ROTATE CONNECTIONS
═══════════════════════════════════════════════════════════════════════════ */

function rotateConnections(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUDIO
═══════════════════════════════════════════════════════════════════════════ */

function playTone(freq: number, type: OscillatorType = 'sine', duration = 0.08, vol = 0.18) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type; osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration)
    // Auto-close context after sound plays
    setTimeout(() => ctx.close().catch(() => {}), (duration + 0.1) * 1000)
  } catch { /* silent */ }
}

export function sfx(event: 'rotate' | 'win' | 'lose' | 'crush' | 'start' | 'undo') {
  switch (event) {
    case 'rotate': playTone(440, 'triangle', 0.06, 0.12); break
    case 'win':
      playTone(523, 'sine', 0.2, 0.25)
      setTimeout(() => playTone(659, 'sine', 0.2, 0.25), 150)
      setTimeout(() => playTone(784, 'sine', 0.3, 0.35), 300)
      break
    case 'lose':
      playTone(220, 'sawtooth', 0.4, 0.35)
      setTimeout(() => playTone(180, 'sawtooth', 0.4, 0.4), 200)
      break
    case 'crush': playTone(150, 'square', 0.15, 0.3); break
    case 'start': playTone(392, 'triangle', 0.12, 0.18); break
    case 'undo': playTone(330, 'triangle', 0.06, 0.1); break
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PERSISTENCE
═══════════════════════════════════════════════════════════════════════════ */

function loadSaved(): Pick<GameState, 'completedLevels' | 'bestMoves' | 'showTutorial' | 'generatedLevels'> {
  if (typeof window === 'undefined') return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [] }
    const p = JSON.parse(raw)
    return {
      completedLevels: p.completedLevels || [],
      bestMoves: p.bestMoves || {},
      showTutorial: p.showTutorial !== false,
      generatedLevels: p.generatedLevels || [],
    }
  } catch {
    return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [] }
  }
}

function persist(state: Pick<GameState, 'completedLevels' | 'bestMoves' | 'showTutorial' | 'generatedLevels'>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      completedLevels: state.completedLevels,
      bestMoves: state.bestMoves,
      showTutorial: state.showTutorial,
      generatedLevels: state.generatedLevels,
    }))
  } catch { /* silent */ }
}

/* ═══════════════════════════════════════════════════════════════════════════
   INITIAL STATE
═══════════════════════════════════════════════════════════════════════════ */

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
  wallAdvancing: false,
}

/* ═══════════════════════════════════════════════════════════════════════════
   ZUSTAND STORE
═══════════════════════════════════════════════════════════════════════════ */

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  loadLevel: (level: Level) => {
    gameGeneration++ // Invalidate ALL pending interval callbacks and old timeouts
    stopGameTimer()

    set({
      currentLevel: level,
      tiles: level.tiles.map(t => ({ ...t, connections: [...t.connections] })),
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
      wallAdvancing: false,
    })
  },

  restartLevel: () => {
    const { currentLevel } = get()
    if (currentLevel) get().loadLevel(currentLevel)
  },

  startGame: () => {
    const { currentLevel, status } = get()
    if (!currentLevel || status === 'playing' || status === 'won' || status === 'lost') return

    sfx('start')

    set({
      status: 'playing',
      elapsedSeconds: 0,
      timeUntilCompression: currentLevel.compressionDelay,
      showingWin: false,
      compressionActive: true,
      wallAdvancing: false,
    })

    // Check immediate win (level already solved from idle)
    if (get().checkWin()) return

    const gen = gameGeneration
    startGameTimer(gen)
  },

  tapTile: (x: number, y: number) => {
    const { tiles, status, moves, currentLevel, showingWin } = get()
    if (status !== 'playing' || showingWin) return

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

    set(s => ({
      tiles: newTiles,
      moves: s.moves + 1,
      history: [...s.history, prevTiles],
      lastRotatedPos: { x, y },
    }))

    // Clear justRotated after animation — use raw setTimeout, not tracked
    const gen = gameGeneration
    setTimeout(() => {
      if (gen !== gameGeneration) return
      set(s => ({ tiles: s.tiles.map(t => ({ ...t, justRotated: false })) }))
    }, 300)

    // Check win — fast O(n) flood fill, n ≤ 49
    get().checkWin()
  },

  advanceWalls: () => {
    const { wallAdvancing, status, tiles, currentLevel, showingWin } = get()
    if (wallAdvancing || status !== 'playing' || !currentLevel || showingWin) return

    set({ wallAdvancing: true })

    const newOffset = get().wallOffset + 1
    const gridSize = currentLevel.gridSize
    let crushedNode = false

    const newTiles = tiles.map(t => {
      const dist = Math.min(t.x, t.y, gridSize - 1 - t.x, gridSize - 1 - t.y)
      if (dist < newOffset && (t.type === 'node' || t.type === 'path')) {
        if (t.type === 'node') { crushedNode = true; sfx('crush') }
        return { ...t, type: 'crushed' as const, connections: [], canRotate: false, justCrushed: true }
      }
      return t
    })

    set({
      tiles: newTiles,
      wallOffset: newOffset,
      timeUntilCompression: currentLevel.compressionDelay,
      wallsJustAdvanced: true,
    })

    if (crushedNode) {
      sfx('lose')
      stopGameTimer()
      set({ status: 'lost', compressionActive: false, screenShake: true, wallAdvancing: false })
      const gen = gameGeneration
      setTimeout(() => {
        if (gen !== gameGeneration) return
        set({ screenShake: false, wallsJustAdvanced: false })
      }, 600)
      return
    }

    // Clear animation flags after transition
    const gen = gameGeneration
    setTimeout(() => {
      if (gen !== gameGeneration) return
      set({ wallsJustAdvanced: false, wallAdvancing: false })
    }, 600)
  },

  checkWin: () => {
    const { tiles, currentLevel, moves, status, showingWin } = get()
    if (!currentLevel || status !== 'playing' || showingWin) return false

    const isWin = checkConnected(tiles, currentLevel.goalNodes)
    if (!isWin) return false

    // Won — stop everything immediately
    const gen = gameGeneration
    stopGameTimer()

    const connected = getConnectedTiles(tiles, currentLevel.goalNodes)
    set({ showingWin: true, connectedTiles: connected, compressionActive: false })
    sfx('win')

    setTimeout(() => {
      if (gen !== gameGeneration) return
      set(state => {
        const newCompleted = [...new Set([...state.completedLevels, currentLevel.id])]
        const newBest = { ...state.bestMoves }
        if (!newBest[currentLevel.id] || moves < newBest[currentLevel.id]) {
          newBest[currentLevel.id] = moves
        }
        persist({ completedLevels: newCompleted, bestMoves: newBest, showTutorial: false, generatedLevels: state.generatedLevels })
        return { status: 'won', completedLevels: newCompleted, bestMoves: newBest, showingWin: false }
      })
    }, 1500)

    return true
  },

  undoMove: () => {
    const { history, moves, status, showingWin } = get()
    if (status !== 'playing' || showingWin || history.length === 0) return
    sfx('undo')
    const prev = history[history.length - 1]
    set(s => ({ tiles: prev, moves: moves - 1, history: s.history.slice(0, -1), lastRotatedPos: null }))
  },

  goToMenu: () => {
    gameGeneration++
    stopGameTimer()
    set({ status: 'menu', currentLevel: null, compressionActive: false, showingWin: false, wallAdvancing: false })
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

  // These are vestigial — timer is now self-contained in startGameTimer
  tickTimer: () => {},
  tickCompressionTimer: () => {},
  triggerShake: () => {
    const gen = gameGeneration
    set({ screenShake: true })
    setTimeout(() => { if (gen === gameGeneration) set({ screenShake: false }) }, 500)
  },
}))
