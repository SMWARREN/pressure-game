// PRESSURE - Game Store (Zustand v5)
// Delegates tap handling, win/loss checking to the active GameMode plugin.
// Reentrancy guards live in Zustand state (not module scope) so they can
// never be stranded by clearAllTimers() calls.

import { create } from 'zustand'
import { GameState, GameActions, Level } from './types'
import { getModeById, DEFAULT_MODE_ID } from './modes'
import { checkConnected, getConnectedTiles, createTileMap } from './modes/utils'

// Re-export utilities so existing imports don't break
export { checkConnected, getConnectedTiles, createTileMap }


const STORAGE_KEY = 'pressure_save_v3'

/* ═══════════════════════════════════════════════════════════════════════════
   CENTRALIZED TIMER SYSTEM
   All timeouts are tracked so we can reliably cancel them.
   The game interval is stored separately for clean teardown.
═══════════════════════════════════════════════════════════════════════════ */

const activeTimeouts = new Set<ReturnType<typeof setTimeout>>()
let gameTimerInterval: ReturnType<typeof setInterval> | null = null

function safeTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
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
  stopGameTimer()
}

// Keep the old name as an alias so nothing breaks
export const clearAllTimeouts = clearAllTimers

function startGameTimer() {
  stopGameTimer()
  gameTimerInterval = setInterval(() => {
    // Always read fresh state from store — no closure staleness
    useGameStore.getState().tickTimer()
  }, 1000)
}

function stopGameTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval)
    gameTimerInterval = null
  }
}

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
      safeTimeout(() => playTone(659, 'sine', 0.2, 0.25), 150)
      safeTimeout(() => playTone(784, 'sine', 0.3, 0.35), 300)
      break
    case 'lose':
      playTone(220, 'sawtooth', 0.4, 0.35)
      safeTimeout(() => playTone(180, 'sawtooth', 0.4, 0.4), 200)
      break
    case 'crush': playTone(150, 'square', 0.15, 0.3); break
    case 'start': playTone(392, 'triangle', 0.12, 0.18); break
    case 'undo': playTone(330, 'triangle', 0.06, 0.1); break
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PERSISTENCE
═══════════════════════════════════════════════════════════════════════════ */

type PersistedState = Pick<
  GameState,
  'completedLevels' | 'bestMoves' | 'showTutorial' | 'generatedLevels' | 'currentModeId' | 'seenTutorials'
>

function loadSaved(): PersistedState {
  const fallback: PersistedState = {
    completedLevels: [],
    bestMoves: {},
    showTutorial: true,
    generatedLevels: [],
    currentModeId: DEFAULT_MODE_ID,
    seenTutorials: [DEFAULT_MODE_ID],
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw)
    return {
      completedLevels: p.completedLevels || [],
      bestMoves: p.bestMoves || {},
      showTutorial: p.showTutorial !== false,
      generatedLevels: p.generatedLevels || [],
      currentModeId: p.currentModeId || DEFAULT_MODE_ID,
      seenTutorials: p.seenTutorials || (p.showTutorial === false ? [DEFAULT_MODE_ID] : []),
    }
  } catch {
    return fallback
  }
}

