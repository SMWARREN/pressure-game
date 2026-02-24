// PRESSURE - Classic Mode Levels
// The original 10 hand-crafted pipe puzzle levels.

import { Level, Tile } from '../../types';

// Create a tile
function tile(type: Tile['type'], x: number, y: number, extra: Partial<Tile> = {}): Tile {
  return {
    id: `${type}-${x}-${y}`,
    type,
    x,
    y,
    connections: [],
    isGoalNode: false,
    canRotate: false,
    ...extra,
  };
}

// Create wall border for a grid
function createWalls(size: number): Tile[] {
  const walls: Tile[] = [];
  for (let i = 0; i < size; i++) {
    walls.push(tile('wall', i, 0));
    walls.push(tile('wall', i, size - 1));
    if (i > 0 && i < size - 1) {
      walls.push(tile('wall', 0, i));
      walls.push(tile('wall', size - 1, i));
    }
  }
  return walls;
}

// Create a level
function createLevel(config: Omit<Level, 'solution'>): Level {
  return { ...config };
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

// CLASSIC MODE LEVELS - Properly designed with correct pipe shapes
export const CLASSIC_LEVELS: Level[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // WORLD 1: BREATHE - Learn the basics
  // ═══════════════════════════════════════════════════════════════════════

  // Level 1: Simple horizontal connection
  createLevel({
    id: 1,
    name: 'First',
    world: 1,
    gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 2, { connections: ['up', 'down'], canRotate: true }), // Vertical, needs horizontal
      tile('node', 3, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 10000,
    maxMoves: 3,
    goalNodes: [
      { x: 1, y: 2 },
      { x: 3, y: 2 },
    ],
  }),

  // Level 2: Simple vertical connection
  createLevel({
    id: 2,
    name: 'Rise',
    world: 1,
    gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 2, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 2, { connections: ['left', 'right'], canRotate: true }), // Horizontal, needs vertical
      tile('node', 2, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 8000,
    maxMoves: 3,
    goalNodes: [
      { x: 2, y: 1 },
      { x: 2, y: 3 },
    ],
  }),

  // Level 3: L-corner with L-shaped pipe
  createLevel({
    id: 3,
    name: 'Corner',
    world: 1,
    gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // L-shaped corner: currently opens left+up, needs to open left+down
      tile('path', 1, 2, { connections: ['left', 'up'], canRotate: true }),
      tile('node', 2, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 8000,
    maxMoves: 4,
    goalNodes: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ],
  }),

  // Level 4: Path with corner - needs L-shaped pipe
  createLevel({
    id: 4,
    name: 'Double',
    world: 1,
    gridSize: 5,
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
    goalNodes: [
      { x: 1, y: 2 },
      { x: 3, y: 3 },
    ],
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // WORLD 2: SQUEEZE - Feel the pressure
  // ═══════════════════════════════════════════════════════════════════════

  // Level 5: Square ring - connect 4 corner nodes
  createLevel({
    id: 5,
    name: 'Square',
    world: 2,
    gridSize: 5,
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
    goalNodes: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ],
  }),

  // Level 6: S-curve zigzag with L-corners
  createLevel({
    id: 6,
    name: 'Zigzag',
    world: 2,
    gridSize: 5,
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
    goalNodes: [
      { x: 1, y: 1 },
      { x: 1, y: 3 },
    ],
  }),

  // Level 7: Simple with decoy
  createLevel({
    id: 7,
    name: 'Triple',
    world: 2,
    gridSize: 5,
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
    goalNodes: [
      { x: 1, y: 2 },
      { x: 3, y: 2 },
    ],
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // WORLD 3: CRUSH - Expert challenges
  // ═══════════════════════════════════════════════════════════════════════

  // Level 8: Cross with center hub
  createLevel({
    id: 8,
    name: 'Cross',
    world: 3,
    gridSize: 5,
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
    goalNodes: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ],
  }),

  // Level 9: Winding spiral path
  createLevel({
    id: 9,
    name: 'Spiral',
    world: 3,
    gridSize: 5,
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
    goalNodes: [
      { x: 1, y: 1 },
      { x: 1, y: 3 },
    ],
  }),

  // Level 10: Final - connect all nodes through center (T-shaped pipes needed!)
  createLevel({
    id: 10,
    name: 'Final',
    world: 3,
    gridSize: 5,
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
    goalNodes: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ],
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // NEW LEVELS — One per world, each with a unique gimmick
  // ═══════════════════════════════════════════════════════════════════════

  // Level 11: Overpass — fixed obstacle forces a scenic detour (World 1)
  // The vertical pipe at center can't be rotated; route the flow over the top.
  createLevel({
    id: 11,
    name: 'Overpass',
    world: 1,
    gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Fixed blocker in the direct lane — cannot be rotated
      tile('path', 2, 2, { connections: ['up', 'down'] }),
      // Detour route through row 1 (all scrambled wrong)
      tile('path', 1, 1, { connections: ['left', 'up'], canRotate: true }), // needs ['right','down']
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }), // needs ['left','right']
      tile('path', 3, 1, { connections: ['up', 'right'], canRotate: true }), // needs ['down','left']
      // Red-herring pipe below — looks useful, isn't
      tile('path', 2, 3, { connections: ['left', 'right'], canRotate: true }),
    ],
    compressionDelay: 8500,
    maxMoves: 7,
    goalNodes: [
      { x: 1, y: 2 },
      { x: 3, y: 2 },
    ],
  }),

  // Level 12: Star — four nodes in a compass rose, linked by a T-junction + side path (World 2)
  // The T-pipe at center connects three arms; the fourth sneaks through a back alley.
  createLevel({
    id: 12,
    name: 'Star',
    world: 2,
    gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 2, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 2, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // T-junction linking top, left, right arms — needs ['left','up','right']
      tile('path', 2, 2, { connections: ['down', 'left', 'up'], canRotate: true }), // 1 rotation
      // Side alley connecting left node down to bottom node — needs ['up','right']
      tile('path', 1, 3, { connections: ['down', 'left'], canRotate: true }), // 2 rotations
      // Decoy in the corner — tempts but dead-ends
      tile('path', 3, 3, { connections: ['up', 'right'], canRotate: true }),
    ],
    compressionDelay: 5500,
    maxMoves: 6,
    goalNodes: [
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ],
  }),

  // Level 13: Rungs — connect all four corners through an H-shaped ladder (World 3)
  // Two T-junctions act as crossbars; a single straight pipe is the spine. Decoys on the sides.
  createLevel({
    id: 13,
    name: 'Rungs',
    world: 3,
    gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Top crossbar T-pipe (connects left, right, and down) — needs ['right','down','left']
      tile('path', 2, 1, { connections: ['left', 'up', 'right'], canRotate: true }), // 2 rotations
      // Spine connecting the two crossbars — needs ['up','down']
      tile('path', 2, 2, { connections: ['left', 'right'], canRotate: true }), // 1 rotation
      // Bottom crossbar T-pipe (connects left, right, and up) — needs ['left','up','right']
      tile('path', 2, 3, { connections: ['right', 'down', 'left'], canRotate: true }), // 2 rotations
      // Side decoys that look like they bridge the corners but don't
      tile('path', 1, 2, { connections: ['left', 'up'], canRotate: true }),
      tile('path', 3, 2, { connections: ['right', 'down'], canRotate: true }),
    ],
    compressionDelay: 4000,
    maxMoves: 8,
    goalNodes: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ],
  }),
];

export function getLevelsByWorld(world: number): Level[] {
  return CLASSIC_LEVELS.filter((l) => l.world === world);
}
