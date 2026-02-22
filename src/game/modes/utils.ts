// PRESSURE - Shared Mode Utilities
// Common logic reused across different game modes

import { Tile, Position, Direction } from '../types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

/**
 * Create a Map from tiles array for O(1) lookups
 */
export function createTileMap(tiles: Tile[]): Map<string, Tile> {
  const map = new Map<string, Tile>()
  for (const tile of tiles) {
    map.set(`${tile.x},${tile.y}`, tile)
  }
  return map
}

/**
 * Rotate connections array 90 degrees clockwise, `times` steps
 */
export function rotateConnections(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

/**
 * Check if all goal nodes are connected via valid paths using BFS
 */
export function checkConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true

  const tileMap = createTileMap(tiles)
  const visited = new Set<string>()
  const queue: Position[] = [goals[0]]
  visited.add(`${goals[0].x},${goals[0].y}`)
  const connected = new Set([`${goals[0].x},${goals[0].y}`])
  const goalSet = new Set(goals.map(g => `${g.x},${g.y}`))

  while (queue.length > 0) {
    const curr = queue.shift()!
    const tile = tileMap.get(`${curr.x},${curr.y}`)
    if (!tile) continue

    for (const d of tile.connections) {
      let nx = curr.x, ny = curr.y
      if (d === 'up') ny--
      else if (d === 'down') ny++
      else if (d === 'left') nx--
      else if (d === 'right') nx++

      const key = `${nx},${ny}`
      if (visited.has(key)) continue

      const neighbor = tileMap.get(key)
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue

      if (neighbor.connections.includes(OPP[d])) {
        visited.add(key)
        queue.push({ x: nx, y: ny })
        if (goalSet.has(key)) connected.add(key)
      }
    }
  }

  return goals.every(g => connected.has(`${g.x},${g.y}`))
}

/**
 * Get all tile positions connected to goal nodes via BFS
 */
export function getConnectedTiles(tiles: Tile[], goals: Position[]): Set<string> {
  if (goals.length < 2) return new Set()

  const tileMap = createTileMap(tiles)
  const visited = new Set<string>()
  const queue: Position[] = [goals[0]]
  visited.add(`${goals[0].x},${goals[0].y}`)

  while (queue.length > 0) {
    const curr = queue.shift()!
    const tile = tileMap.get(`${curr.x},${curr.y}`)
    if (!tile) continue

    for (const d of tile.connections) {
      let nx = curr.x, ny = curr.y
      if (d === 'up') ny--
      else if (d === 'down') ny++
      else if (d === 'left') nx--
      else if (d === 'right') nx++

      const key = `${nx},${ny}`
      if (visited.has(key)) continue

      const neighbor = tileMap.get(key)
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue

      if (neighbor.connections.includes(OPP[d])) {
        visited.add(key)
        queue.push({ x: nx, y: ny })
      }
    }
  }

  return visited
}

/**
 * Standard tile rotation tap handler - used by pipe-based modes
 */
export function rotateTileTap(
  x: number,
  y: number,
  tiles: Tile[]
) {
  const tile = tiles.find(t => t.x === x && t.y === y)
  if (!tile?.canRotate) return null

  const newTiles = tiles.map(t => {
    if (t.x === x && t.y === y) {
      return { ...t, connections: rotateConnections(t.connections, 1), justRotated: true }
    }
    return { ...t, justRotated: false }
  })

  return newTiles
}