function persist(data: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPRESSION RESOLUTION
   Priority: level.compressionEnabled → mode.wallCompression → compressionOverride
═══════════════════════════════════════════════════════════════════════════ */

function resolveCompressionEnabled(
  level: Level | null,
  modeId: string,
  override: boolean | null
): boolean {
  if (level?.compressionEnabled !== undefined) return level.compressionEnabled
  const mode = getModeById(modeId)
  if (mode.wallCompression === 'always') return true
  if (mode.wallCompression === 'never') return false
  return override !== null ? override : true
}

/* ═══════════════════════════════════════════════════════════════════════════
   INITIAL STATE
═══════════════════════════════════════════════════════════════════════════ */

const saved = loadSaved()
const needsTutorial = saved.showTutorial || !saved.seenTutorials.includes(saved.currentModeId)

const initialState: GameState = {
  currentLevel: null,
  tiles: [],
  wallOffset: 0,
  compressionActive: false,
  compressionDelay: 10000,
  moves: 0,
  status: needsTutorial ? 'tutorial' : 'menu',
  completedLevels: saved.completedLevels,
  bestMoves: saved.bestMoves,
  history: [],
  lastRotatedPos: null,
  showTutorial: saved.showTutorial,
  seenTutorials: saved.seenTutorials,
  generatedLevels: saved.generatedLevels,
  elapsedSeconds: 0,
  screenShake: false,
  timeUntilCompression: 0,
  wallsJustAdvanced: false,
  showingWin: false,
  connectedTiles: new Set(),
  currentModeId: saved.currentModeId,
  compressionOverride: null,
  // Reentrancy guards — in Zustand state so they reset with loadLevel/restart
  _winCheckPending: false,
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORE
═══════════════════════════════════════════════════════════════════════════ */

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setGameMode: (modeId: string) => {
    const { completedLevels, bestMoves, showTutorial, generatedLevels, seenTutorials } = get()
    const alreadySeen = seenTutorials.includes(modeId)
    set({
      currentModeId: modeId,
      status: alreadySeen ? 'menu' : 'tutorial',
      currentLevel: null,
    })
    persist({ completedLevels, bestMoves, showTutorial, generatedLevels, currentModeId: modeId, seenTutorials })
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
      _winCheckPending: false,
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
      _winCheckPending: false,
    })

    // Check if already solved (e.g., pre-solved demo levels)
    if (!get().checkWin()) startGameTimer()
  },

  tapTile: (x: number, y: number) => {
    const state = get()
    const { tiles, status, moves, currentLevel, showingWin, currentModeId } = state

    if (status !== 'playing' || showingWin) return

    const mode = getModeById(currentModeId)

    if (mode.useMoveLimit !== false && currentLevel && moves >= currentLevel.maxMoves) return

    const result = mode.onTileTap(x, y, tiles, currentLevel?.gridSize ?? 5)
    if (!result || !result.valid) return

    sfx('rotate')

    const prevTiles = mode.supportsUndo !== false
      ? tiles.map(t => ({ ...t, connections: [...t.connections] }))
      : null

    set(s => ({
      tiles: result.tiles,
      moves: s.moves + 1,
      history: prevTiles ? [...s.history, prevTiles] : s.history,
      lastRotatedPos: { x, y },
    }))

    // Clear justRotated flag after animation
    safeTimeout(() => {
      set(s => ({
        tiles: s.tiles.map(t => (t.justRotated ? { ...t, justRotated: false } : t)),
      }))
    }, 300)

    get().checkWin()
  },

  checkWin: () => {
    const { tiles, currentLevel, status, showingWin, moves, currentModeId, _winCheckPending } = get()

    // Guard: don't re-enter while a win animation is pending
    if (!currentLevel || status !== 'playing' || showingWin || _winCheckPending) return false

    const mode = getModeById(currentModeId)
    const { won } = mode.checkWin(tiles, currentLevel.goalNodes, moves, currentLevel.maxMoves)

    if (!won) return false

    // Mark win pending immediately to prevent re-entry
    const connected = getConnectedTiles(tiles, currentLevel.goalNodes)
    stopGameTimer()
    set({ showingWin: true, connectedTiles: connected, compressionActive: false, _winCheckPending: true })
    sfx('win')

    safeTimeout(() => {
      const s = get()
      const newCompleted = [...new Set([...s.completedLevels, currentLevel.id])]
      const newBest = { ...s.bestMoves }
      if (!newBest[currentLevel.id] || moves < newBest[currentLevel.id]) {
        newBest[currentLevel.id] = moves
      }
      persist({
        completedLevels: newCompleted,
        bestMoves: newBest,
        showTutorial: false,
        generatedLevels: s.generatedLevels,
        currentModeId: s.currentModeId,
        seenTutorials: s.seenTutorials,
      })
      set({
        status: 'won',
        completedLevels: newCompleted,
        bestMoves: newBest,
        _winCheckPending: false,
      })
    }, 600)

    return true
  },

  undoMove: () => {
    const { history, status, currentModeId } = get()
    const mode = getModeById(currentModeId)
    if (mode.supportsUndo === false) return
    if (status !== 'playing' || history.length === 0) return

    const prev = history[history.length - 1]
    sfx('undo')
    set(s => ({
      tiles: prev,
      moves: Math.max(0, s.moves - 1),
      history: s.history.slice(0, -1),
      lastRotatedPos: null,
    }))
  },

  advanceWalls: () => {
    const { tiles, wallOffset, currentLevel, status, currentModeId } = get()
    if (!currentLevel || status !== 'playing') return

    const gs = currentLevel.gridSize
    const maxOff = Math.floor(gs / 2)
    const newOffset = wallOffset + 1

    if (newOffset > maxOff) return

    const newTiles = tiles.map(tile => {
      const dist = Math.min(tile.x, tile.y, gs - 1 - tile.x, gs - 1 - tile.y)
      if (dist < newOffset && tile.type !== 'wall' && tile.type !== 'crushed') {
        return { ...tile, type: 'crushed' as const, justCrushed: true }
      }
      return tile
    })

    // Check mode-specific loss condition
    const mode = getModeById(currentModeId)
    if (mode.checkLoss) {
      const { lost } = mode.checkLoss(newTiles, newOffset, get().moves, currentLevel.maxMoves)
      if (lost) {
        set({ tiles: newTiles, wallOffset: newOffset, status: 'lost', wallsJustAdvanced: true })
        stopGameTimer()
        sfx('lose')
        return
      }
    }

    // Check if all goal nodes were crushed
    const allGoalsCrushed = currentLevel.goalNodes.every(g =>
      newTiles.find(t => t.x === g.x && t.y === g.y)?.type === 'crushed'
    )

    if (allGoalsCrushed) {
      set({ tiles: newTiles, wallOffset: newOffset, status: 'lost', wallsJustAdvanced: true })
      stopGameTimer()
      sfx('lose')
      return
    }

    sfx('crush')
    set({ tiles: newTiles, wallOffset: newOffset, wallsJustAdvanced: true })

    safeTimeout(() => {
      set({ wallsJustAdvanced: false })
    }, 600)
  },

  tickTimer: () => {
    const { status, timeUntilCompression, compressionActive, currentLevel, currentModeId, compressionOverride } = get()
    if (status !== 'playing') return

    set(s => ({ elapsedSeconds: s.elapsedSeconds + 1 }))

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

  // Legacy alias — tickTimer now handles compression
  tickCompressionTimer: () => {},

  triggerShake: () => {
    set({ screenShake: true })
    safeTimeout(() => set({ screenShake: false }), 400)
  },

  goToMenu: () => {
    clearAllTimers()
    set({ status: 'menu', currentLevel: null, compressionActive: false, showingWin: false, _winCheckPending: false })
  },

  completeTutorial: () => {
    const { completedLevels, bestMoves, generatedLevels, currentModeId, seenTutorials } = get()
    const newSeenTutorials = [...new Set([...seenTutorials, currentModeId])]
    persist({
      completedLevels,
      bestMoves,
      showTutorial: false,
      generatedLevels,
      currentModeId,
      seenTutorials: newSeenTutorials,
    })
    set({ showTutorial: false, seenTutorials: newSeenTutorials, status: 'menu' })
  },

  addGeneratedLevel: (level: Level) => {
    set(state => {
      const generatedLevels = [...state.generatedLevels, level]
      persist({
        completedLevels: state.completedLevels,
        bestMoves: state.bestMoves,
        showTutorial: state.showTutorial,
        generatedLevels,
        currentModeId: state.currentModeId,
        seenTutorials: state.seenTutorials,
      })
      return { generatedLevels }
    })
  },

  deleteGeneratedLevel: (id: number) => {
    set(state => {
      const generatedLevels = state.generatedLevels.filter(l => l.id !== id)
      persist({
        completedLevels: state.completedLevels,
        bestMoves: state.bestMoves,
        showTutorial: state.showTutorial,
        generatedLevels,
        currentModeId: state.currentModeId,
        seenTutorials: state.seenTutorials,
      })
      return { generatedLevels }
    })
  },
}))
