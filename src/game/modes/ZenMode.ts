// PRESSURE - Zen Mode
// Pure puzzle, no walls, no pressure. Just connect the pipes.

import { GameModeConfig, TapResult, WinResult, TutorialStep } from './types'
import { rotateTileTap, checkConnected } from './utils'

export const ZEN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🧘',
    iconColor: '#34d399',
    title: 'Welcome to Zen',
    subtitle: 'NO RUSH, NO WALLS',
    demo: 'fixed-path',
    body: 'Zen mode is pure puzzle. The walls are gone — take as long as you need.\n\nFixed blue pipes show the path. Your job: complete the connection.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap to Rotate',
    subtitle: 'EXPERIMENT FREELY',
    demo: 'rotatable',
    body: 'Tap any orange tile to rotate it. No time pressure, no move penalty. Explore, undo, retry — until the pipes line up perfectly.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Connect the Nodes',
    subtitle: 'YOUR ONLY GOAL',
    demo: 'node',
    body: 'Green goal nodes must all be connected through a continuous pipe path. That\'s it. No walls. No clock. Just pure puzzling.',
  },
  {
    icon: '♾️',
    iconColor: '#34d399',
    title: 'No Limits',
    subtitle: 'TAKE YOUR TIME',
    demo: 'controls',
    body: 'Unlimited moves, unlimited undo. Use hints whenever you want. Zen mode is about finding the solution, not racing against anything.',
  },
  {
    icon: '✦',
    iconColor: '#34d399',
    title: 'Find Your Flow',
    subtitle: 'PURE PUZZLE ZEN',
    demo: 'zen-ready',
    body: 'Connect all the nodes. Take your time. Enjoy the puzzle.',
  },
]

export const ZenMode: GameModeConfig = {
  id: 'zen',
  name: 'Zen',
  description: 'No walls, no pressure. Pure puzzle.',
  icon: '🧘',
  color: '#34d399',
  wallCompression: 'never',
  supportsUndo: true,
  useMoveLimit: false,
  tutorialSteps: ZEN_TUTORIAL_STEPS,

  onTileTap(x, y, tiles): TapResult | null {
    const newTiles = rotateTileTap(x, y, tiles)
    if (!newTiles) return null
    return { tiles: newTiles, valid: true }
  },

  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes)
    return { won, reason: won ? 'Connected!' : undefined }
  },

  statsLabels: {
    moves: 'MOVES',
  },
}
