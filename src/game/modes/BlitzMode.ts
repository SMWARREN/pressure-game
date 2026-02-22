// PRESSURE - Blitz Mode
// Walls close fast and never stop. No move limit — solve it before you're crushed.
// Designed for speed: fewer taps, maximum panic.

import { GameModeConfig, TapResult, WinResult, LossResult } from './types'
import { rotateTileTap, checkConnected } from './utils'
import { Tile } from '../types'

export const BlitzMode: GameModeConfig = {
  id: 'blitz',
  name: 'Blitz',
  description: 'No move limit. Walls never stop. Solve fast or die.',
  icon: '🔥',
  color: '#f97316',
  wallCompression: 'always',
  supportsUndo: false, // no undo in blitz — commit to your choices
  useMoveLimit: false,

  onTileTap(x, y, tiles): TapResult | null {
    const newTiles = rotateTileTap(x, y, tiles)
    if (!newTiles) return null
    return { tiles: newTiles, valid: true }
  },

  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes)
    return { won, reason: won ? 'Survived!' : undefined }
  },

  checkLoss(tiles, wallOffset, _moves, _maxMoves): LossResult {
    // In blitz, lose if any goal node tile gets crushed
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
