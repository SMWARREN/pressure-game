// PRESSURE - Verified Solvable Levels with Pre-computed Solutions
import { Level, Tile, Position, Direction } from './types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

function rotate(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

// BFS to check if all goal nodes are connected
function isConnected(tiles: Tile[], goals: Position[]): boolean {
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

// BFS solver - returns solution path or undefined
function solve(tiles: Tile[], goals: Position[], maxMoves: number): { x: number; y: number; rotations: number }[] | undefined {
  if (isConnected(tiles, goals)) return []

  const rotatable = tiles.filter(t => t.canRotate)
  if (rotatable.length === 0) return undefined

  const visited = new Set<string>()
  const queue: { tiles: Tile[]; path: { x: number; y: number; rotations: number }[] }[] = [
    { tiles: [...tiles], path: [] }
  ]

  const hash = (ts: Tile[]) => ts
    .filter(t => t.canRotate)
    .map(t => `${t.x},${t.y}:${t.connections.join(',')}`)
    .sort()
    .join('|')

  visited.add(hash(tiles))

  let iterations = 0
  const MAX_ITERATIONS = 50_000

  while (queue.length > 0) {
    if (++iterations > MAX_ITERATIONS) return undefined

    const curr = queue.shift()!

    for (const rt of rotatable) {
      for (let r = 1; r <= 3; r++) {
        const newTiles = curr.tiles.map(t => {
          if (t.x === rt.x && t.y === rt.y) {
            return { ...t, connections: rotate(t.connections, r) }
          }
          return t
        })

        const h = hash(newTiles)
        if (visited.has(h)) continue
        visited.add(h)

        const newPath = [...curr.path, { x: rt.x, y: rt.y, rotations: r }]

        if (isConnected(newTiles, goals)) return newPath

        const totalMoves = newPath.reduce((s, p) => s + p.rotations, 0)
        if (totalMoves < maxMoves) {
          queue.push({ tiles: newTiles, path: newPath })
        }
      }
    }
  }

  return undefined
}

// Create a tile
function tile(type: Tile['type'], x: number, y: number, extra: Partial<Tile> = {}): Tile {
  return {
    id: `${type}-${x}-${y}`,
    type, x, y,
    connections: [],
    isGoalNode: false,
    canRotate: false,
    ...extra
  }
}

// Create wall border for a grid
function createWalls(size: number): Tile[] {
  const walls: Tile[] = []
  for (let i = 0; i < size; i++) {
    walls.push(tile('wall', i, 0))
    walls.push(tile('wall', i, size - 1))
    if (i > 0 && i < size - 1) {
      walls.push(tile('wall', 0, i))
      walls.push(tile('wall', size - 1, i))
    }
  }
  return walls
}

// Create a level with pre-computed solution
function createLevel(config: Omit<Level, 'solution'>): Level {
  const solution = solve(config.tiles, config.goalNodes, config.maxMoves)
  return { ...config, solution }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PIPE SHAPES REFERENCE:
   
   Straight pipes: 
     ['up','down'] - vertical (rotates to horizontal ['left','right'])
     ['left','right'] - horizontal (rotates to vertical ['up','down'])
   
   L-shaped corners (stay L-shaped after rotation, just oriented differently):
     ['up','right'] - opens up and right
     ['right','down'] - opens right and down
     ['down','left'] - opens down and left
     ['left','up'] - opens left and up
   
   T-shaped (3 connections):
     ['up','right','down'], ['right','down','left'], etc.
   
   Cross (all 4 directions - doesn't need rotation):
     ['up','down','left','right']
   
   IMPORTANT: A straight pipe can NEVER become L-shaped through rotation!
═══════════════════════════════════════════════════════════════════════════ */

// ALL LEVELS - Properly designed with correct pipe shapes
export const LEVELS: Level[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // WORLD 1: BREATHE - Learn the basics
  // ═══════════════════════════════════════════════════════════════════════
  
  // Level 1: Simple horizontal connection
  createLevel({
    id: 1, name: 'First', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 2, { connections: ['up', 'down'], canRotate: true }), // Vertical, needs horizontal
      tile('node', 3, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 10000,
    
    maxMoves: 3,
    goalNodes: [{ x: 1, y: 2 }, { x: 3, y: 2 }],
  }),

  // Level 2: Simple vertical connection  
  createLevel({
    id: 2, name: 'Rise', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 2, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 2, { connections: ['left', 'right'], canRotate: true }), // Horizontal, needs vertical
      tile('node', 2, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 8000,
    
    maxMoves: 3,
    goalNodes: [{ x: 2, y: 1 }, { x: 2, y: 3 }],
  }),

  // Level 3: L-corner with L-shaped pipe
  createLevel({
    id: 3, name: 'Corner', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // L-shaped corner: currently opens left+up, needs to open left+down
      tile('path', 1, 2, { connections: ['left', 'up'], canRotate: true }),
      tile('node', 2, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 8000,
    
    maxMoves: 4,
    goalNodes: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
  }),

  // Level 4: Path with corner - needs L-shaped pipe
  createLevel({
    id: 4, name: 'Double', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Straight pipe - needs to be horizontal
      tile('path', 2, 2, { connections: ['up', 'down'], canRotate: true }),
      // L-shaped pipe - needs to connect left and down
      tile('path', 3, 2, { connections: ['up', 'right'], canRotate: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 7000,
    
    maxMoves: 5,
    goalNodes: [{ x: 1, y: 2 }, { x: 3, y: 3 }],
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // WORLD 2: SQUEEZE - Feel the pressure
  // ═══════════════════════════════════════════════════════════════════════

  // Level 5: Square ring - connect 4 corner nodes
  createLevel({
    id: 5, name: 'Square', world: 2, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Top and bottom edges - straight pipes
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
      // Left and right edges - straight pipes
      tile('path', 1, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
    ],
    compressionDelay: 6000,
    
    maxMoves: 8,
    goalNodes: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
  }),

  // Level 6: S-curve zigzag with L-corners
  createLevel({
    id: 6, name: 'Zigzag', world: 2, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }), // Straight
      tile('path', 3, 1, { connections: ['left', 'up'], canRotate: true }), // L-corner
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }), // Straight vertical
      tile('path', 3, 3, { connections: ['down', 'right'], canRotate: true }), // L-corner
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }), // Straight
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 6000,
    
    maxMoves: 10,
    goalNodes: [{ x: 1, y: 1 }, { x: 1, y: 3 }],
  }),

  // Level 7: Simple with decoy
  createLevel({
    id: 7, name: 'Triple', world: 2, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 2, { connections: ['up', 'down'], canRotate: true }),
      tile('node', 3, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Decoy path - doesn't connect to solution
      tile('path', 2, 3, { connections: ['left', 'right'], canRotate: true }),
    ],
    compressionDelay: 5000,
    
    maxMoves: 3,
    goalNodes: [{ x: 1, y: 2 }, { x: 3, y: 2 }],
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // WORLD 3: CRUSH - Expert challenges
  // ═══════════════════════════════════════════════════════════════════════

  // Level 8: Cross with center hub
  createLevel({
    id: 8, name: 'Cross', world: 3, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Center cross (fixed, doesn't rotate)
      tile('path', 2, 2, { connections: ['up', 'down', 'left', 'right'] }),
      // Spokes to each corner
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 1, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
    ],
    compressionDelay: 5000,
    
    maxMoves: 6,
    goalNodes: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
  }),

  // Level 9: Winding spiral path
  createLevel({
    id: 9, name: 'Spiral', world: 3, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 3, 1, { connections: ['left', 'up'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 3, { connections: ['up', 'right'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 4000,
    
    maxMoves: 10,
    goalNodes: [{ x: 1, y: 1 }, { x: 1, y: 3 }],
  }),

  // Level 10: Final - connect all nodes through center (T-shaped pipes needed!)
  createLevel({
    id: 10, name: 'Final', world: 3, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 2, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // T-shaped pipes: top path needs left, right, down
      tile('path', 2, 1, { connections: ['up', 'down', 'left'], canRotate: true }),
      // left path needs up, down, right
      tile('path', 1, 2, { connections: ['up', 'left', 'right'], canRotate: true }),
      // right path needs up, down, left
      tile('path', 3, 2, { connections: ['down', 'left', 'right'], canRotate: true }),
      // bottom path needs left, right, up
      tile('path', 2, 3, { connections: ['up', 'down', 'right'], canRotate: true }),
    ],
    compressionDelay: 4000,
    
    maxMoves: 8,
    goalNodes: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
  }),
]

export function getLevelsByWorld(world: number): Level[] {
  return LEVELS.filter(l => l.world === world)
}

// Get solution for a level (returns pre-computed solution or null)
export function getSolution(level: Level): { x: number; y: number; rotations: number }[] | null {
  return level.solution ?? null
}

/* ─────────────────────────────────────────
   Level Verifier
───────────────────────────────────────── */
export function verifyLevel(level: Level): { solvable: boolean; minMoves: number } {
  const sol = level.solution ?? solve(level.tiles, level.goalNodes, level.maxMoves)
  return { solvable: sol !== null, minMoves: sol?.reduce((s, p) => s + p.rotations, 0) ?? -1 }
}

/* ─────────────────────────────────────────
   Procedural Level Generator
───────────────────────────────────────── */
export interface GenerateOptions {
  gridSize: number
  nodeCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  decoys?: boolean | number
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateLevel(opts: GenerateOptions): Level {
  const { gridSize, nodeCount, difficulty } = opts

  const diffParams = {
    easy:   { compressionDelay: 10000, movePadding: 4, decoyCount: 0 },
    medium: { compressionDelay: 6000,  movePadding: 2, decoyCount: 2 },
    hard:   { compressionDelay: 4000,  movePadding: 1, decoyCount: 3 },
  }[difficulty]

  const useDecoys = opts.decoys !== undefined ? opts.decoys : diffParams.decoyCount > 0
  const decoyCount = useDecoys ? diffParams.decoyCount : 0

  // Pipe shapes: straight and L-shapes
  const pipeShapes: Direction[][] = [
    ['up', 'down'],
    ['left', 'right'],
    ['up', 'right'],
    ['right', 'down'],
    ['down', 'left'],
    ['left', 'up'],
  ]

  for (let attempt = 0; attempt < 50; attempt++) {
    const margin = Math.min(2, Math.floor(gridSize / 3))
    const candidates: Position[] = []
    for (let y = margin; y < gridSize - margin; y++)
      for (let x = margin; x < gridSize - margin; x++)
        candidates.push({ x, y })

    const shuffled = shuffleArray(candidates)
    const goalPositions: Position[] = []
    for (const pos of shuffled) {
      if (goalPositions.length >= nodeCount) break
      const tooClose = goalPositions.some(g => Math.abs(g.x - pos.x) + Math.abs(g.y - pos.y) < 2)
      if (!tooClose) goalPositions.push(pos)
    }
    if (goalPositions.length < nodeCount) continue

    const pathDirs = new Map<string, Direction[]>()

    const addPath = (x: number, y: number, dirs: Direction[]) => {
      const key = `${x},${y}`
      const existing = pathDirs.get(key) ?? []
      const merged = [...new Set([...existing, ...dirs])]
      pathDirs.set(key, merged)
    }

    // Create paths between all goal nodes in sequence
    for (let i = 0; i < goalPositions.length - 1; i++) {
      const from = goalPositions[i]
      const to = goalPositions[i + 1]
      
      let cx = from.x, cy = from.y
      
      // Move horizontally first
      while (cx !== to.x) {
        const dx = to.x > cx ? 1 : -1
        const dir: Direction = dx > 0 ? 'right' : 'left'
        addPath(cx, cy, [dir])
        cx += dx
        const opp: Direction = dx > 0 ? 'left' : 'right'
        addPath(cx, cy, [opp])
      }
      
      // Then move vertically
      while (cy !== to.y) {
        const dy = to.y > cy ? 1 : -1
        const dir: Direction = dy > 0 ? 'down' : 'up'
        addPath(cx, cy, [dir])
        cy += dy
        const opp: Direction = dy > 0 ? 'up' : 'down'
        addPath(cx, cy, [opp])
      }
    }

    const wallTiles: Tile[] = []
    for (let i = 0; i < gridSize; i++) {
      wallTiles.push({ id: `wall-${i}-0`, type: 'wall', x: i, y: 0, connections: [], isGoalNode: false, canRotate: false })
      wallTiles.push({ id: `wall-${i}-${gridSize - 1}`, type: 'wall', x: i, y: gridSize - 1, connections: [], isGoalNode: false, canRotate: false })
      if (i > 0 && i < gridSize - 1) {
        wallTiles.push({ id: `wall-0-${i}`, type: 'wall', x: 0, y: i, connections: [], isGoalNode: false, canRotate: false })
        wallTiles.push({ id: `wall-${gridSize - 1}-${i}`, type: 'wall', x: gridSize - 1, y: i, connections: [], isGoalNode: false, canRotate: false })
      }
    }

    const goalSet = new Set(goalPositions.map(p => `${p.x},${p.y}`))
    const nodeTiles: Tile[] = goalPositions.map(p => ({
      id: `node-${p.x}-${p.y}`, type: 'node' as const,
      x: p.x, y: p.y,
      connections: ['up', 'down', 'left', 'right'] as Direction[],
      isGoalNode: true, canRotate: false,
    }))

    const pathTiles: Tile[] = []
    pathDirs.forEach((dirs, key) => {
      const [px, py] = key.split(',').map(Number)
      if (goalSet.has(key)) return
      
      // Find a pipe shape that can rotate to match needed connections
      let bestShape = pipeShapes[0]
      for (const shape of pipeShapes) {
        for (let r = 0; r < 4; r++) {
          const rotated = shape.map(d => DIRS[(DIRS.indexOf(d) + r) % 4])
          if (dirs.every(d => rotated.includes(d))) {
            bestShape = shape
            break
          }
        }
      }
      
      // Scramble: start in wrong rotation
      const scrambleAmount = rng(1, 3)
      const scrambledConns = bestShape.map(d => DIRS[(DIRS.indexOf(d) + scrambleAmount) % 4])
      
      pathTiles.push({
        id: `path-${px}-${py}`, type: 'path',
        x: px, y: py,
        connections: scrambledConns,
        isGoalNode: false, canRotate: true,
      })
    })

    const allTiles = [...wallTiles, ...nodeTiles, ...pathTiles]
    
    // CRITICAL: Check if level is already solved before scrambling more
    // An empty solution array [] means 0 moves needed = already connected
    if (isConnected(allTiles, goalPositions)) continue
    
    const estimatedMaxMoves = pathTiles.length * 3 + diffParams.movePadding
    const solution = solve(allTiles, goalPositions, estimatedMaxMoves)
    
    // Skip if unsolvable OR if already solved (empty solution = 0 moves)
    if (!solution || solution.length === 0) continue

    const minMoves = solution.reduce((s, p) => s + p.rotations, 0)
    const maxMoves = minMoves + diffParams.movePadding

    const occupiedKeys = new Set([
      ...goalPositions.map(p => `${p.x},${p.y}`),
      ...pathTiles.map(t => `${t.x},${t.y}`),
    ])

    const decoyTiles: Tile[] = []

    if (decoyCount > 0) {
      const interiorCells: Position[] = []
      for (let y = 1; y < gridSize - 1; y++)
        for (let x = 1; x < gridSize - 1; x++)
          if (!occupiedKeys.has(`${x},${y}`)) interiorCells.push({ x, y })

      const shuffledInterior = shuffleArray(interiorCells)
      for (let i = 0; i < Math.min(decoyCount, shuffledInterior.length); i++) {
        const { x, y } = shuffledInterior[i]
        const dirs = pipeShapes[rng(0, pipeShapes.length - 1)]
        decoyTiles.push({
          id: `decoy-${x}-${y}`, type: 'path', x, y,
          connections: dirs, isGoalNode: false, canRotate: true,
        })
      }
    }

    const finalTiles = [...wallTiles, ...nodeTiles, ...pathTiles, ...decoyTiles]

    return {
      id: Date.now() + attempt,
      name: generateLevelName(difficulty),
      world: 4, gridSize,
      tiles: finalTiles,
      compressionDelay: diffParams.compressionDelay,
      maxMoves,
      goalNodes: goalPositions,
      isGenerated: true,
      solution,
    }
  }

  return generateSimpleFallback(gridSize, difficulty)
}

function generateLevelName(difficulty: string): string {
  const byDiff: Record<string, string[]> = {
    easy:   ['Calm', 'Gentle', 'Soft', 'Slow', 'Easy', 'Mild', 'Simple', 'Light', 'Smooth', 'Basic'],
    medium: ['Twisted', 'Warped', 'Fractured', 'Bent', 'Coiled', 'Tangled', 'Knotted', 'Looped', 'Wired', 'Crossed'],
    hard:   ['Brutal', 'Savage', 'Merciless', 'Vicious', 'Deadly', 'Fierce', 'Extreme', 'Critical', 'Lethal', 'Crushing'],
  }
  const nouns = ['Circuit', 'Conduit', 'Nexus', 'Node', 'Web', 'Mesh', 'Matrix', 'Grid', 'Array', 'Path', 'Strand', 'Line', 'Flow', 'Pulse', 'Link', 'Chain', 'Pipe', 'Thread', 'Wire', 'Route']
  const adj = (byDiff[difficulty] ?? byDiff.medium)[Math.floor(Math.random() * 10)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun}`
}

function generateSimpleFallback(gridSize: number, difficulty: string): Level {
  const mid = Math.floor(gridSize / 2)
  const diffParams = {
    easy:   { compressionDelay: 10000,  movePadding: 4 },
    medium: { compressionDelay: 6000,   movePadding: 2 },
    hard:   { compressionDelay: 4000,   movePadding: 1 },
  }[difficulty as 'easy' | 'medium' | 'hard'] ?? { compressionDelay: 6000,  movePadding: 2 }

  const wallTiles: Tile[] = []
  for (let i = 0; i < gridSize; i++) {
    wallTiles.push({ id: `wall-${i}-0`, type: 'wall', x: i, y: 0, connections: [], isGoalNode: false, canRotate: false })
    wallTiles.push({ id: `wall-${i}-${gridSize - 1}`, type: 'wall', x: i, y: gridSize - 1, connections: [], isGoalNode: false, canRotate: false })
    if (i > 0 && i < gridSize - 1) {
      wallTiles.push({ id: `wall-0-${i}`, type: 'wall', x: 0, y: i, connections: [], isGoalNode: false, canRotate: false })
      wallTiles.push({ id: `wall-${gridSize - 1}-${i}`, type: 'wall', x: gridSize - 1, y: i, connections: [], isGoalNode: false, canRotate: false })
    }
  }

  // Start with vertical pipe (needs to be rotated horizontal to connect)
  const tiles: Tile[] = [
    ...wallTiles,
    { id: 'node-1-mid', type: 'node', x: 1, y: mid, connections: ['up', 'down', 'left', 'right'] as Direction[], isGoalNode: true, canRotate: false },
    { id: 'path-mid-mid', type: 'path', x: mid, y: mid, connections: ['up', 'down'] as Direction[], isGoalNode: false, canRotate: true },
    { id: `node-${gridSize - 2}-mid`, type: 'node', x: gridSize - 2, y: mid, connections: ['up', 'down', 'left', 'right'] as Direction[], isGoalNode: true, canRotate: false },
  ]

  const goalNodes = [{ x: 1, y: mid }, { x: gridSize - 2, y: mid }]
  
  // Verify not already solved
  if (isConnected(tiles, goalNodes)) {
    // Force rotate the path to break connection
    const pathIdx = tiles.findIndex(t => t.type === 'path' && t.canRotate)
    if (pathIdx >= 0) {
      tiles[pathIdx] = { ...tiles[pathIdx], connections: ['left', 'up'] }
    }
  }
  
  const solution = solve(tiles, goalNodes, 3 + diffParams.movePadding)
  const minMoves = solution ? solution.reduce((s, p) => s + p.rotations, 0) : 1

  return {
    id: Date.now(),
    name: 'Simple Path',
    world: 4, gridSize,
    tiles,
    compressionDelay: diffParams.compressionDelay,
    maxMoves: minMoves + diffParams.movePadding,
    goalNodes,
    isGenerated: true,
    solution,
  }
}
