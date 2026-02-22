// PRESSURE - Game Store with Centralized Time Tracking
// Fixed: Race conditions, multiple timers, proper cleanup
import { create } from 'zustand'
import { GameState, GameActions, Level, Tile, Position, Direction } from './types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const STORAGE_KEY = 'pressure_save_v2'

/* ═══════════════════════════════════════════════════════════════════════════
   CENTRALIZED TIMER SYSTEM
   
   Single source of truth for all game timing. Uses a single interval that
   handles both elapsed time and compression countdown, eliminating race
   conditions between competing timers.
═══════════════════════════════════════════════════════════════════════════ */

// Track all timeouts for cleanup
const activeTimeouts = new Set<ReturnType<typeof setTimeout>>()
// Track all intervals for cleanup (NEW)
const activeIntervals = new Set<ReturnType<typeof setInterval>>()
// Game timer interval ID
let gameTimerInterval: ReturnType<typeof setInterval> | null = null
// Flag to prevent concurrent advanceWalls calls
let isAdvancingWalls = false
// Flag to prevent concurrent checkWin calls
let isCheckingWin = false

/**
 * Safely add a timeout with automatic tracking
 */
function addTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
  const id = setTimeout(() => {
    activeTimeouts.delete(id)
    fn()
  }, delay)
  activeTimeouts.add(id)
  return id
}

/**
 * Clear all tracked timeouts and intervals
 */
export function clearAllTimers() {
  // Clear all timeouts
  activeTimeouts.forEach(id => clearTimeout(id))
  activeTimeouts.clear()
  
  // Clear all intervals
  activeIntervals.forEach(id => clearInterval(id))
  activeIntervals.clear()
  
  // Clear game timer
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval)
    gameTimerInterval = null
  }
  
  // Reset flags
  isAdvancingWalls = false
  isCheckingWin = false
}

// Legacy export for backward compatibility
export const clearAllTimeouts = clearAllTimers

/**
 * Rotate connections array by given steps (90 degrees per step)
 */
function rotateConnections(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

/**
 * Check if all goal nodes are connected via valid paths
 * Uses BFS to find connected components
 */
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

/**
 * Get all tile positions that are connected to goal nodes
 * Used for win visualization
 */
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
  } catch {
    // Silently fail on storage errors
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUDIO - Web Audio API Sound Effects
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
  } catch {
    // Silently fail on audio errors
  }
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
}

