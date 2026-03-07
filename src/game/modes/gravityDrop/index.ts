// GRAVITY DROP MODE — Number Chain Puzzle with Falling Tiles
//
// ── Concept ───────────────────────────────────────────────────────────────────
//   Numbered tiles (1–6) occupy the grid. Tap adjacent tiles to build a chain
//   that sums to exactly 10. Double-tap the last tile in the chain to COMMIT —
//   all chained tiles clear, gravity pulls survivors down, new tiles drop from
//   the top. Run out of moves or let the board overflow = loss.
//
// ── Controls ─────────────────────────────────────────────────────────────────
//   • Tap any tile  → start chain (or extend if it's adjacent to chain tail)
//   • Tap chain tail again → COMMIT the chain (only if sum === 10)
//   • Tap a non-adjacent tile → cancel chain and start fresh
//
// ── Scoring ──────────────────────────────────────────────────────────────────
//   Clearing n tiles = n² × 10 pts  (longer chain = exponentially more)
//   ⭐ Star bonus: +50 pts per star used in a chain
//   💣 Bomb clear: +100 pts per column tile cleared

import { GameModeConfig, TapResult, WinResult, LossResult, TileRenderContext, TileColors } from '../types';
import { Tile } from '../../types';
import {
  GRAVITY_LEVELS,
  GRAVITY_WORLDS,
  GRAVITY_TARGET,
  GravityTileData,
  makeNumberTile,
} from './levels';
import { isEmpty } from '@/utils/conditionalStyles';
import { seededRandom } from '../seedUtils';
import { GRAVITY_TUTORIAL_STEPS } from './tutorial';
import { renderGravityDropDemo } from './demo';
import { GRAVITY_DROP_WALKTHROUGH } from './walkthrough';

// ── Colours per number value (theme-aware) ───────────────────────────────────
const VAL_COLORS_DARK: Record<number, { bg: string; border: string; glow: string }> = {
  1: { bg: '#0c1a2e', border: '#38bdf8', glow: '#38bdf888' },
  2: { bg: '#1a0c2e', border: '#818cf8', glow: '#818cf888' },
  3: { bg: '#2e0c1a', border: '#f472b6', glow: '#f472b688' },
  4: { bg: '#1a2e0c', border: '#4ade80', glow: '#4ade8088' },
  5: { bg: '#2e1a0c', border: '#fb923c', glow: '#fb923c88' },
  6: { bg: '#2e2e0c', border: '#fbbf24', glow: '#fbbf2488' },
};

const VAL_COLORS_LIGHT: Record<number, { bg: string; border: string; glow: string }> = {
  1: { bg: '#dbeafe', border: '#0284c7', glow: '#0284c744' },
  2: { bg: '#ede9fe', border: '#6366f1', glow: '#6366f144' },
  3: { bg: '#fbcfe8', border: '#be185d', glow: '#be185d44' },
  4: { bg: '#dcfce7', border: '#16a34a', glow: '#16a34a44' },
  5: { bg: '#fed7aa', border: '#d97706', glow: '#d97706 44' },
  6: { bg: '#fef3c7', border: '#ca8a04', glow: '#ca8a0444' },
};

function getValColors(
  theme: 'light' | 'dark'
): Record<number, { bg: string; border: string; glow: string }> {
  return theme === 'light' ? VAL_COLORS_LIGHT : VAL_COLORS_DARK;
}

const NUM_SYMBOLS = ['①', '②', '③', '④', '⑤', '⑥'];

// ── Mode state ────────────────────────────────────────────────────────────────
interface GravityModeState extends Record<string, unknown> {
  chain: Array<{ x: number; y: number; value: number; special: string }>;
  chainSum: number;
}

function emptyState(): GravityModeState {
  return { chain: [], chainSum: 0 };
}

function getData(tile: Tile): GravityTileData {
  return tile.displayData as GravityTileData;
}

