// PRESSURE - Game Store with Mode System
// Delegates tap handling, win/loss checking to the active GameMode plugin.
// Wall compression is resolved by: level override → mode setting → compressionOverride

import { create } from 'zustand'
import { GameState, GameActions, Level, Tile, Position, Direction } from './types'
import { getModeById, DEFAULT_MODE_ID } from './modes'
import { checkConnected, getConnectedTiles, rotateConnections, createTileMap } from './modes/utils'

// Re-export utilities so existing imports don't break
export { checkConnected, getConnectedTiles, createTileMap }

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const STORAGE_KEY = 'pressure_save_v3'

/* ═══════════════════════════════════════════════════════════════════════════
   CENTRALIZED TIMER SYSTEM
═══════════════════════════════════════════════════════════════════════════ */

const activeTimeouts = new Set<ReturnType<typeof setTimeout>>()
let gameTimerInterval: ReturnType<typeof setInterval> | null = null
let advanceWallsInProgress = false
let checkWinInProgress = false

function addTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
  const id = setTimeout(() => {
    activeTimeouts.delete(id)
    fn()
  }, delay)
  activeTimeouts.add(id)
  return id
}

export function clearAllTimers() {
  activeTimeouts.forEach(id => clearTimeout(id))
  activeTimeouts.clear()
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval)
    gameTimerInterval = null
  }
  advanceWallsInProgress = false
  checkWinInProgress = false
}

export const clearAllTimeouts = clearAllTimers

/* ═══════════════════════════════════════════════════════════════════════════
   AUDIO
═══════════════════════════════════════════════════════════════════════════ */

function playTone(freq: number, type: OscillatorType = 'sine', dur = 0.08, vol = 0.18) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + dur)
  } catch {}
}

function sfx(name: 'rotate' | 'win' | 'lose' | 'crush' | 'start' | 'undo') {
  switch (name) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   PERSISTENCE
═══════════════════════════════════════════════════════════════════════════ */

function loadSaved(): Pick<GameState, 'completedLevels' | 'bestMoves' | 'showTutorial' | 'generatedLevels' | 'currentModeId'> {
  if (typeof window === 'undefined') return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [], currentModeId: DEFAULT_MODE_ID }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [], currentModeId: DEFAULT_MODE_ID }
    const p = JSON.parse(raw)
    return {
      completedLevels: p.completedLevels || [],
      bestMoves: p.bestMoves || {},
      showTutorial: p.showTutorial !== false,
      generatedLevels: p.generatedLevels || [],
      currentModeId: p.currentModeId || DEFAULT_MODE_ID,
    }
  } catch {
    return { completedLevels: [], bestMoves: {}, showTutorial: true, generatedLevels: [], currentModeId: DEFAULT_MODE_ID }
  }
}

function persist(data: Pick<GameState, 'completedLevels' | 'bestMoves' | 'showTutorial' | 'generatedLevels' | 'currentModeId'>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPRESSION RESOLUTION
   Priority: level.compressionEnabled → mode setting → compressionOverride
═══════════════════════════════════════════════════════════════════════════ */

function resolveCompressionEnabled(
  level: Level | null,
  modeId: string,
  override: boolean | null
): boolean {
  // Level-specific override takes highest priority
  if (level?.compressionEnabled !== undefined) return level.compressionEnabled

  const mode = getModeById(modeId)

  if (mode.wallCompression === 'always') return true
  if (mode.wallCompression === 'never') return false

  // 'optional' → use player's override, default to true
  return override !== null ? override : true
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIMER MANAGEMENT
═══════════════════════════════════════════════════════════════════════════ */

function startGameTimer() {
  stopGameTimer()
  gameTimerInterval = setInterval(() => {
    useGameStore.getState().tickTimer()
  }, 1000)
}

function stopGameTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval)
    gameTimerInterval = null
  }
  advanceWallsInProgress = false
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
  currentModeId: saved.currentModeId,
  compressionOverride: null,
}

