// MIRROR FORGE MODE — Level Definitions
//
// The grid is split into LEFT and RIGHT halves by a central mirror line.
// Every tile on the left has a mirrored twin on the right.
// When you tap a LEFT tile, it rotates AND its mirror on the right rotates too (flipped).
// Tap a RIGHT tile → it rotates AND the mirror on left rotates (flipped).
//
// Goal: connect all goal nodes using the symmetric pipe layout.
// Some tiles are ANCHORED (fixed, cannot be rotated) — they appear identically on both sides.
//
// Win: all goal nodes connected (pipe-style connectivity).

import { Level, Tile } from '../../types';

export const MIRROR_WORLDS = [
  { id: 1, name: 'Reflection', tagline: 'Learn the mirror mechanic', color: '#a78bfa', icon: '🪞' },
  { id: 2, name: 'Symmetry', tagline: 'Complex symmetric puzzles', color: '#34d399', icon: '♾️' },
  {
    id: 3,
    name: 'Fracture',
    tagline: 'Broken mirrors need careful hands',
    color: '#f472b6',
    icon: '💎',
  },
];

// Direction helpers
type Dir = 'up' | 'right' | 'down' | 'left';
const DIR_ORDER: Dir[] = ['up', 'right', 'down', 'left'];

export function rotateDirs(dirs: Dir[], steps = 1): Dir[] {
  return dirs.map((d) => DIR_ORDER[(DIR_ORDER.indexOf(d) + steps) % 4]);
}

// Mirror a direction horizontally (flip left↔right)
export function mirrorDirH(d: Dir): Dir {
  if (d === 'left') return 'right';
  if (d === 'right') return 'left';
  return d;
}

// Mirror a full connection array horizontally
export function mirrorConnections(dirs: Dir[]): Dir[] {
  return dirs.map(mirrorDirH);
}

export interface MirrorTileData extends Record<string, unknown> {
  side: 'left' | 'right' | 'center'; // which side of the board this tile is on
  mirrorX: number; // x coordinate of the mirror twin
  anchorId?: string; // if set, this tile cannot rotate
  isNew: boolean;
}

function tile(
  x: number,
  y: number,
  connections: Dir[],
  canRotate: boolean,
  isGoalNode: boolean,
  side: 'left' | 'right' | 'center',
  mirrorX: number,
  anchorId?: string
): Tile {
  return {
    id: `m${x}-${y}`,
    type: 'path',
    x,
    y,
    connections,
    canRotate,
    isGoalNode,
    displayData: { side, mirrorX, anchorId, isNew: false } as MirrorTileData,
  };
}

// Build a mirrored level from a LEFT-side description only.
// Right side is auto-generated as the horizontal mirror.
// gridSize must be ODD so there's a center column (the mirror line).
function buildMirrorLevel(
  gridSize: number,
  leftTiles: Array<{
    x: number;
    y: number;
    connections: Dir[];
    canRotate?: boolean;
    isGoalNode?: boolean;
  }>
): Tile[] {
  const center = Math.floor(gridSize / 2);
  const tiles: Tile[] = [];

  // Validate: left tiles must have x < center
  for (const t of leftTiles) {
    if (t.x >= center) continue; // skip if accidentally placed in center or right

    const mirrorX = gridSize - 1 - t.x; // mirror x position

    // Left tile
    tiles.push(
      tile(t.x, t.y, t.connections, t.canRotate !== false, t.isGoalNode === true, 'left', mirrorX)
    );

    // Right mirror tile (auto-generated with flipped connections)
    tiles.push(
      tile(
        mirrorX,
        t.y,
        mirrorConnections(t.connections),
        t.canRotate !== false,
        t.isGoalNode === true,
        'right',
        t.x
      )
    );
  }

  // Center column tiles (these rotate independently, not mirrored)
  for (let y = 0; y < gridSize; y++) {
    const existing = leftTiles.find((t) => t.x === center && t.y === y);
    const c = existing ?? { connections: [], canRotate: true, isGoalNode: false };
    tiles.push(
      tile(center, y, c.connections, c.canRotate !== false, c.isGoalNode === true, 'center', center)
    );
  }

  return tiles;
}

