// CANDY MODE — Match-3 Group Clear
//
// Tap a connected group of 2+ same-colored candies to clear them.
// Remaining tiles fall (gravity) and new random ones fill from the top.
// Score = n² × 5 per clear (bigger groups = exponentially more points).
// Win: reach targetScore within maxMoves. Loss: moves exhausted without hitting target.
//
// No pipes, no walls — pure match-3 arcade gameplay.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import { CANDY_LEVELS, CANDY_WORLDS, CANDY_SYMBOLS } from './levels';

// ── Group flood-fill ──────────────────────────────────────────────────────────

function buildMap(tiles: Tile[]): Map<string, Tile> {
  const m = new Map<string, Tile>();
  for (const t of tiles) m.set(`${t.x},${t.y}`, t);
  return m;
}

/** Find the full connected group of same-symbol tiles starting at (x, y). */
function findGroup(x: number, y: number, tiles: Tile[]): Tile[] {
  const map = buildMap(tiles);
  const start = map.get(`${x},${y}`);
  if (!start?.canRotate) return [];

  const targetSym = start.displayData?.symbol as string;
  const visited = new Set<string>();
  const stack: Tile[] = [start];
  const group: Tile[] = [];

  while (stack.length) {
    const cur = stack.pop()!;
    const key = `${cur.x},${cur.y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    group.push(cur);

    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ] as [number, number][]) {
      const nb = map.get(`${cur.x + dx},${cur.y + dy}`);
      if (
        nb?.canRotate &&
        !visited.has(`${nb.x},${nb.y}`) &&
        nb.displayData?.symbol === targetSym
      ) {
        stack.push(nb);
      }
    }
  }
  return group;
}

// ── Gravity + refill ──────────────────────────────────────────────────────────

/**
 * After clearing tiles, pack survivors to the bottom of each column
 * and fill the top with fresh random candies using the level's active symbols.
 * Frozen tiles (canRotate:false, displayData.frozen:true) fall with gravity too.
 */
function applyGravity(tiles: Tile[], gridSize: number): Tile[] {
  // Survivors = unfrozen candy tiles + frozen tiles (both fall with gravity)
  const survivors = tiles.filter((t) => t.canRotate || t.displayData?.frozen);
  const activeSymbols =
    (survivors.find((t) => t.canRotate)?.displayData?.activeSymbols as string[]) ?? CANDY_SYMBOLS;

  const result: Tile[] = [];

  for (let col = 0; col < gridSize; col++) {
    const colTiles = survivors.filter((t) => t.x === col).sort((a, b) => b.y - a.y); // highest y (bottom) first

    // Pack existing tiles to the bottom — clear isNew so survivors don't re-animate
    for (let i = 0; i < colTiles.length; i++) {
      const d = colTiles[i].displayData ?? {};
      result.push({
        ...colTiles[i],
        y: gridSize - 1 - i,
        justRotated: false,
        displayData: { ...d, isNew: false },
      });
    }

    // Fill remaining slots from the top with new random candies
    const fillCount = gridSize - colTiles.length;
    for (let row = 0; row < fillCount; row++) {
      const symbol = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
      result.push({
        id: `cn-${col}-${row}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'path' as const,
        x: col,
        y: row,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        justRotated: true, // pop-in scale animation
        displayData: { symbol, activeSymbols, isNew: true },
      });
    }
  }

  return result;
}

// ── Deadlock detection + reshuffle ────────────────────────────────────────────

/** Returns true if any two adjacent tiles share the same symbol (valid move exists). */
function hasValidMove(tiles: Tile[]): boolean {
  const map = buildMap(tiles);
  for (const t of tiles) {
    if (!t.canRotate) continue;
    const sym = t.displayData?.symbol as string;
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
    ] as [number, number][]) {
      const nb = map.get(`${t.x + dx},${t.y + dy}`);
      if (nb?.canRotate && nb.displayData?.symbol === sym) return true;
    }
  }
  return false;
}

/** Fisher-Yates shuffle of the symbols while keeping tile positions. */
function reshuffle(tiles: Tile[]): Tile[] {
  const candyTiles = tiles.filter((t) => t.canRotate);
  const symbols = candyTiles.map((t) => t.displayData?.symbol as string);
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  let idx = 0;
  return tiles.map((t) =>
    t.canRotate ? { ...t, displayData: { ...t.displayData, symbol: symbols[idx++] } } : t
  );
}

// ── Per-symbol color palette ──────────────────────────────────────────────────

const CANDY_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  '🍎': { bg: '#2d0808', border: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
  '🍊': { bg: '#2d1800', border: '#f97316', glow: 'rgba(249,115,22,0.5)' },
  '🍋': { bg: '#2d2600', border: '#eab308', glow: 'rgba(234,179,8,0.5)' },
  '🫐': { bg: '#0f0f2d', border: '#6366f1', glow: 'rgba(99,102,241,0.5)' },
  '🍓': { bg: '#2d0818', border: '#ec4899', glow: 'rgba(236,72,153,0.5)' },
};

// ── Mode config ───────────────────────────────────────────────────────────────

