// PRESSURE - Classic Mode
// The original pipe puzzle with closing walls.
// Connect all goal nodes before the walls crush them.

import { GameModeConfig, TapResult, WinResult } from './types'
import { rotateTileTap, checkConnected } from './utils'

export const ClassicMode: GameModeConfig = {
  id: 'classic',
  name: 'Pressure',
  description: 'Connect all nodes before the walls close in.',
  icon: '⚡',
  color: '#a78bfa',
  wallCompression: 'always',
  supportsUndo: true,
  useMoveLimit: true,

  onTileTap(x, y, tiles): TapResult | null {
    const newTiles = rotateTileTap(x, y, tiles)
    if (!newTiles) return null
    return { tiles: newTiles, valid: true }
  },

  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes)
    return { won, reason: won ? 'All nodes connected!' : undefined }
  },

  statsLabels: {
    moves: 'MOVES',
    compression: 'PRESSURE',
  },
}
