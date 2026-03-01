// FUSE MODE — Level Definitions
// Plant explosives on tiles, then detonate the chain reaction.
// The explosion auto-propagates via onTick — watch it cascade!

import { Level, Tile } from '../../types';

export const FUSE_WORLDS = [
  { id: 1, name: 'Powder Keg', tagline: 'Learn the chain mechanic', color: '#f97316', icon: '💣' },
  {
    id: 2,
    name: 'Demolition',
    tagline: 'Route explosions around blockers',
    color: '#ef4444',
    icon: '🧨',
  },
  {
    id: 3,
    name: 'Warhead',
    tagline: 'Precision blast paths required',
    color: '#dc2626',
    icon: '💥',
  },
];

// ── Level builder ─────────────────────────────────────────────────────────────
// Grid chars:
// . = regular tile (can be armed by tapping)
// # = blocker (cannot conduct explosion, cannot be armed)
// E = detonator (⚡ — tap to start chain)
// R = relay / goal (🎯 — must be reached, conducts automatically)

function buildFuseLevel(
  id: number,
  name: string,
  world: number,
  maxMoves: number,
  rows: string[]
): Level {
  const gridSize = rows.length;
  const tiles: Tile[] = [];
  const goalNodes: { x: number; y: number }[] = [];

  for (let y = 0; y < gridSize; y++) {
    const chars = rows[y].split(' ');
    for (let x = 0; x < gridSize; x++) {
      const ch = chars[x] ?? '.';
      let kind = 'regular';
      let canRotate = true;
      let isGoalNode = false;

      switch (ch) {
        case '#':
          kind = 'blocker';
          canRotate = false;
          break;
        case 'E':
          kind = 'detonator';
          break;
        case 'R':
          kind = 'relay';
          canRotate = false;
          isGoalNode = true;
          break;
        default:
          // kind = 'regular' (already default)
          // canRotate = true (already default)
      }

      if (isGoalNode) goalNodes.push({ x, y });

      tiles.push({
        id: `fuse${id}-${x}-${y}`,
        type: 'path' as const,
        x,
        y,
        connections: [],
        canRotate,
        isGoalNode,
        displayData: {
          kind,
          armed: false,
          exploded: false,
        },
      });
    }
  }

  return {
    id,
    name,
    world,
    gridSize,
    tiles,
    goalNodes,
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
  };
}

// ── Level catalog ─────────────────────────────────────────────────────────────
// Strategy: arm tiles to form a connected path from E to all R relays.
// Minimum path length = minimum arms needed. maxMoves gives some breathing room.
// Blockers (#) force specific routing around obstacles.

export const FUSE_LEVELS: Level[] = [
  // World 1: Powder Keg — straight paths, learn the mechanic
  // 1001: Straight line. Arm 3 tiles between detonator and relay.
  buildFuseLevel(1001, 'The Fuse', 1, 6, [
    '. . . . .',
    '. . . . .',
    'E . . . R',
    '. . . . .',
    '. . . . .',
  ]),

  // 1002: L-bend required.
  buildFuseLevel(1002, 'Corner Charge', 1, 8, [
    'R . . . .',
    '. . . . .',
    '. . . . .',
    '. . . . .',
    '. . . . E',
  ]),

  // 1003: Two relays. Fork the explosion.
  buildFuseLevel(1003, 'Split Trigger', 1, 12, [
    'R . . . .',
    '. . . . .',
    '. . E . .',
    '. . . . .',
    '. . . . R',
  ]),

  // 1004: Relay in a dead-end alcove. Route around it carefully.
  buildFuseLevel(1004, 'Alcove', 1, 10, [
    '. . . # R',
    '. . . # .',
    'E . . # .',
    '. . . . .',
    '. . . . .',
  ]),

  // World 2: Demolition — blockers everywhere, need creative routing
  // 1005: Wall down the middle, must route around top or bottom.
  buildFuseLevel(1005, 'The Wall', 2, 12, [
    '. . # . .',
    '. . # . .',
    'E . # . R',
    '. . # . .',
    '. . . . .',
  ]),

  // 1006: Maze of blockers. One valid path exists.
  buildFuseLevel(1006, 'Labyrinth Blast', 2, 14, [
    'E . # . R',
    '. # . # .',
    '. . . . .',
    '. # . # .',
    '. . # . .',
  ]),

  // 1007: Two relays, need to fork around a blocker ring.
  buildFuseLevel(1007, 'Ring of Fire', 2, 16, [
    '. . R . .',
    '. # # # .',
    '. # E # .',
    '. # # # .',
    '. . R . .',
  ]),

  // 1008: Three relays in a 6×6.
  buildFuseLevel(1008, 'Triple Target', 2, 18, [
    'R . . # . R',
    '. . . # . .',
    '. . . . . .',
    '. . . . . .',
    '. # . . . .',
    '. . . E . R',
  ]),

  // World 3: Warhead — 7×7, tight move budgets, precision required
  // 1009: Minimal path only — can't waste any moves.
  buildFuseLevel(1009, 'Thin Ice', 3, 10, [
    'R # # # # # .',
    '. # . . . # .',
    '. # . # . # .',
    '. # . # . # E',
    '. # . # . . .',
    '. # . # # # .',
    '. . . . . . .',
  ]),

  // 1010: Four relays in corners, detonator center.
  buildFuseLevel(1010, 'Cross Fire', 3, 24, [
    'R . . . . . R',
    '. . # . # . .',
    '. # . . . # .',
    '. . . E . . .',
    '. # . . . # .',
    '. . # . # . .',
    'R . . . . . R',
  ]),

  // 1011: Very tight budget — exactly enough moves for minimum path.
  buildFuseLevel(1011, 'Hairline', 3, 13, [
    'R # . # . # R',
    '. # . # . # .',
    '. . . . . . .',
    '# # # E # # #',
    '. . . . . . .',
    '. # . # . # .',
    '. # . # . # .',
  ]),
];