export const CandyMode: GameModeConfig = {
  id: 'candy',
  name: 'Candy',
  description: 'Tap groups of matching candies to clear them and score points.',
  icon: '🍬',
  color: '#f472b6',
  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,
  getLevels: () => CANDY_LEVELS,
  worlds: CANDY_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'GOAL REACHED!' },

  tileRenderer: {
    type: 'candy',
    hidePipes: true,
    symbolSize: '1.5rem',

    getColors(tile, _ctx) {
      // Frozen tile — icy blue styling
      if (tile.displayData?.frozen) {
        return {
          background: 'linear-gradient(145deg, #0f1f3d 0%, #091529 100%)',
          border: '2px solid #60a5fa',
          boxShadow: '0 0 14px rgba(96,165,250,0.45)',
        };
      }

      if (!tile.canRotate) {
        return { background: 'rgba(10,10,20,0)', border: '1px solid transparent' };
      }

      const sym = tile.displayData?.symbol as string;
      const c = CANDY_COLORS[sym] ?? {
        bg: '#1a1a2e',
        border: '#6366f1',
        glow: 'rgba(99,102,241,0.4)',
      };

      // New tiles (just dropped in) get a bright indigo glow that fades out after ~1.5s
      if (tile.displayData?.isNew) {
        return {
          background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
          border: '2px solid #a5b4fc',
          boxShadow: '0 0 18px rgba(165,180,252,0.75), 0 0 6px rgba(165,180,252,0.4)',
        };
      }

      return {
        background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
        border: `2px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow}`,
      };
    },

    getSymbol(tile) {
      if (tile.displayData?.frozen) return '🧊';
      if (!tile.canRotate) return null;
      return (tile.displayData?.symbol as string) ?? null;
    },
  },

  onTileTap(x, y, tiles, gridSize): TapResult | null {
    const group = findGroup(x, y, tiles);
    if (group.length < 2) return null; // Need 2+ connected same-color tiles

    const clearedKeys = new Set(group.map((t) => `${t.x},${t.y}`));
    const remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

    let next = applyGravity(remaining, gridSize);

    // If refill produces a deadlock, reshuffle so the player can always move
    if (!hasValidMove(next)) {
      next = reshuffle(next);
    }

    // Score: n² × 5 — clearing 5 tiles scores 125, clearing 10 scores 500
    const scoreDelta = group.length * group.length * 5;

    return { tiles: next, valid: true, scoreDelta };
  },

  onTick(state, modeState) {
    const timeLeft = modeState?.timeLeft as number | undefined;
    // Only run on timed levels
    if (timeLeft === undefined) return null;

    const freezeCount = timeLeft <= 8 ? 2 : timeLeft <= 15 ? 1 : 0;
    if (freezeCount === 0) return null;

    const tiles = state.tiles;
    const candidates = tiles.filter((t) => t.canRotate && !t.displayData?.frozen);
    if (candidates.length === 0) return null;

    // Pick random unfrozen tiles to freeze (avoid duplicates)
    const toFreeze = new Set<string>();
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(freezeCount, shuffled.length); i++) {
      toFreeze.add(`${shuffled[i].x},${shuffled[i].y}`);
    }

    return {
      tiles: tiles.map((t) =>
        toFreeze.has(`${t.x},${t.y}`)
          ? { ...t, canRotate: false, displayData: { ...t.displayData, frozen: true } }
          : t
      ),
    };
  },

  checkWin(_tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    const won = score >= target;
    return { won, reason: won ? 'Target reached!' : undefined };
  },

  checkLoss(_tiles, _wallOffset, moves, maxMoves, modeState): LossResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves && score < target) {
      return { lost: true, reason: 'Out of moves!' };
    }
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    // On win, light up every candy tile
    return new Set(tiles.filter((t) => t.canRotate).map((t) => `${t.x},${t.y}`));
  },

  tutorialSteps: [
    {
      icon: '🍎',
      iconColor: '#ef4444',
      title: 'Tap a Group',
      subtitle: 'YOUR MOVE',
      demo: 'candy-group',
      body: 'Tap any candy to clear its entire connected group — all touching tiles of the same color vanish at once.\n\nYou need at least 2 connected candies to clear. A lone tile does nothing.',
    },
    {
      icon: '✦',
      iconColor: '#f472b6',
      title: 'Bigger = Better',
      subtitle: 'SCORING',
      demo: 'candy-score',
      body: 'Score = group size² × 5. A group of 5 scores 125 pts — way more than five singles!\n\nLook for large clusters to build your score fast.',
    },
    {
      icon: '⬇',
      iconColor: '#a5b4fc',
      title: 'Gravity Fills the Gap',
      subtitle: 'AFTER EACH CLEAR',
      demo: 'candy-gravity',
      body: 'After a clear, candies above fall down and fresh ones drop in from the top.\n\nPlan your clears to line up future groups and chain big combos.',
    },
    {
      icon: '🍬',
      iconColor: '#f472b6',
      title: 'Ready!',
      subtitle: "LET'S PLAY",
      demo: 'candy-ready',
      body: 'Reach the target score before you run out of taps.\n\nGood luck!',
    },
  ],

  getNotification(_tiles, _moves, modeState) {
    const delta = (modeState?.scoreDelta as number) ?? 0;
    if (delta <= 0) return null;
    // Derive group size from score formula: n² × 5
    const n = Math.round(Math.sqrt(delta / 5));
    if (n >= 9) return `+${delta} 💥 MEGA COMBO!`;
    if (n >= 6) return `+${delta} 🔥 GREAT!`;
    if (n >= 4) return `+${delta} ✨ NICE!`;
    return null; // plain "+N" shown by GameBoard for small groups
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
};