function isAdjacent(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

// ── Gravity + refill ──────────────────────────────────────────────────────────
function applyGravity(tiles: Tile[], gridSize: number, seed: number): Tile[] {
  const rng = seededRandom(seed + Math.floor(Date.now() / 1000));
  const result: Tile[] = [];

  for (let col = 0; col < gridSize; col++) {
    const survivors = tiles.filter((t) => t.x === col && t.canRotate).sort((a, b) => b.y - a.y); // bottom-first

    // Pack to bottom
    survivors.forEach((t, i) => {
      result.push({
        ...t,
        y: gridSize - 1 - i,
        displayData: { ...t.displayData, isNew: false, inChain: false },
      });
    });

    // Fill from top
    const fillCount = gridSize - survivors.length;
    for (let row = 0; row < fillCount; row++) {
      const r = rng();
      let special: GravityTileData['special'] = 'none';
      if (r < 0.04) special = 'bomb';
      else if (r < 0.08) special = 'star';
      const value = special !== 'none' ? 0 : Math.floor(rng() * 6) + 1;
      result.push(makeNumberTile(col, row, value, true, special));
    }
  }

  return result;
}

// Check if board is overflowing (any tile at y=0)
function isOverflowing(tiles: Tile[], gridSize: number): boolean {
  // Only trigger overflow if the ENTIRE top row is filled
  const topRow = tiles.filter((t) => t.y === 0 && t.canRotate);
  return topRow.length >= gridSize;
}

// ── Commit chain: clear tiles + bomb column nuke + gravity ────────────────────
function commitChain(
  chain: GravityModeState['chain'],
  tiles: Tile[],
  gridSize: number
): { tiles: Tile[]; scoreDelta: number } {
  const chainKeys = new Set(chain.map((c) => `${c.x},${c.y}`));

  // Check for bombs in chain (they nuke their entire column)
  const bombCols = new Set(chain.filter((c) => c.special === 'bomb').map((c) => c.x));

  // Remove chained tiles + bomb-column tiles
  const cleared = tiles.filter((t) => {
    if (chainKeys.has(`${t.x},${t.y}`)) return false;
    if (bombCols.has(t.x)) return false;
    return true;
  });

  // Score: n² × 10 base + star bonus + bomb column bonus
  const chainLen = chain.length;
  const stars = chain.filter((c) => c.special === 'star').length;
  const bombBonus = [...bombCols].reduce((acc, col) => {
    const colTiles = tiles.filter((t) => t.x === col).length;
    return acc + colTiles * 100;
  }, 0);
  const score = chainLen * chainLen * 10 + stars * 50 + bombBonus;

  const newTiles = applyGravity(cleared, gridSize, Date.now());
  return { tiles: newTiles, scoreDelta: score };
}

// ── Update chain display ──────────────────────────────────────────────────────
function markChain(tiles: Tile[], chain: GravityModeState['chain']): Tile[] {
  const chainMap = new Map(
    chain.map((c, i) => [
      `${c.x},${c.y}`,
      {
        index: i,
        sum: chain.slice(0, i + 1).reduce((s, v) => s + (v.special === 'star' ? 0 : v.value), 0),
      },
    ])
  );

  return tiles.map((t) => {
    const info = chainMap.get(`${t.x},${t.y}`);
    const d = getData(t);
    if (!d) return t;
    return {
      ...t,
      displayData: {
        ...d,
        inChain: Boolean(info),
        chainIndex: info?.index ?? -1,
        chainSum: info?.sum ?? 0,
      },
    };
  });
}

// ── Tap handler helpers ─────────────────────────────────────────────────────
function calcChainSum(chain: Array<{ x: number; y: number; value: number; special: string }>): {
  sum: number;
  starCount: number;
  total: number;
} {
  let sum = 0;
  let starCount = 0;
  for (const c of chain) {
    if (c.special === 'star') starCount++;
    else sum += c.value;
  }
  const starFill = starCount > 0 ? GRAVITY_TARGET - sum : 0;
  return { sum, starCount, total: sum + starFill };
}

function handleCommit(
  chain: Array<{ x: number; y: number; value: number; special: string }>,
  tiles: Tile[],
  gridSize: number
): TapResult | null {
  const { total } = calcChainSum(chain);
  const hasBombs = chain.some((c) => c.special === 'bomb');

  if (total !== GRAVITY_TARGET && !hasBombs) {
    return null;
  }

  const { tiles: newTiles, scoreDelta } = commitChain(chain, tiles, gridSize);
  const cleared = markChain(newTiles, []);

  return {
    tiles: cleared,
    valid: true,
    scoreDelta,
    customState: emptyState(),
  };
}

function handleExtend(
  x: number,
  y: number,
  chain: Array<{ x: number; y: number; value: number; special: string }>,
  d: ReturnType<typeof getData>,
  tiles: Tile[]
): TapResult | null {
  if (isEmpty(chain)) {
    const newChain: Array<{ x: number; y: number; value: number; special: string }> = [
      { x, y, value: d.value, special: d.special },
    ];
    return {
      tiles: markChain(tiles, newChain),
      valid: true,
      scoreDelta: 0,
      customState: { chain: newChain, chainSum: d.special !== 'star' ? d.value : 0 },
    };
  }

  const lastInChain = chain[chain.length - 1];

  // Check if adjacent to chain tail
  if (!isAdjacent(lastInChain, { x, y })) {
    const cleared = markChain(tiles, []);
    const newChain: Array<{ x: number; y: number; value: number; special: string }> = [
      { x, y, value: d.value, special: d.special },
    ];
    return {
      tiles: markChain(cleared, newChain),
      valid: true,
      scoreDelta: 0,
      customState: { chain: newChain, chainSum: d.special !== 'star' ? d.value : 0 },
    };
  }

  // Check if already in chain (undo last step)
  const existingIdx = chain.findIndex((c) => c.x === x && c.y === y);
  if (existingIdx >= 0 && existingIdx < chain.length - 1) {
    const truncated = chain.slice(0, existingIdx + 1);
    const newSum = truncated.reduce((s, c) => s + (c.special === 'star' ? 0 : c.value), 0);
    return {
      tiles: markChain(tiles, truncated),
      valid: true,
      scoreDelta: 0,
      customState: { chain: truncated, chainSum: newSum },
    };
  }

  // Normal extend: add new tile to chain
  const newChain = [...chain, { x, y, value: d.value, special: d.special }];
  const { sum, starCount } = calcChainSum(newChain);

  if (sum > GRAVITY_TARGET && starCount === 0) {
    return null;
  }

  const effectiveSum = starCount > 0 ? GRAVITY_TARGET : sum;
  return {
    tiles: markChain(tiles, newChain),
    valid: true,
    scoreDelta: 0,
    customState: { chain: newChain, chainSum: effectiveSum },
  };
}

// Color helpers for getColors (extracted to reduce complexity)
function getEmptyTileColors(ctx: TileRenderContext): TileColors {
  return ctx.theme === 'light'
    ? { background: '#f3f4f6', border: '1px solid #d1d5db' }
    : { background: '#0d0d1a', border: '1px solid #1a1a2e' };
}

function getBombTileColors(d: Record<string, unknown>, ctx: TileRenderContext): TileColors {
  const theme = ctx.theme as 'light' | 'dark';
  const bombStyles = d.inChain
    ? {
        light: {
          background: 'linear-gradient(145deg, #fee2e2, #fecaca)',
          border: '2px solid #dc2626',
          boxShadow: '0 0 18px rgba(220,38,38,0.5)',
        },
        dark: {
          background: 'linear-gradient(145deg, #1a0a0a, #0d0010)',
          border: '2px solid #ef4444',
          boxShadow: '0 0 18px #ef4444aa',
        },
      }
    : {
        light: {
          background: 'linear-gradient(145deg, #fee2e2, #fecaca)',
          border: '1px solid rgba(220,38,38,0.3)',
          boxShadow: undefined,
        },
        dark: {
          background: 'linear-gradient(145deg, #1a0a0a, #0d0010)',
          border: '1px solid #ef444455',
          boxShadow: undefined,
        },
      };
  return bombStyles[theme];
}

function getStarTileColors(d: Record<string, unknown>, ctx: TileRenderContext): TileColors {
  const theme = ctx.theme as 'light' | 'dark';
  const starStyles = d.inChain
    ? {
        light: {
          background: 'linear-gradient(145deg, #fef3c7, #fde047)',
          border: '2px solid #ca8a04',
          boxShadow: '0 0 18px rgba(202,138,4,0.5)',
        },
        dark: {
          background: 'linear-gradient(145deg, #2e2a00, #1a1600)',
          border: '2px solid #fbbf24',
          boxShadow: '0 0 18px #fbbf24aa',
        },
      }
    : {
        light: {
          background: 'linear-gradient(145deg, #fef3c7, #fde047)',
          border: '1px solid rgba(202,138,4,0.3)',
          boxShadow: undefined,
        },
        dark: {
          background: 'linear-gradient(145deg, #2e2a00, #1a1600)',
          border: '1px solid #fbbf2455',
          boxShadow: undefined,
        },
      };
  return starStyles[theme];
}

function getLockTileColors(ctx: TileRenderContext): TileColors {
  return ctx.theme === 'light'
    ? {
        background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
        border: '2px solid #6b7280',
        boxShadow: undefined,
      }
    : {
        background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
        border: '2px solid #4b5563',
        boxShadow: undefined,
      };
}

function getChainTileColors(c: { bg: string; border: string; glow: string }): TileColors {
  return {
    background: `linear-gradient(145deg, ${c.border}33, ${c.bg})`,
    border: `2px solid ${c.border}`,
    boxShadow: `0 0 16px ${c.glow}`,
  };
}

function getHintTileColors(c: { bg: string; border: string; glow: string }, ctx: TileRenderContext): TileColors {
  return {
    background: `linear-gradient(145deg, ${c.bg}, ${ctx.theme === 'light' ? '#f0f0f0' : '#080812'})`,
    border: `2px solid ${c.border}88`,
    boxShadow: `0 0 10px ${c.glow}44`,
  };
}

function getDefaultTileColors(c: { bg: string; border: string; glow: string }, ctx: TileRenderContext): TileColors {
  return {
    background: `linear-gradient(145deg, ${c.bg}, ${ctx.theme === 'light' ? '#f0f0f0' : '#080812'})`,
    border: `1px solid ${c.border}55`,
  };
}

// ── Mode config ───────────────────────────────────────────────────────────────
export const GravityDropMode: GameModeConfig = {
  id: 'gravityDrop',
  name: 'Gravity Drop',
  description: 'Chain adjacent numbers to sum exactly 10 — tiles fall and refill as you clear!',
  icon: '🌊',
  color: '#38bdf8',

  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,
  supportsWorkshop: false,

  getLevels: () => GRAVITY_LEVELS,
  worlds: GRAVITY_WORLDS,

  overlayText: { win: 'CHAIN MASTER!', loss: 'OVERFLOWED!' },
  statsLabels: { moves: 'CHAINS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],

  initialState: () => emptyState(),

  // ── Visual rendering ────────────────────────────────────────────────────────
  tileRenderer: {
    type: 'gravity',
    hidePipes: true,
    symbolSize: '1.3rem',

    getColors(tile, ctx) {
      const d = getData(tile);
      if (!d) return getEmptyTileColors(ctx);

      if (d.special === 'bomb') return getBombTileColors(d, ctx);
      if (d.special === 'star') return getStarTileColors(d, ctx);
      if (d.special === 'lock') return getLockTileColors(ctx);

      const colors = getValColors(ctx.theme);
      const c = colors[d.value] ?? colors[1];
      if (d.inChain) return getChainTileColors(c);
      if (ctx.isHint) return getHintTileColors(c, ctx);
      return getDefaultTileColors(c, ctx);
    },

    getSymbol(tile) {
      const d = getData(tile);
      if (!d) return null;

      if (d.special === 'bomb') return '💣';
      if (d.special === 'star') return '⭐';
      if (d.special === 'lock') return '🔒';

      if (d.inChain && d.chainSum > 0) {
        return `${NUM_SYMBOLS[d.value - 1] ?? d.value}`;
      }

      return NUM_SYMBOLS[d.value - 1] ?? String(d.value);
    },
  },

  // ── Tap logic ────────────────────────────────────────────────────────────────
  onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
    const ms = (modeState as GravityModeState | undefined) ?? emptyState();
    const tapped = tiles.find((t) => t.x === x && t.y === y);
    if (!tapped) return null;

    const d = getData(tapped);
    if (!d || d.special === 'lock') return null;

    const chain = ms.chain;
    const lastInChain = chain[chain.length - 1];

    // Commit: tap last tile again when sum = 10
    if (lastInChain?.x === x && lastInChain.y === y) {
      return handleCommit(chain, tiles, gridSize);
    }

    // Extend chain or start new
    return handleExtend(x, y, chain, d, tiles);
  },

  // ── Win / Loss ────────────────────────────────────────────────────────────
  checkWin(_tiles, _g, _moves, _max, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    return { won: score >= target };
  },

  checkLoss(tiles, _w, moves, maxMoves, modeState): LossResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;

    // Out of moves
    if (moves >= maxMoves && score < target) {
      return { lost: true, reason: 'Out of chains!' };
    }

    // Board overflowed (full top row)
    const gridSize = Math.round(Math.sqrt(tiles.length));
    if (isOverflowing(tiles, gridSize)) {
      return { lost: true, reason: 'Board overflow!' };
    }

    return { lost: false };
  },

  // ── Win tiles ────────────────────────────────────────────────────────────
  getWinTiles(tiles): Set<string> {
    return new Set(tiles.map((t) => `${t.x},${t.y}`));
  },

  // ── Hints: tiles that can extend the current chain ───────────────────────
  getHintTiles(tiles, _g, modeState): Set<string> {
    const ms = modeState as GravityModeState | undefined;
    const chain = ms?.chain ?? [];
    if (isEmpty(chain)) return new Set();

    const last = chain[chain.length - 1];
    const chainKeys = new Set(chain.map((c) => `${c.x},${c.y}`));
    const hints = new Set<string>();

    for (const t of tiles) {
      if (chainKeys.has(`${t.x},${t.y}`)) continue;
      if (!t.canRotate) continue;
      const d = getData(t);
      if (!d) continue;
      if (isAdjacent(last, t)) {
        hints.add(`${t.x},${t.y}`);
      }
    }

    return hints;
  },

  // ── Notifications ─────────────────────────────────────────────────────────

  /**
   * Chain notification tiers by score delta.
   */
  getNotification(_tiles, _moves, modeState) {
    const delta = (modeState?.scoreDelta as number) ?? 0;
    if (delta <= 0) return null;

    const tiers = [
      { minDelta: 1000, emoji: '🌊', text: 'MASSIVE CHAIN!' },
      { minDelta: 500, emoji: '💥', text: 'EPIC!' },
      { minDelta: 200, emoji: '🔥', text: 'GREAT CHAIN!' },
      { minDelta: 100, emoji: '⚡', text: 'Nice!' },
    ];

    for (const tier of tiers) {
      if (delta >= tier.minDelta) return `${tier.emoji} ${tier.text} +${delta}`;
    }
    return null;
  },

  tutorialSteps: GRAVITY_TUTORIAL_STEPS,
  renderDemo: renderGravityDropDemo,
  walkthrough: GRAVITY_DROP_WALKTHROUGH,
};
