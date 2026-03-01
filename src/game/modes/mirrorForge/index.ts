// MIRROR FORGE MODE — Symmetric Pipe Puzzle
//
// ── Concept ───────────────────────────────────────────────────────────────────
//   The grid is divided into LEFT / CENTER / RIGHT halves.
//   Every tile on the left has an exact mirror twin on the right.
//   Tapping a LEFT tile rotates it AND rotates its RIGHT twin (mirrored).
//   Tapping a RIGHT tile also updates its LEFT twin symmetrically.
//   The CENTER column rotates freely — it's the bridge between the two halves.
//
//   Goal: connect all goal nodes using the pipe connection system.
//   (Same win condition as Classic mode — BFS connectivity check.)
//
// ── Why it's unique ──────────────────────────────────────────────────────────
//   Every rotation affects TWO tiles simultaneously. You must think in
//   pairs — fixing the left could break the right, or solve both at once.
//   Planning is the key: the mirror is your ally and your nemesis.

import { GameModeConfig, TapResult, WinResult } from '../types';
import { Tile } from '../../types';
import {
  MIRROR_LEVELS,
  MIRROR_WORLDS,
  MirrorTileData,
  rotateDirs,
  mirrorConnections,
} from './levels';
import { MIRROR_TUTORIAL_STEPS } from './tutorial';
import { renderMirrorForgeDemo } from './demo';
import { MIRROR_FORGE_WALKTHROUGH } from './walkthrough';
import { checkConnected } from '../utils';

// ── Rotate one tile's connections by 1 step CW ───────────────────────────────
type Dir = 'up' | 'right' | 'down' | 'left';

function rotateTile(tile: Tile): Tile {
  const rotated = rotateDirs(tile.connections as Dir[]);
  return { ...tile, connections: rotated, justRotated: true };
}