/* ═══════════════════════════════════════════════════════════════════════════
   ZUSTAND STORE
═══════════════════════════════════════════════════════════════════════════ */

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  /**
   * Load a level and reset all game state
   */
  loadLevel: (level: Level) => {
    // Clear ALL timers before loading
    clearAllTimers()
    
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

  /**
   * Restart current level
   */
  restartLevel: () => {
    clearAllTimers()
    const { currentLevel } = get()
    if (currentLevel) get().loadLevel(currentLevel)
  },

  /**
   * Start the game - begins timers and compression
   */
  startGame: () => {
    const { currentLevel, status } = get()
    if (!currentLevel) return
    
    // Prevent starting if already playing or in end state
    if (status === 'playing' || status === 'won' || status === 'lost') return
    
    sfx('start')
    
    set({ 
      status: 'playing', 
      elapsedSeconds: 0, 
      timeUntilCompression: currentLevel.compressionDelay, 
      showingWin: false,
      compressionActive: true,
    })

    // Check for immediate win (already connected)
    if (get().checkWin()) return

    // Start the centralized game timer
    startGameTimer()
  },

  /**
   * Handle tile tap - rotate the tile 90 degrees clockwise
   */
  tapTile: (x: number, y: number) => {
    const { tiles, status, moves, currentLevel, showingWin } = get()
    
    // Guard: Only allow taps during active gameplay
    if (status !== 'playing' || showingWin) return

    const tile = tiles.find(t => t.x === x && t.y === y)
    if (!tile?.canRotate) return
    if (currentLevel && moves >= currentLevel.maxMoves) return

    sfx('rotate')
    
    // Save state for undo
    const prevTiles = tiles.map(t => ({ ...t, connections: [...t.connections] }))

    // Create new tiles with rotated connections
    const newTiles = tiles.map(t => {
      if (t.x === x && t.y === y) {
        return { ...t, connections: rotateConnections(t.connections, 1), justRotated: true }
      }
      return { ...t, justRotated: false }
    })

    // Update state atomically using functional update
    set(state => ({
      tiles: newTiles,
      moves: state.moves + 1,
      history: [...state.history, prevTiles],
      lastRotatedPos: { x, y },
    }))

    // Clear justRotated flag after animation
    addTimeout(() => {
      set(state => ({ 
        tiles: state.tiles.map(t => ({ ...t, justRotated: false })) 
      }))
    }, 300)

    // Check for win after rotation
    get().checkWin()
  },

  /**
   * Undo the last move
   */
  undoMove: () => {
    const { history, moves, status, showingWin } = get()
    
    // Guard: Only allow undo during active gameplay
    if (status !== 'playing' || showingWin || history.length === 0) return
    
    sfx('undo')
    const prev = history[history.length - 1]
    
    set(state => ({
      tiles: prev,
      moves: moves - 1,
      history: state.history.slice(0, -1),
      lastRotatedPos: null,
    }))
  },

  /**
   * Advance walls inward - called when compression timer reaches 0
   * Protected against concurrent calls
   */
  advanceWalls: () => {
    // Guard: Prevent concurrent or invalid calls
    if (isAdvancingWalls) return
    
    const { wallOffset, status, tiles, currentLevel, showingWin } = get()
    
    // Guard: Only advance during active gameplay
    if (status !== 'playing' || !currentLevel || showingWin) return
    
    isAdvancingWalls = true

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

    // Atomic state update
    set({ 
      tiles: newTiles, 
      wallOffset: newOffset, 
      timeUntilCompression: currentLevel.compressionDelay,
      wallsJustAdvanced: true,
    })

    // Clear wallsJustAdvanced flag after animation
    addTimeout(() => {
      set({ wallsJustAdvanced: false })
      isAdvancingWalls = false
    }, 600)

    // Handle crush (game over)
    if (crushedNode) {
      sfx('lose')
      stopGameTimer()
      set({ status: 'lost', compressionActive: false, screenShake: true })
      addTimeout(() => set({ screenShake: false }), 600)
      isAdvancingWalls = false
    }
  },

  /**
   * Check if all goal nodes are connected - triggers win if so
   * Protected against concurrent calls
   */
  checkWin: () => {
    // Guard: Prevent concurrent checks
    if (isCheckingWin) return false
    
    const { tiles, currentLevel, moves, status, showingWin } = get()
    
    // Guard: Only check during active gameplay
    if (!currentLevel || status !== 'playing' || showingWin) return false
    
    isCheckingWin = true

    const isWin = checkConnected(tiles, currentLevel.goalNodes)
    
    if (isWin) {
      const connected = getConnectedTiles(tiles, currentLevel.goalNodes)
      
      // Stop game timer first
      stopGameTimer()
      
      // Set win state
      set({ 
        showingWin: true, 
        connectedTiles: connected,
        compressionActive: false,
      })
      
      sfx('win')
      
      // Delayed final win state update
      addTimeout(() => {
        set(state => {
          const newCompleted = [...new Set([...state.completedLevels, currentLevel.id])]
          const newBest = { ...state.bestMoves }
          if (!newBest[currentLevel.id] || moves < newBest[currentLevel.id]) {
            newBest[currentLevel.id] = moves
          }
          persist({ 
            completedLevels: newCompleted, 
            bestMoves: newBest, 
            showTutorial: false, 
            generatedLevels: state.generatedLevels 
          })
          return { 
            status: 'won', 
            completedLevels: newCompleted, 
            bestMoves: newBest, 
            showingWin: false 
          }
        })
        isCheckingWin = false
      }, 1500)
      
      return true
    }
    
    isCheckingWin = false
    return false
  },

  /**
   * Return to main menu
   */
  goToMenu: () => {
    clearAllTimers()
    set({ status: 'menu', currentLevel: null, compressionActive: false, showingWin: false })
  },

  /**
   * Complete tutorial and show menu
   */
  completeTutorial: () => {
    const { completedLevels, bestMoves, generatedLevels } = get()
    persist({ completedLevels, bestMoves, showTutorial: false, generatedLevels })
    set({ showTutorial: false, status: 'menu' })
  },

  /**
   * Add a generated level to saved levels
   */
  addGeneratedLevel: (level: Level) => {
    set(state => {
      const newGenerated = [...state.generatedLevels, level]
      persist({ 
        completedLevels: state.completedLevels, 
        bestMoves: state.bestMoves, 
        showTutorial: false, 
        generatedLevels: newGenerated 
      })
      return { generatedLevels: newGenerated }
    })
  },

  /**
   * Delete a generated level from saved levels
   */
  deleteGeneratedLevel: (id: number) => {
    set(state => {
      const newGenerated = state.generatedLevels.filter(l => l.id !== id)
      persist({ 
        completedLevels: state.completedLevels, 
        bestMoves: state.bestMoves, 
        showTutorial: false, 
        generatedLevels: newGenerated 
      })
      return { generatedLevels: newGenerated }
    })
  },

  /**
   * Increment elapsed time counter (called by centralized timer)
   */
  tickTimer: () => {
    const { status, showingWin } = get()
    // Guard: Only tick during active gameplay
    if (status === 'playing' && !showingWin) {
      set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
    }
  },

  /**
   * Decrement compression timer (called by centralized timer)
   */
  tickCompressionTimer: () => {
    const { status, compressionActive, timeUntilCompression, showingWin } = get()
    // Guard: Only tick during active gameplay with compression
    if (status === 'playing' && compressionActive && !showingWin) {
      const newTime = Math.max(0, timeUntilCompression - 1000)
      set({ timeUntilCompression: newTime })
      
      // Trigger wall advance when countdown reaches 0
      if (newTime <= 0) {
        get().advanceWalls()
      }
    }
  },

  /**
   * Trigger screen shake effect
   */
  triggerShake: () => {
    set({ screenShake: true })
    addTimeout(() => set({ screenShake: false }), 500)
  },
}))

/* ═══════════════════════════════════════════════════════════════════════════
   CENTRALIZED GAME TIMER
   
   Single interval that handles both:
   1. Elapsed time counting (every second)
   2. Compression countdown (every second)
   
   This eliminates race conditions from multiple competing intervals.
═══════════════════════════════════════════════════════════════════════════ */

function startGameTimer() {
  // Clear any existing game timer first
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval)
    gameTimerInterval = null
  }
  
  // Start single centralized timer
  gameTimerInterval = setInterval(() => {
    const state = useGameStore.getState()
    
    // Only tick if game is actively playing
    if (state.status === 'playing' && !state.showingWin) {
      state.tickTimer()
      state.tickCompressionTimer()
    }
  }, 1000)
  
  // Track for cleanup
  activeIntervals.add(gameTimerInterval)
}

function stopGameTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval)
    activeIntervals.delete(gameTimerInterval)
    gameTimerInterval = null
  }
}