/* ═══════════════════════════════════════════════════════════════════════════
   ZUSTAND STORE
═══════════════════════════════════════════════════════════════════════════ */

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setGameMode: (modeId: string) => {
    const { completedLevels, bestMoves, showTutorial, generatedLevels } = get()
    set({ currentModeId: modeId })
    persist({ completedLevels, bestMoves, showTutorial, generatedLevels, currentModeId: modeId })
  },

  setCompressionOverride: (enabled: boolean | null) => {
    set({ compressionOverride: enabled })
  },

  loadLevel: (level: Level) => {
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

  restartLevel: () => {
    clearAllTimers()
    const { currentLevel } = get()
    if (currentLevel) get().loadLevel(currentLevel)
  },

  startGame: () => {
    const { currentLevel, status, currentModeId, compressionOverride } = get()
    if (!currentLevel) return
    if (status === 'playing' || status === 'won' || status === 'lost') return

    const compressionEnabled = resolveCompressionEnabled(currentLevel, currentModeId, compressionOverride)

    sfx('start')
    set({
      status: 'playing',
      elapsedSeconds: 0,
      timeUntilCompression: currentLevel.compressionDelay,
      showingWin: false,
      compressionActive: compressionEnabled,
    })

    if (!get().checkWin()) startGameTimer()
  },

  tapTile: (x: number, y: number) => {
    const { tiles, status, moves, currentLevel, showingWin, currentModeId } = get()

    if (status !== 'playing' || showingWin) return

    const mode = getModeById(currentModeId)

    // Check move limit (if mode uses it)
    if (mode.useMoveLimit !== false && currentLevel && moves >= currentLevel.maxMoves) return

    // Delegate tap to mode
    const result = mode.onTileTap(x, y, tiles, currentLevel?.gridSize ?? 5)
    if (!result || !result.valid) return

    sfx('rotate')

    // Save history for undo (if mode supports it)
    const prevTiles = mode.supportsUndo !== false
      ? tiles.map(t => ({ ...t, connections: [...t.connections] }))
      : null

    set(state => ({
      tiles: result.tiles,
      moves: state.moves + 1,
      history: prevTiles ? [...state.history, prevTiles] : state.history,
      lastRotatedPos: { x, y },
    }))

    // Clear justRotated flag after animation
    addTimeout(() => {
      set(state => ({
        tiles: state.tiles.map(t => ({ ...t, justRotated: false }))
      }))
    }, 300)

    get().checkWin()
  },

  checkWin: () => {
    const { tiles, currentLevel, status, showingWin, moves, currentModeId } = get()

    if (!currentLevel || status !== 'playing' || showingWin) return false
    if (checkWinInProgress) return false

    checkWinInProgress = true

    const mode = getModeById(currentModeId)
    const { won } = mode.checkWin(
      tiles,
      currentLevel.goalNodes,
      moves,
      currentLevel.maxMoves
    )

    if (won) {
      const connected = getConnectedTiles(tiles, currentLevel.goalNodes)
      stopGameTimer()
      set({ showingWin: true, connectedTiles: connected, compressionActive: false })
      sfx('win')

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
            generatedLevels: state.generatedLevels,
            currentModeId: state.currentModeId,
          })
          return {
            status: 'won',
            completedLevels: newCompleted,
            bestMoves: newBest,
            showingWin: false,
          }
        })
        checkWinInProgress = false
      }, 1500)

      return true
    }

    checkWinInProgress = false
    return false
  },

  undoMove: () => {
    const { history, moves, status, showingWin, currentModeId } = get()
    const mode = getModeById(currentModeId)

    if (!mode.supportsUndo) return
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

  advanceWalls: () => {
    if (advanceWallsInProgress) return
    advanceWallsInProgress = true

    const { tiles, wallOffset, currentLevel, status } = get()
    if (!currentLevel || status !== 'playing') {
      advanceWallsInProgress = false
      return
    }

    const gs = currentLevel.gridSize
    const newOffset = wallOffset + 1
    const maxOffset = Math.floor(gs / 2)

    if (newOffset > maxOffset) {
      set({ status: 'lost' })
      stopGameTimer()
      sfx('lose')
      advanceWallsInProgress = false
      return
    }

    // Crush tiles in the new wall zone
    const newTiles = tiles.map(tile => {
      const dist = Math.min(tile.x, tile.y, gs - 1 - tile.x, gs - 1 - tile.y)
      if (dist < newOffset && tile.type !== 'wall' && tile.type !== 'crushed') {
        return { ...tile, type: 'crushed' as const, justCrushed: true }
      }
      return tile
    })

    // Check mode-specific loss condition
    const { currentModeId, compressionOverride } = get()
    const mode = getModeById(currentModeId)
    if (mode.checkLoss) {
      const { lost, reason } = mode.checkLoss(newTiles, newOffset, get().moves, currentLevel.maxMoves)
      if (lost) {
        set({ tiles: newTiles, wallOffset: newOffset, status: 'lost', wallsJustAdvanced: true })
        stopGameTimer()
        sfx('lose')
        advanceWallsInProgress = false
        return
      }
    }

    sfx('crush')
    set({ tiles: newTiles, wallOffset: newOffset, wallsJustAdvanced: true })

    addTimeout(() => {
      set({ wallsJustAdvanced: false })
    }, 600)

    // Check if goal nodes are all crushed → auto lose
    const allGoalsCrushed = currentLevel.goalNodes.every(g =>
      newTiles.find(t => t.x === g.x && t.y === g.y)?.type === 'crushed'
    )
    if (allGoalsCrushed) {
      set({ status: 'lost' })
      stopGameTimer()
      sfx('lose')
    }

    advanceWallsInProgress = false
  },

  tickTimer: () => {
    const { status, timeUntilCompression, compressionActive, currentLevel, currentModeId, compressionOverride } = get()
    if (status !== 'playing') return

    set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }))

    if (!compressionActive || !currentLevel) return

    const compressionEnabled = resolveCompressionEnabled(currentLevel, currentModeId, compressionOverride)
    if (!compressionEnabled) return

    const newTime = timeUntilCompression - 1000
    if (newTime <= 0) {
      set({ timeUntilCompression: currentLevel.compressionDelay })
      get().advanceWalls()
    } else {
      set({ timeUntilCompression: newTime })
    }
  },

  tickCompressionTimer: () => {
    // Legacy: tickTimer now handles this
  },

  triggerShake: () => {
    set({ screenShake: true })
    addTimeout(() => set({ screenShake: false }), 400)
  },

  goToMenu: () => {
    clearAllTimers()
    set({ status: 'menu', currentLevel: null, compressionActive: false, showingWin: false })
  },

  completeTutorial: () => {
    const { completedLevels, bestMoves, generatedLevels, currentModeId } = get()
    persist({ completedLevels, bestMoves, showTutorial: false, generatedLevels, currentModeId })
    set({ showTutorial: false, status: 'menu' })
  },

  addGeneratedLevel: (level: Level) => {
    set(state => {
      const generatedLevels = [...state.generatedLevels, level]
      persist({ completedLevels: state.completedLevels, bestMoves: state.bestMoves, showTutorial: state.showTutorial, generatedLevels, currentModeId: state.currentModeId })
      return { generatedLevels }
    })
  },

  deleteGeneratedLevel: (id: number) => {
    set(state => {
      const generatedLevels = state.generatedLevels.filter(l => l.id !== id)
      persist({ completedLevels: state.completedLevels, bestMoves: state.bestMoves, showTutorial: state.showTutorial, generatedLevels, currentModeId: state.currentModeId })
      return { generatedLevels }
    })
  },
}))