// ── Mode Config ───────────────────────────────────────────────────────────────
export const MirrorForgeMode: GameModeConfig = {
  id: 'mirrorForge',
  name: 'Mirror Forge',
  description: 'Tap once, both sides rotate! Connect pipes using perfect symmetry.',
  icon: '🪞',
  color: '#a78bfa',

  wallCompression: 'never',
  supportsUndo: true, // undo is meaningful here — moves are reversible
  useMoveLimit: true,
  supportsWorkshop: false,

  getLevels: () => MIRROR_LEVELS,
  worlds: MIRROR_WORLDS,

  overlayText: { win: 'FORGED!', loss: 'SHATTERED' },
  statsDisplay: [{ type: 'moves' }],

  // ── No custom tile renderer — uses default pipe system ───────────────────
  // The mirror mechanic is entirely in onTileTap. Tiles look like classic pipes
  // but move in pairs. This makes the "aha!" moment stronger — it looks normal
  // but behaves strangely.
  //
  // We do add subtle visual tinting to indicate left/right/center sides.
  tileRenderer: {
    type: 'mirror',
    hidePipes: false, // Keep pipes visible — this IS a pipe mode

    getColors(tile, ctx) {
      const d = tile.displayData as MirrorTileData;
      const side = d?.side ?? 'center';

      // Goal nodes get the accent pulse
      if (tile.isGoalNode) {
        return ctx.inDanger
          ? {
              background: 'linear-gradient(145deg, #1a0505, #0d0010)',
              border: '2px solid #ef4444',
              boxShadow: '0 0 16px #ef444488',
            }
          : {
              background: 'linear-gradient(145deg, #1a0a2e, #0d0618)',
              border: '2px solid #a78bfa',
              boxShadow: '0 0 12px #a78bfa66',
            };
      }

      // Subtle side tinting
      if (side === 'left') {
        return ctx.justRotated
          ? {
              background: 'linear-gradient(145deg, #2a1a4e, #0d0616)',
              border: '1px solid #a78bfa88',
              boxShadow: '0 0 10px #a78bfa44',
            }
          : {
              background: 'linear-gradient(145deg, #0d0a1a, #08060f)',
              border: '1px solid #a78bfa22',
              boxShadow: undefined,
            };
      }

      if (side === 'right') {
        return ctx.justRotated
          ? {
              background: 'linear-gradient(145deg, #1a2e1a, #060f08)',
              border: '1px solid #34d39988',
              boxShadow: '0 0 10px #34d39944',
            }
          : {
              background: 'linear-gradient(145deg, #0a0d0a, #060f08)',
              border: '1px solid #34d39922',
              boxShadow: undefined,
            };
      }

      // Center column — golden accent
      return ctx.justRotated
        ? {
            background: 'linear-gradient(145deg, #2e2a00, #1a1600)',
            border: '1px solid #fbbf2488',
            boxShadow: '0 0 10px #fbbf2444',
          }
        : {
            background: 'linear-gradient(145deg, #0f0e06, #080806)',
            border: '1px solid #fbbf2433',
            boxShadow: undefined,
          };
    },
  },

  // ── Mirror tap logic ──────────────────────────────────────────────────────
  onTileTap(x, y, tiles): TapResult | null {
    const tapped = tiles.find((t) => t.x === x && t.y === y);
    if (!tapped?.canRotate) return null;

    const d = tapped.displayData as MirrorTileData;
    if (!d) return null;

    const side = d.side;

    if (side === 'center') {
      // Center rotates alone
      const newTiles = tiles.map((t) => (t.x === x && t.y === y ? rotateTile(t) : t));
      return { tiles: newTiles, valid: true };
    }

    // Left or right — rotate this tile AND find its mirror twin
    const mirrorX = d.mirrorX;
    const mirrorTile = tiles.find((t) => t.x === mirrorX && t.y === y);

    if (!mirrorTile?.canRotate) {
      // No mirror (shouldn't happen), just rotate solo
      const newTiles = tiles.map((t) => (t.x === x && t.y === y ? rotateTile(t) : t));
      return { tiles: newTiles, valid: true };
    }

    // Rotate both tiles:
    // - Tapped tile rotates normally (CW)
    // - Mirror tile rotates in the OPPOSITE direction (CCW = 3 CW steps)
    //   to maintain true mirror symmetry
    const rotatedTapped = rotateTile(tapped);

    // Mirror rotation: connections must remain the horizontal mirror of the tapped tile
    // We derive the mirror's new connections from the tapped tile's new connections
    const mirroredConnections = mirrorConnections(rotatedTapped.connections as Dir[]);
    const rotatedMirror: Tile = {
      ...mirrorTile,
      connections: mirroredConnections,
      justRotated: true,
    };

    const newTiles = tiles.map((t) => {
      if (t.x === x && t.y === y) return rotatedTapped;
      if (t.x === mirrorX && t.y === y) return rotatedMirror;
      return t;
    });

    return { tiles: newTiles, valid: true };
  },

  // ── Win: all goal nodes connected (same as Classic) ───────────────────────
  checkWin(tiles, goalNodes): WinResult {
    const won = checkConnected(tiles, goalNodes);
    return { won };
  },

  // ── Hint: show tiles adjacent to goal nodes with mismatched connections ───
  getHintTiles(tiles, goalNodes): Set<string> {
    const hints = new Set<string>();
    // Show all rotatable tiles adjacent to unconnected goal nodes
    for (const gn of goalNodes) {
      const gnTile = tiles.find((t) => t.x === gn.x && t.y === gn.y);
      if (!gnTile) continue;
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ] as [number, number][]) {
        const nb = tiles.find((t) => t.x === gn.x + dx && t.y === gn.y + dy);
        if (nb?.canRotate) hints.add(`${nb.x},${nb.y}`);
      }
    }
    return hints;
  },

  // ── Notification ──────────────────────────────────────────────────────────
  getNotification(_tiles, moves, _modeState) {
    if (moves === 1) return '🪞 Both sides rotate together!';
    return null;
  },

  tutorialSteps: MIRROR_TUTORIAL_STEPS,
  renderDemo: renderMirrorForgeDemo,
  walkthrough: MIRROR_FORGE_WALKTHROUGH,
};
