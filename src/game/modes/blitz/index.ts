// PRESSURE - Blitz Mode
// Walls close fast and never stop. No move limit — solve it before you're crushed.

import { GameModeConfig, TapResult, WinResult, LossResult, TutorialStep } from '../types'
import { rotateTileTap, checkConnected } from '../utils'
import { LEVELS } from '../../levels'
import { Tile } from '../../types'

export const BLITZ_WORLDS = [
  { id: 1, name: 'Breathe', tagline: 'Warm up', color: '#fb923c', icon: '◈' },
  { id: 2, name: 'Squeeze', tagline: 'Walls never stop', color: '#f97316', icon: '◆' },
  { id: 3, name: 'Crush', tagline: 'No mercy', color: '#ef4444', icon: '⬟' },
]

export const BLITZ_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🔥',
    iconColor: '#f97316',
    title: 'Welcome to Blitz',
    subtitle: 'SPEED IS EVERYTHING',
    demo: 'fixed-path',
    body: 'Blitz is the most intense mode. No move limit — but the walls never stop closing.\n\nConnect the pipes before you\'re crushed.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap Fast',
    subtitle: 'EVERY SECOND COUNTS',
    demo: 'rotatable',
    body: 'Tap tiles to rotate them. In Blitz, speed matters more than efficiency. No undo — commit to every move.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Protect the Nodes',
    subtitle: 'ONE CRUSH = GAME OVER',
    demo: 'node',
    body: 'If a single goal node gets crushed by the walls, you lose instantly. In classic mode you can afford mistakes — in Blitz you cannot.',
  },
  {
    icon: '💀',
    iconColor: '#ef4444',
    title: 'Walls Never Stop',
    subtitle: 'RELENTLESS PRESSURE',
    demo: 'walls',
    body: 'The walls advance on a short timer and never pause. No undo means no second chances — scan the board fast and move with purpose.',
  },
  {
    icon: '✦',
    iconColor: '#f97316',
    title: 'Survive!',
    subtitle: 'CONNECT OR DIE',
    demo: 'blitz-ready',
    body: 'No undo. Walls never stop. One crushed node ends the run.\n\nThink fast. Move faster.',
  },
]

export const BlitzMode: GameModeConfig = {
  id: 'blitz',
  name: 'Blitz',
  description: 'No move limit. Walls never stop. Solve fast or die.',
  icon: '🔥',
  color: '#f97316',
  wallCompression: 'always',
  supportsUndo: false,
  useMoveLimit: false,
  tutorialSteps: BLITZ_TUTORIAL_STEPS,
  getLevels: () => LEVELS,
  worlds: BLITZ_WORLDS,
  supportsWorkshop: true,

  onTileTap(x, y, tiles): TapResult | null {
    const newTiles = rotateTileTap(x, y, tiles)
    if (!newTiles) return null
    return { tiles: newTiles, valid: true }
  },

  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes)
    return { won, reason: won ? 'Survived!' : undefined }
  },

  checkLoss(tiles, _wallOffset, _moves, _maxMoves): LossResult {
    const crushedGoal = tiles.some(
      (t: Tile) => t.isGoalNode && t.type === 'crushed'
    )
    return {
      lost: crushedGoal,
      reason: crushedGoal ? 'A node was crushed!' : undefined,
    }
  },

  statsLabels: {
    moves: 'TAPS',
    compression: 'INCOMING',
  },
}
