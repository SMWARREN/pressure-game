// SHOPPING SPREE MODE — Match Items & Earn Money!
//
// Tap a connected group of 2+ same items to "buy" them and earn cash.
// Different items have different values: 💄=10, 👗=15, 👠=20, 👜=25, 💎=50
// Bigger groups = bonus multipliers! Score = (itemValue × groupSize) × comboMultiplier
// Win: reach targetScore within maxMoves. Loss: moves exhausted without hitting target.
//
// No pipes, no walls — pure shopping arcade gameplay!

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import { SHOPPING_LEVELS, SHOPPING_WORLDS, SHOPPING_ITEMS, ITEM_VALUES } from './levels';

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
 * and fill the top with fresh random items.
 */
function applyGravity(tiles: Tile[], gridSize: number): Tile[] {
  const survivors = tiles.filter((t) => t.canRotate);
  const activeSymbols = (survivors.find((t) => t.canRotate)?.displayData
    ?.activeSymbols as string[]) ?? [...SHOPPING_ITEMS];

  const result: Tile[] = [];

  for (let col = 0; col < gridSize; col++) {
    const colTiles = survivors.filter((t) => t.x === col).sort((a, b) => b.y - a.y);

    // Pack existing tiles to the bottom
    for (let i = 0; i < colTiles.length; i++) {
      const d = colTiles[i].displayData ?? {};
      result.push({
        ...colTiles[i],
        y: gridSize - 1 - i,
        justRotated: false,
        displayData: { ...d, isNew: false },
      });
    }

    // Fill remaining slots from the top with new random items
    const fillCount = gridSize - colTiles.length;
    for (let row = 0; row < fillCount; row++) {
      // 💎 is rare (10% chance)
      let symbol: string;
      if (Math.random() < 0.1) {
        symbol = '💎';
      } else {
        const commonSymbols = activeSymbols.filter((s) => s !== '💎');
        symbol = commonSymbols[Math.floor(Math.random() * commonSymbols.length)];
      }
      result.push({
        id: `sn-${col}-${row}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'path' as const,
        x: col,
        y: row,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        justRotated: true,
        displayData: { symbol, activeSymbols: activeSymbols, isNew: true },
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
  const itemTiles = tiles.filter((t) => t.canRotate);
  const symbols = itemTiles.map((t) => t.displayData?.symbol as string);
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  let idx = 0;
  return tiles.map((t) =>
    t.canRotate ? { ...t, displayData: { ...t.displayData, symbol: symbols[idx++] } } : t
  );
}

// ── Per-item color palette ────────────────────────────────────────────────────

const ITEM_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  '👗': { bg: '#2d1a2d', border: '#ec4899', glow: 'rgba(236,72,153,0.5)' }, // Pink dress
  '👠': { bg: '#2d1a1a', border: '#ef4444', glow: 'rgba(239,68,68,0.5)' }, // Red heels
  '👜': { bg: '#2d2418', border: '#d97706', glow: 'rgba(217,119,6,0.5)' }, // Brown bag
  '💄': { bg: '#2d0f1f', border: '#db2777', glow: 'rgba(219,39,119,0.5)' }, // Magenta lipstick
  '💎': { bg: '#0f1f2d', border: '#06b6d4', glow: 'rgba(6,182,212,0.6)' }, // Cyan diamond
};

// ── Mode config ───────────────────────────────────────────────────────────────

export const ShoppingSpreeMode: GameModeConfig = {
  id: 'shoppingSpree',
  name: 'Shopping Spree',
  description: 'Match items to shop and earn cash! Different items have different values.',
  icon: '🛍️',
  color: '#ec4899',
  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,
  getLevels: () => SHOPPING_LEVELS,
  worlds: SHOPPING_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'GOAL REACHED!', loss: 'OUT OF TAPS!' },

  tileRenderer: {
    type: 'shopping',
    hidePipes: true,
    symbolSize: '1.5rem',

    getColors(tile, _ctx) {
      if (!tile.canRotate) {
        return { background: 'rgba(10,10,20,0)', border: '1px solid transparent' };
      }

      const sym = tile.displayData?.symbol as string;
      const c = ITEM_COLORS[sym] ?? {
        bg: '#1a1a2e',
        border: '#ec4899',
        glow: 'rgba(236,72,153,0.4)',
      };

      // New tiles get a bright pink glow
      if (tile.displayData?.isNew) {
        return {
          background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
          border: '2px solid #f9a8d4',
          boxShadow: '0 0 18px rgba(249,168,212,0.75), 0 0 6px rgba(249,168,212,0.4)',
        };
      }

      return {
        background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
        border: `2px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow}`,
      };
    },

    getSymbol(tile) {
      if (!tile.canRotate) return null;
      return (tile.displayData?.symbol as string) ?? null;
    },
  },

  onTileTap(x, y, tiles, gridSize): TapResult | null {
    const group = findGroup(x, y, tiles);
    if (group.length < 2) return null; // Need 2+ connected same-item tiles

    // Get the item type and its value
    const symbol = group[0].displayData?.symbol as string;
    const baseValue = ITEM_VALUES[symbol] ?? 10;

    // Calculate score: base value × group size × combo multiplier
    // Bigger groups get bonus multipliers
    let comboMultiplier = 1;
    if (group.length >= 5) comboMultiplier = 2;
    if (group.length >= 7) comboMultiplier = 3;
    if (group.length >= 10) comboMultiplier = 4;

    const scoreDelta = baseValue * group.length * comboMultiplier;

    const clearedKeys = new Set(group.map((t) => `${t.x},${t.y}`));
    const remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

    let next = applyGravity(remaining, gridSize);

    // If refill produces a deadlock, reshuffle
    if (!hasValidMove(next)) {
      next = reshuffle(next);
    }

    return { tiles: next, valid: true, scoreDelta };
  },

  checkWin(_tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    const won = score >= target;
    return { won, reason: won ? 'Shopping goal reached!' : undefined };
  },

  checkLoss(_tiles, _wallOffset, moves, maxMoves, modeState): LossResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves && score < target) {
      return { lost: true, reason: 'Out of taps!' };
    }
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    // On win, light up every item tile
    return new Set(tiles.filter((t) => t.canRotate).map((t) => `${t.x},${t.y}`));
  },

  tutorialSteps: [
    {
      icon: '👗',
      iconColor: '#ec4899',
      title: 'Tap to Shop!',
      subtitle: 'YOUR MOVE',
      demo: 'candy-group',
      body: 'Tap any item to buy its entire connected group — all touching items of the same type!\n\nYou need at least 2 connected items to make a purchase.',
    },
    {
      icon: '💰',
      iconColor: '#f59e0b',
      title: 'Item Values',
      subtitle: 'EARN CASH',
      demo: 'candy-score',
      body: 'Each item has a different value:\n💄 Lipstick = $10\n👗 Dress = $15\n👠 Heels = $20\n👜 Handbag = $25\n💎 Diamond = $50\n\nMatch diamonds for big money!',
    },
    {
      icon: '✨',
      iconColor: '#a855f7',
      title: 'Combo Bonus',
      subtitle: 'BIGGER GROUPS',
      demo: 'candy-gravity',
      body: 'Larger groups earn bonus multipliers!\n5+ items = 2× bonus\n7+ items = 3× bonus\n10+ items = 4× bonus\n\nPlan your shopping for maximum cash!',
    },
    {
      icon: '🛍️',
      iconColor: '#ec4899',
      title: 'Ready to Shop!',
      subtitle: "LET'S GO",
      demo: 'candy-ready',
      body: 'Reach the target amount before you run out of taps.\n\nHappy shopping!',
    },
  ],

  getNotification(_tiles, _moves, modeState) {
    const delta = (modeState?.scoreDelta as number) ?? 0;
    if (delta <= 0) return null;

    // Give feedback based on score earned
    if (delta >= 300) return `+$${delta} 💎 JACKPOT!`;
    if (delta >= 150) return `+$${delta} 🔥 SUPER DEAL!`;
    if (delta >= 75) return `+$${delta} ✨ GREAT BUY!`;
    if (delta >= 50) return `+$${delta} 💰 NICE!`;
    return null;
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
};
