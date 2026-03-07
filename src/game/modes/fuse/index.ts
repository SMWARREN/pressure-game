// FUSE MODE
//
// Two-phase puzzle: PLANT then DETONATE.
//
// Phase 1 — Plant: tap regular tiles to arm them (💣). You have a limited
//   number of moves (arms). Tap the detonator (⚡) to begin detonation.
//
// Phase 2 — Detonate: the explosion auto-propagates via onTick, one step
//   per second through adjacently-armed tiles. Watch your chain cascade!
//   Relay tiles (🎯) conduct automatically — they don't need to be armed.
//   Blocker tiles (◼) stop the explosion cold.
//
// Win: explosion reaches ALL relay (🎯) tiles.
// Loss: chain fizzles out before hitting all relays.
//
// Engine exploitation:
// - onTick drives the entire detonation sequence (no tapping in phase 2)
// - checkWin checks tile.displayData.exploded on each relay after every tick
//   (enabled by the engine patch in engine/index.ts that calls checkWin post-tick)
// - modeState.frontier / .exploded track wave propagation between ticks
// - canRotate:false on relay/blocker tiles means only regular tiles + detonator are tappable

import { GameModeConfig, TapResult, WinResult, TileRenderContext, TileColors } from '../types';
import { Tile, GameState } from '../../types';
import { isEmpty } from '@/utils/conditionalStyles';
import { FUSE_LEVELS, FUSE_WORLDS } from './levels';
import { FUSE_TUTORIAL_STEPS } from './tutorial';
import { renderFuseDemo } from './demo';
import { FUSE_WALKTHROUGH } from './walkthrough';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FuseState extends Record<string, unknown> {
  detonating: boolean;
  frontier: string[];
  exploded: string[];
  tick: number;
}

// ── Tile visuals ──────────────────────────────────────────────────────────────

// Lookup table for fuse tile colors by kind (reduces cognitive complexity vs switch statements)
const FUSE_KIND_COLORS = {
  detonator: {
    background: 'linear-gradient(145deg,#1c1f00,#2d2f00)',
    border: '2px solid #facc15',
    boxShadow: '0 0 14px rgba(250,204,21,0.6)',
  },
  relay: {
    background: 'linear-gradient(145deg,#0f1f3d,#0a1529)',
    border: '2px solid #60a5fa',
    boxShadow: '0 0 12px rgba(96,165,250,0.5)',
  },
  blocker: {
    background: '#111118',
    border: '2px solid #374151',
    boxShadow: 'none',
  },
} satisfies Record<string, any>;

// Static color definitions
const FUSE_COLORS_BY_STATE = {
  exploded: {
    background: 'linear-gradient(145deg,#3d1f00,#2d1500)',
    border: '2px solid #fb923c',
    boxShadow: '0 0 20px rgba(251,146,60,0.8)',
  },
  armed: {
    background: 'linear-gradient(145deg,#2d0a00,#3d0f00)',
    border: '2px solid #ef4444',
    boxShadow: '0 0 10px rgba(239,68,68,0.55)',
  },
  unarmed: {
    background: 'rgba(15,15,25,0.4)',
    border: '1px solid #1e293b',
    boxShadow: 'none',
  },
} satisfies Record<string, any>;

// Lookup table for fuse tile symbols
const FUSE_KIND_SYMBOLS = {
  detonator: '⚡',
  relay: '🎯',
  blocker: '◼',
} satisfies Record<string, string>;

function fuseColors(tile: Tile, _ctx?: TileRenderContext): TileColors {
  const kind = tile.displayData?.kind as string;
  const armed = tile.displayData?.armed as boolean;
  const exploded = tile.displayData?.exploded as boolean;

  if (exploded) return FUSE_COLORS_BY_STATE.exploded;

  const kindColor = FUSE_KIND_COLORS[kind as keyof typeof FUSE_KIND_COLORS];
  if (kindColor) return kindColor;

  // Default: regular tile
  return armed ? FUSE_COLORS_BY_STATE.armed : FUSE_COLORS_BY_STATE.unarmed;
}

function fuseSymbol(tile: Tile): string | null {
  const kind = tile.displayData?.kind as string;
  const armed = tile.displayData?.armed as boolean;
  const exploded = tile.displayData?.exploded as boolean;

  if (exploded) return '💥';
  if (kind in FUSE_KIND_SYMBOLS) return FUSE_KIND_SYMBOLS[kind as keyof typeof FUSE_KIND_SYMBOLS];
  // Default: regular tile
  return armed ? '💣' : null;
}

// ── Chain propagation helpers ─────────────────────────────────────────────────

const DIRS4: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

function conducts(tile: Tile): boolean {
  const kind = tile.displayData?.kind as string;
  return (
    kind === 'relay' ||
    kind === 'detonator' ||
    (kind === 'regular' && (tile.displayData?.armed as boolean) === true)
  );
}

// ── onTick helper (frontier expansion logic) ──────────────────────────────────

function expandFrontier(
  frontier: string[],
  exploded: Set<string>,
  tiles: Tile[],
  gridSize: number
): { nextFrontier: string[]; newExploded: Set<string> } {
  const nextFrontier: string[] = [];
  const newExploded = new Set(exploded);

  for (const key of frontier) {
    const [kx, ky] = key.split(',').map(Number);
    for (const [dx, dy] of DIRS4) {
      const nx = kx + dx;
      const ny = ky + dy;
      if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
      const nk = `${nx},${ny}`;
      if (newExploded.has(nk)) continue;
      const neighbor = tiles.find((t) => t.x === nx && t.y === ny);
      if (!neighbor || !conducts(neighbor)) continue;
      nextFrontier.push(nk);
      newExploded.add(nk);
    }
  }

  return { nextFrontier, newExploded };
}

