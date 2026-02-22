// PRESSURE - Zen Mode
// Pure puzzle, no walls, no pressure. Just connect the pipes.

import { GameModeConfig, TapResult, WinResult } from './types'
import { rotateTileTap, checkConnected } from './utils'

export const ZenMode: GameModeConfig = {
  id: 'zen',
  name: 'Zen',
  description: 'No walls, no pressure. Pure puzzle.',
  icon: '🧘',
  color: '#34d399',
  wallCompression: 'never',
  supportsUndo: true,
  useMoveLimit: false, // no move cap in zen

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