// ── Hand-authored levels ──────────────────────────────────────────────────────
// gridSize = 5 (center col = 2), left cols = 0,1

function level5x5(
  id: number,
  name: string,
  world: number,
  maxMoves: number,
  leftTiles: Array<{
    x: number;
    y: number;
    connections: Dir[];
    canRotate?: boolean;
    isGoalNode?: boolean;
  }>,
  goalNodes: Array<{ x: number; y: number }>
): Level {
  return {
    id,
    name,
    world,
    gridSize: 5,
    tiles: buildMirrorLevel(5, leftTiles),
    goalNodes,
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
  };
}

function level7x7(
  id: number,
  name: string,
  world: number,
  maxMoves: number,
  leftTiles: Array<{
    x: number;
    y: number;
    connections: Dir[];
    canRotate?: boolean;
    isGoalNode?: boolean;
  }>,
  goalNodes: Array<{ x: number; y: number }>
): Level {
  return {
    id,
    name,
    world,
    gridSize: 7,
    tiles: buildMirrorLevel(7, leftTiles),
    goalNodes,
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
  };
}

export const MIRROR_LEVELS: Level[] = [
  // ── World 1: Reflection (5×5) ─────────────────────────────────────────────

  level5x5(
    701,
    'First Reflection',
    1,
    10,
    [
      { x: 0, y: 2, connections: ['right'], isGoalNode: true },
      { x: 1, y: 2, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 2 },
      { x: 4, y: 2 },
    ]
  ),

  level5x5(
    702,
    'Double Path',
    1,
    12,
    [
      { x: 0, y: 1, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 1, connections: ['left', 'down'] },
      { x: 0, y: 2, connections: ['up', 'right'] },
      { x: 1, y: 2, connections: ['up', 'left', 'right'] },
    ],
    [
      { x: 0, y: 1 },
      { x: 4, y: 1 },
    ]
  ),

  level5x5(
    703,
    'Cross Roads',
    1,
    14,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'right'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['left', 'right'] },
      { x: 0, y: 3, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 3, connections: ['left', 'right'] },
      { x: 0, y: 4, connections: ['up', 'right'] },
      { x: 1, y: 4, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
      { x: 4, y: 3 },
    ]
  ),

  level5x5(
    704,
    'Zigzag',
    1,
    16,
    [
      { x: 0, y: 0, connections: ['right'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'down'] },
      { x: 0, y: 1, connections: ['right', 'down'] },
      { x: 1, y: 1, connections: ['up', 'left', 'right'] },
      { x: 0, y: 2, connections: ['up', 'right'] },
      { x: 1, y: 2, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ]
  ),

  level5x5(
    705,
    'The Y',
    1,
    18,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'right'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['left', 'right'] },
      { x: 0, y: 3, connections: ['right'], isGoalNode: true },
      { x: 1, y: 3, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
      { x: 4, y: 3 },
    ]
  ),

  // ── World 2: Symmetry (7×7) ───────────────────────────────────────────────

  level7x7(
    711,
    'Wide Mirror',
    2,
    18,
    [
      { x: 0, y: 3, connections: ['right'], isGoalNode: true },
      { x: 1, y: 3, connections: ['left', 'right'] },
      { x: 2, y: 3, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 3 },
      { x: 6, y: 3 },
    ]
  ),

  level7x7(
    712,
    'Twin Peaks',
    2,
    22,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'down'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['up', 'left', 'right'] },
      { x: 2, y: 1, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
    ]
  ),

  level7x7(
    713,
    'Four Corners',
    2,
    26,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'right'] },
      { x: 2, y: 0, connections: ['left', 'right'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['left', 'down'] },
      { x: 0, y: 4, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 4, connections: ['left', 'right'] },
      { x: 2, y: 4, connections: ['left', 'right'] },
      { x: 0, y: 5, connections: ['up', 'right'] },
      { x: 1, y: 5, connections: ['left', 'right'] },
      { x: 2, y: 5, connections: ['left', 'right'] },
      { x: 0, y: 6, connections: ['up'] },
      { x: 1, y: 6, connections: ['left', 'right'] },
      { x: 2, y: 6, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 4 },
      { x: 6, y: 4 },
    ]
  ),

  level7x7(
    714,
    'Spiral Arms',
    2,
    30,
    [
      { x: 0, y: 0, connections: ['down'], isGoalNode: true },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['left', 'down'] },
      { x: 1, y: 2, connections: ['up', 'right'] },
      { x: 2, y: 2, connections: ['left', 'right'] },
      { x: 0, y: 3, connections: ['right'] },
      { x: 1, y: 3, connections: ['left', 'right'] },
      { x: 2, y: 3, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
    ]
  ),

  level7x7(
    715,
    'Bridge Over',
    2,
    32,
    [
      { x: 0, y: 2, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 2, connections: ['left', 'right'] },
      { x: 2, y: 2, connections: ['left', 'right'] },
      { x: 0, y: 3, connections: ['up', 'down'] },
      { x: 0, y: 4, connections: ['up', 'right'] },
      { x: 1, y: 4, connections: ['left', 'right'] },
      { x: 2, y: 4, connections: ['left', 'right'] },
      { x: 0, y: 6, connections: ['right'], isGoalNode: true },
      { x: 1, y: 6, connections: ['left', 'right'] },
      { x: 2, y: 6, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 2 },
      { x: 6, y: 2 },
      { x: 0, y: 6 },
      { x: 6, y: 6 },
    ]
  ),

  // ── World 3: Fracture (7×7, harder scrambles) ────────────────────────────

  level7x7(
    721,
    'Broken Glass',
    3,
    28,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'down'] },
      { x: 2, y: 0, connections: ['right', 'down'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['up', 'left', 'right'] },
      { x: 2, y: 1, connections: ['up', 'left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
    ]
  ),

  level7x7(
    722,
    'Crystal Maze',
    3,
    32,
    [
      { x: 0, y: 1, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 1, connections: ['left', 'right'] },
      { x: 2, y: 1, connections: ['left', 'right'] },
      { x: 0, y: 2, connections: ['up', 'down'] },
      { x: 0, y: 3, connections: ['up', 'right'] },
      { x: 1, y: 3, connections: ['left', 'down'] },
      { x: 1, y: 4, connections: ['up', 'right'] },
      { x: 2, y: 4, connections: ['left', 'right'] },
      { x: 0, y: 5, connections: ['right'], isGoalNode: true },
      { x: 1, y: 5, connections: ['left', 'right'] },
      { x: 2, y: 5, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 1 },
      { x: 6, y: 1 },
      { x: 0, y: 5 },
      { x: 6, y: 5 },
    ]
  ),

  level7x7(
    723,
    'Kaleidoscope',
    3,
    36,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'right'] },
      { x: 2, y: 0, connections: ['left', 'down'] },
      { x: 0, y: 1, connections: ['up', 'down'] },
      { x: 2, y: 1, connections: ['up', 'right'] },
      { x: 0, y: 2, connections: ['up', 'right'] },
      { x: 1, y: 2, connections: ['left', 'down'] },
      { x: 1, y: 3, connections: ['up', 'right'] },
      { x: 2, y: 3, connections: ['left', 'right'] },
      { x: 0, y: 4, connections: ['right'], isGoalNode: true },
      { x: 1, y: 4, connections: ['left', 'right'] },
      { x: 2, y: 4, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 4 },
      { x: 6, y: 4 },
    ]
  ),

  level7x7(
    724,
    'Fracture Line',
    3,
    40,
    [
      { x: 0, y: 0, connections: ['down'], isGoalNode: true },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['left', 'right'] },
      { x: 2, y: 1, connections: ['left', 'down'] },
      { x: 2, y: 2, connections: ['up', 'right'] },
      { x: 0, y: 3, connections: ['right'], isGoalNode: true },
      { x: 1, y: 3, connections: ['left', 'down'] },
      { x: 1, y: 4, connections: ['up', 'right'] },
      { x: 2, y: 4, connections: ['left', 'right'] },
      { x: 0, y: 5, connections: ['right'] },
      { x: 1, y: 5, connections: ['left', 'right'] },
      { x: 2, y: 5, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 3 },
      { x: 6, y: 3 },
    ]
  ),

  level7x7(
    725,
    'Perfect Mirror',
    3,
    44,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'down'] },
      { x: 2, y: 0, connections: ['right', 'down'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['up', 'left', 'right'] },
      { x: 2, y: 1, connections: ['up', 'left', 'right'] },
      { x: 0, y: 3, connections: ['right', 'down'] },
      { x: 1, y: 3, connections: ['left', 'right'] },
      { x: 2, y: 3, connections: ['left', 'right'] },
      { x: 0, y: 4, connections: ['up', 'right'] },
      { x: 1, y: 4, connections: ['left', 'down'] },
      { x: 1, y: 5, connections: ['up', 'right'] },
      { x: 2, y: 5, connections: ['left', 'right'] },
      { x: 0, y: 6, connections: ['right'], isGoalNode: true },
      { x: 1, y: 6, connections: ['left', 'right'] },
      { x: 2, y: 6, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 6 },
      { x: 6, y: 6 },
    ]
  ),

  // ── Bonus levels — one per world ──────────────────────────────────────────

  // World 1: Reflection (5×5) — "Echo Chamber"
  // Four nodes at two heights; the symmetric path dips and rises.
  level5x5(
    706,
    'Echo Chamber',
    1,
    20,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'right'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['left', 'right'] },
      { x: 0, y: 3, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 3, connections: ['left', 'down'] },
      { x: 0, y: 4, connections: ['up', 'right'] },
      { x: 1, y: 4, connections: ['up', 'left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
      { x: 4, y: 3 },
    ]
  ),

  // World 2: Symmetry (7×7) — "Hall of Mirrors"
  // Two goal nodes at top corners; path snakes inward then dives down the center.
  level7x7(
    716,
    'Hall of Mirrors',
    2,
    28,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'right'] },
      { x: 2, y: 0, connections: ['left', 'down'] },
      { x: 0, y: 1, connections: ['up', 'right'] },
      { x: 1, y: 1, connections: ['left', 'right'] },
      { x: 2, y: 1, connections: ['left', 'right'] },
      // Center column spine (x=3) stays default — player bridges it
      { x: 2, y: 2, connections: ['right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
    ]
  ),

  // World 3: Fracture (7×7) — "Prism Break"
  // Four nodes; path branches through a T-junction on each side, meeting at center.
  level7x7(
    726,
    'Prism Break',
    3,
    40,
    [
      { x: 0, y: 0, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 0, connections: ['left', 'right'] },
      { x: 2, y: 0, connections: ['left', 'right'] },
      { x: 0, y: 1, connections: ['up', 'down'] },
      { x: 0, y: 2, connections: ['up', 'right'] },
      { x: 1, y: 2, connections: ['left', 'down'] },
      { x: 1, y: 3, connections: ['up', 'right'] },
      { x: 2, y: 3, connections: ['left', 'right'] },
      { x: 0, y: 5, connections: ['right', 'down'], isGoalNode: true },
      { x: 1, y: 5, connections: ['left', 'right'] },
      { x: 2, y: 5, connections: ['left', 'right'] },
      { x: 0, y: 6, connections: ['up', 'right'] },
      { x: 1, y: 6, connections: ['left', 'right'] },
      { x: 2, y: 6, connections: ['left', 'right'] },
    ],
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 5 },
      { x: 6, y: 5 },
    ]
  ),
];