// ── Mode config ───────────────────────────────────────────────────────────────

export const FuseMode: GameModeConfig = {
  id: 'fuse',
  name: 'Fuse',
  description: 'Arm tiles to route an explosion to every relay. Then detonate.',
  icon: '💣',
  color: '#f97316',
  wallCompression: 'never',
  supportsUndo: true,
  useMoveLimit: true,
  tutorialSteps: FUSE_TUTORIAL_STEPS,
  renderDemo: renderFuseDemo,
  walkthrough: FUSE_WALKTHROUGH,
  getLevels: () => FUSE_LEVELS,
  worlds: FUSE_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'CHAIN COMPLETE!', loss: 'CHAIN FIZZLED' },

  tileRenderer: {
    type: 'fuse',
    hidePipes: true,
    symbolSize: '1.2rem',
    getColors: fuseColors,
    getSymbol: fuseSymbol,
  },

  initialState() {
    return { detonating: false, frontier: [], exploded: [], tick: 0 } satisfies FuseState;
  },

  onTileTap(x, y, tiles, _gridSize, modeState): TapResult | null {
    const ms = (modeState ?? {}) as FuseState;
    if (ms.detonating) return null; // chain in progress, no interaction

    const tile = tiles.find((t) => t.x === x && t.y === y);
    if (!tile) return null;

    const kind = tile.displayData?.kind as string;

    // Tap the detonator → start chain
    if (kind === 'detonator') {
      const key = `${x},${y}`;
      const newTiles = tiles.map((t) =>
        t.x === x && t.y === y ? { ...t, displayData: { ...t.displayData, exploded: true } } : t
      );
      return {
        tiles: newTiles,
        valid: true,
        customState: {
          ...ms,
          detonating: true,
          frontier: [key],
          exploded: [key],
        } satisfies FuseState,
      };
    }

    // Tap a regular tile → toggle armed
    if (kind === 'regular') {
      const armed = (tile.displayData?.armed as boolean) ?? false;
      const newTiles = tiles.map((t) =>
        t.x === x && t.y === y
          ? { ...t, justRotated: true, displayData: { ...t.displayData, armed: !armed } }
          : t
      );
      return {
        tiles: newTiles,
        valid: true,
        customState: { ...ms } satisfies FuseState,
      };
    }

    return null; // relay, blocker — not interactive
  },

  // ── Frontier expansion helper ────────────────────────────────────────────
  onTick(state: GameState): Partial<GameState> | null {
    const ms = state.modeState as FuseState | undefined;
    if (!ms?.detonating) return null;

    const frontier = ms.frontier ?? [];
    if (isEmpty(frontier)) return null;

    const explodedArr = ms.exploded ?? [];
    const tiles = state.tiles;
    const gridSize = state.currentLevel?.gridSize ?? 5;
    const tick = (ms.tick ?? 0) + 1;

    // Expand frontier
    const { nextFrontier, newExploded } = expandFrontier(
      frontier,
      new Set(explodedArr),
      tiles,
      gridSize
    );

    const nextFrontierSet = new Set(nextFrontier);
    const newTiles = tiles.map((t) => {
      if (nextFrontierSet.has(`${t.x},${t.y}`)) {
        return { ...t, displayData: { ...t.displayData, exploded: true, armed: false } };
      }
      return t;
    });

    const newMs: FuseState = { ...ms, tick, frontier: nextFrontier, exploded: [...newExploded] };

    if (isEmpty(nextFrontier)) {
      const goalNodes = state.currentLevel?.goalNodes ?? [];
      const allReached = goalNodes.every((g) => newExploded.has(`${g.x},${g.y}`));
      if (!allReached) {
        return {
          tiles: newTiles,
          modeState: { ...newMs, detonating: false },
          status: 'lost' as const,
          lossReason: '💣 Chain fizzled!',
        };
      }
    }

    return { tiles: newTiles, modeState: newMs };
  },

  checkWin(tiles, goalNodes): WinResult {
    if (isEmpty(goalNodes)) return { won: false };
    const allReached = goalNodes.every((g) => {
      const tile = tiles.find((t) => t.x === g.x && t.y === g.y);
      return tile?.displayData?.exploded === true;
    });
    return { won: allReached, reason: allReached ? 'All relays triggered!' : undefined };
  },

  checkLoss(_tiles, _wallOffset, moves, maxMoves, modeState): { lost: boolean; reason?: string } {
    const ms = modeState as FuseState | undefined;
    if (ms?.detonating) return { lost: false }; // loss handled by onTick
    if (moves >= maxMoves) {
      return { lost: true, reason: 'Out of fuses!' };
    }
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    return new Set(tiles.filter((t) => t.displayData?.exploded).map((t) => `${t.x},${t.y}`));
  },

  getHintTiles(tiles, _goalNodes, modeState): Set<string> {
    const ms = modeState as FuseState | undefined;
    if (ms?.detonating) return new Set();
    // Hint: show relay tiles that haven't been connected yet
    const armed = new Set(tiles.filter((t) => t.displayData?.armed).map((t) => `${t.x},${t.y}`));
    const hints = new Set<string>();
    tiles.forEach((t) => {
      if (t.isGoalNode) hints.add(`${t.x},${t.y}`);
      if (t.displayData?.kind === 'detonator') hints.add(`${t.x},${t.y}`);
    });
    armed.forEach((k) => hints.add(k));
    return hints;
  },

  getNotification(_tiles, moves, modeState) {
    const ms = modeState as FuseState | undefined;
    if (ms?.detonating) return '💥 CHAIN REACTION!';
    if (moves === 0) return '💣 Tap tiles to arm them';
    return null;
  },

  statsLabels: { moves: 'FUSES' },
  statsDisplay: [{ type: 'moves' }],
};
