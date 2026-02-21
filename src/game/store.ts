// PRESSURE - Game Store with persistence, undo, timer, screen shake
import { create } from 'zustand'
import { GameState, GameActions, Level, Tile, Position, Direction } from './types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const STORAGE_KEY = 'pressure_save_v2'

// Track all timeouts for cleanup
const activeTimeouts = new Set<ReturnType<typeof setTimeout>>()

function addTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
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

function rotateConnections(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

export function checkConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true

  const getTile = (x: number, y: number) => tiles.find(t => t.x === x && t.y === y)
  const visited = new Set<string>()
  const queue: Position[] = [goals[0]]
  visited.add(`${goals[0].x},${goals[0].y}`)
  const connected = new Set([`${goals[0].x},${goals[0].y}`])

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

// Get all connected tile positions for win visualization
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
  } catch {}
}

// Web Audio synth helpers
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
    case 'crush':
      playTone(150, 'square', 0.15, 0.3)
      break
    case 'start':
      playTone(392, 'triangle', 0.12, 0.18)
      break
    case 'undo':
      playTone(330, 'triangle', 0.06, 0.1)
      break
  }
}

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
    clearAllTimeouts()
    
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

    if (get().checkWin()) return
  },

  tapTile: (x: number, y: number) => {
    const { tiles, status, moves, currentLevel } = get()
    if (status !== 'playing') return

    const tile = tiles.find(t => t.x === x && t.y === y)
    if (!tile?.canRotate) return
    if (currentLevel && moves >= currentLevel.maxMoves) return

    sfx('rotate')
    const prevTiles = tiles.map(t => ({ ...t, connections: [...t.connections] }))

    const newTiles = tiles.map(t => {
      if (t.x === x && t.y === y) {
        return { ...t, connections: rotateConnections(t.connections, 1), justRotated: true }
      }
      return { ...t, justRotated: false }
    })

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
      tiles: prev,
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
    const newTiles = tiles.map(t => {
      const dist = Math.min(t.x, t.y, gridSize - 1 - t.x, gridSize - 1 - t.y)
      if (dist < newOffset) {
        if (t.type === 'node') {
          crushedNode = true
          sfx('crush')
          return { ...t, type: 'crushed' as const, connections: [], canRotate: false, justCrushed: true }
        }
        if (t.type === 'path') {
          return { ...t, type: 'crushed' as const, connections: [], canRotate: false, justCrushed: true }
        }
      }
      return t
    })

    set({ 
      tiles: newTiles, 
      wallOffset: newOffset, 
      timeUntilCompression: currentLevel.compressionDelay,
      wallsJustAdvanced: true,
    })

    addTimeout(() => set({ wallsJustAdvanced: false }), 600)

    if (crushedNode) {
      sfx('lose')
      set({ status: 'lost', compressionActive: false, screenShake: true })
      addTimeout(() => set({ screenShake: false }), 600)
    }
  },

  checkWin: () => {
    const { tiles, currentLevel, moves, status } = get()
    if (!currentLevel) return false
    if (status !== 'playing') return false

    if (checkConnected(tiles, currentLevel.goalNodes)) {
      const connected = getConnectedTiles(tiles, currentLevel.goalNodes)
      
      set({ 
        showingWin: true, 
        connectedTiles: connected,
        compressionActive: false,
      })
      
      sfx('win')
      
      addTimeout(() => {
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
    const { status } = get()
    if (status === 'playing') {
      set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
    }
  },

  tickCompressionTimer: () => {
    const { status, compressionActive, timeUntilCompression } = get()
    if (status === 'playing' && compressionActive) {
      const newTime = Math.max(0, timeUntilCompression - 1000)
      set({ timeUntilCompression: newTime })
    }
  },

  triggerShake: () => {
    set({ screenShake: true })
    addTimeout(() => set({ screenShake: false }), 500)
  },
}))
