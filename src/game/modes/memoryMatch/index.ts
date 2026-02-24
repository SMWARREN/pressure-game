// MEMORY MATCH MODE — Pair-Matching Puzzle
//
// ── How to play ──────────────────────────────────────────────────────────────
//   All tiles start face-down, hiding a symbol beneath.
//
//   TAP any face-down tile to flip it face-up (your 1st card).
//   TAP a second face-down tile to reveal it.
//
//   MATCH  → Both tiles lock permanently face-up. Keep your combo going!
//   NO MATCH → Both tiles flip back face-down after a brief peek.
//               Remember where they were — you'll need that info!
//
//   WIN  : every pair matched before moves run out.
//   LOSE : out of moves with unmatched pairs remaining.
//
// ── Scoring ──────────────────────────────────────────────────────────────────
//   Each matched pair  = 100 pts × combo multiplier
//   Consecutive matches multiply: 1st=1× 2nd=2× 3rd=3× 4th=4× 5th+=5×
//   Combo resets on any failed (non-matching) flip attempt.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import { MEMORY_LEVELS, MEMORY_WORLDS, MemoryTileData } from './levels';
import { MEMORY_TUTORIAL_STEPS } from './tutorial';
import { renderMemoryMatchDemo } from './demo';

// ── Colours ───────────────────────────────────────────────────────────────────
const ACCENT = '#818cf8'; // indigo — primary brand colour for this mode
const MATCH_COLOR = '#34d399'; // emerald — matched pair glow
const FLIPPED_COLOR = '#fbbf24'; // amber — currently revealed tile

// ── Mode state ────────────────────────────────────────────────────────────────
interface MemoryModeState extends Record<string, unknown> {
  firstFlip: { x: number; y: number; symbol: string } | null;
  awaitingFlipBack: boolean; // true while the 2-tile mismatch is still visible
  combo: number; // consecutive matches streak
  pairsFound: number;
  totalPairs: number;
}

function getInitial(tiles: Tile[]): MemoryModeState {
  const total = tiles.filter((t) => t.canRotate).length / 2;
  return {
    firstFlip: null,
    awaitingFlipBack: false,
    combo: 0,
    pairsFound: 0,
    totalPairs: total,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getData(tile: Tile): MemoryTileData {
  return tile.displayData as MemoryTileData;
}

function updateTile(tile: Tile, patch: Partial<MemoryTileData>): Tile {
  return { ...tile, displayData: { ...tile.displayData, ...patch } };
}

// ── Mode Config ───────────────────────────────────────────────────────────────
export const MemoryMatchMode: GameModeConfig = {
  id: 'memoryMatch',
  name: 'Memory Match',
  description: 'Flip tiles to find matching pairs — remember where you saw each symbol!',
  icon: '🧠',
  color: ACCENT,

  wallCompression: 'never',
  supportsUndo: false, // flipping back is automatic; undo doesn't make sense
  useMoveLimit: true,
  supportsWorkshop: false,

  getLevels: () => MEMORY_LEVELS,
  worlds: MEMORY_WORLDS,

  overlayText: {
    win: 'PERFECT RECALL!',
    loss: 'MEMORY LAPSE',
  },

  statsLabels: { moves: 'FLIPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],

  // ── Visual rendering ─────────────────────────────────────────────────────
  tileRenderer: {
    type: 'memory',
    hidePipes: true,
    symbolSize: '1.6rem',

    getColors(tile, ctx) {
      const d = getData(tile);
      if (!d) return { background: '#0d0d1a', border: '1px solid #1a1a2e' };

      // ── MATCHED pair — emerald locked glow ─────────────────────────────
      if (d.matched) {
        return {
          background: 'linear-gradient(145deg, #064e3b, #022c22)',
          border: `2px solid ${MATCH_COLOR}`,
          boxShadow: `0 0 12px ${MATCH_COLOR}55`,
        };
      }

      // ── FLIPPED (currently revealed, not yet matched) ──────────────────
      if (d.flipped) {
        return {
          background: 'linear-gradient(145deg, #422006, #1c0f03)',
          border: `2px solid ${FLIPPED_COLOR}`,
          boxShadow: `0 0 20px ${FLIPPED_COLOR}88, inset 0 0 8px ${FLIPPED_COLOR}33`,
        };
      }

      // ── FACE-DOWN — dark mystery tile ─────────────────────────────────
      const inDanger = ctx.inDanger;
      return {
        background: inDanger
          ? 'linear-gradient(145deg, #1a0a0a, #0d0010)'
          : 'linear-gradient(145deg, #0f0e1a, #080812)',
        border: inDanger ? '1px solid #7f1d1d44' : `1px solid ${ACCENT}22`,
        boxShadow: ctx.isHint ? `0 0 16px ${ACCENT}88` : undefined,
      };
    },

    getSymbol(tile) {
      const d = getData(tile);
      if (!d) return null;

      // Matched — show symbol permanently
      if (d.matched) return d.symbol;

      // Currently flipped — show symbol
      if (d.flipped) return d.symbol;

      // Face-down — show a faint question mark card-back indicator
      return '❓';
    },
  },

  // ── Core tap logic ────────────────────────────────────────────────────────
  onTileTap(x, y, tiles, _gridSize, modeState): TapResult | null {
    const tapped = tiles.find((t) => t.x === x && t.y === y);
    if (!tapped) return null;

    const d = getData(tapped);
    if (!d) return null;

    // Can't tap already-matched or already-flipped tiles
    if (d.matched || d.flipped) return null;

    const ms = (modeState ?? getInitial(tiles)) as MemoryModeState;

    // ── While awaiting flip-back, no new taps allowed ─────────────────────
    // (The store calls onTileTap synchronously; the flip-back happens via
    //  a timeout stored in customState that GameBoard reads. We block further
    //  taps by checking awaitingFlipBack.)
    if (ms.awaitingFlipBack) return null;

    // ── FIRST card of the turn ────────────────────────────────────────────
    if (!ms.firstFlip) {
      const newTiles = tiles.map((t) =>
        t.x === x && t.y === y ? updateTile(t, { flipped: true }) : t
      );
      return {
        tiles: newTiles,
        valid: true,
        scoreDelta: 0,
        customState: {
          ...ms,
          firstFlip: { x, y, symbol: d.symbol },
        } as MemoryModeState,
      };
    }

    // ── SECOND card of the turn ───────────────────────────────────────────
    const first = ms.firstFlip;

    // Flip this tile face-up temporarily
    const withSecond = tiles.map((t) =>
      t.x === x && t.y === y ? updateTile(t, { flipped: true }) : t
    );

    // ── MATCH ─────────────────────────────────────────────────────────────
    if (first.symbol === d.symbol) {
      const newCombo = ms.combo + 1;
      const multiplier = Math.min(newCombo, 5);
      const pts = 100 * multiplier;
      const newPairs = ms.pairsFound + 1;

      // Lock both tiles as matched
      const matched = withSecond.map((t) => {
        if ((t.x === x && t.y === y) || (t.x === first.x && t.y === first.y)) {
          return updateTile(t, { matched: true, flipped: false, isNew: true });
        }
        return t;
      });

      return {
        tiles: matched,
        valid: true,
        scoreDelta: pts,
        customState: {
          firstFlip: null,
          awaitingFlipBack: false,
          combo: newCombo,
          pairsFound: newPairs,
          totalPairs: ms.totalPairs,
        } as MemoryModeState,
      };
    }

    // ── NO MATCH — flip both back ─────────────────────────────────────────
    // We mark awaitingFlipBack = true to block further taps.
    // The tiles remain flipped momentarily (visible in the next render),
    // then we clear them via a scheduled onTick-style flip.
    // We store the coords to flip back in customState.
    return {
      tiles: withSecond,
      valid: true,
      scoreDelta: 0,
      customState: {
        firstFlip: null,
        awaitingFlipBack: true,
        awaitFlipX1: first.x,
        awaitFlipY1: first.y,
        awaitFlipX2: x,
        awaitFlipY2: y,
        combo: 0, // reset combo on mismatch
        pairsFound: ms.pairsFound,
        totalPairs: ms.totalPairs,
      } as MemoryModeState & Record<string, unknown>,
    };
  },

  // ── Tick — clear the "awaiting flip back" after one tick (≈1 second) ───
  onTick(state: import('../../types').GameState): Partial<import('../../types').GameState> | null {
    const ms = state.modeState as (MemoryModeState & Record<string, unknown>) | undefined;
    if (!ms?.awaitingFlipBack) return null;

    const x1 = ms.awaitFlipX1 as number;
    const y1 = ms.awaitFlipY1 as number;
    const x2 = ms.awaitFlipX2 as number;
    const y2 = ms.awaitFlipY2 as number;

    const newTiles = state.tiles.map((t: Tile) => {
      if ((t.x === x1 && t.y === y1) || (t.x === x2 && t.y === y2)) {
        return updateTile(t, { flipped: false });
      }
      return t;
    });

    const newModeState: Record<string, unknown> = {
      firstFlip: null,
      awaitingFlipBack: false,
      combo: ms.combo ?? 0,
      pairsFound: ms.pairsFound ?? 0,
      totalPairs: ms.totalPairs ?? 0,
    };

    return {
      tiles: newTiles,
      modeState: newModeState,
    };
  },

  // ── Win / Loss ───────────────────────────────────────────────────────────
  checkWin(tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
    const ms = modeState as MemoryModeState | undefined;
    if (!ms) return { won: false };
    const allMatched = tiles.every((t) => !t.canRotate || (getData(t)?.matched ?? false));
    return { won: allMatched };
  },

  checkLoss(tiles, _w, moves, maxMoves, _modeState): LossResult {
    if (moves < maxMoves) return { lost: false };
    const allMatched = tiles.every((t) => !t.canRotate || (getData(t)?.matched ?? false));
    if (allMatched) return { lost: false };
    return { lost: true, reason: 'Out of flips!' };
  },

  // ── Win tiles — all matched tiles glow ──────────────────────────────────
  getWinTiles(tiles): Set<string> {
    return new Set(tiles.filter((t) => getData(t)?.matched ?? false).map((t) => `${t.x},${t.y}`));
  },

  // ── Hints — unmatched face-down tiles ────────────────────────────────────
  getHintTiles(tiles): Set<string> {
    const hints = new Set<string>();
    for (const t of tiles) {
      const d = getData(t);
      if (d && !d.matched && !d.flipped) hints.add(`${t.x},${t.y}`);
    }
    return hints;
  },

  // ── Notifications ────────────────────────────────────────────────────────
  getNotification(_tiles, _moves, modeState) {
    const ms = modeState as MemoryModeState | undefined;
    const delta = (modeState?.scoreDelta as number) ?? 0;
    if (delta <= 0) return null;

    const combo = ms?.combo ?? 1;
    const multiplier = Math.min(combo, 5);
    const comboEmoji = ['', '✨', '🔥', '💫', '⚡', '🌟'][multiplier] ?? '🌟';

    if (multiplier >= 5) return `${comboEmoji} 5× COMBO! +${delta} pts`;
    if (multiplier >= 4) return `${comboEmoji} 4× Combo! +${delta} pts`;
    if (multiplier >= 3) return `${comboEmoji} 3× Combo! +${delta} pts`;
    if (multiplier >= 2) return `${comboEmoji} 2× Streak! +${delta} pts`;
    return `🧠 Match! +${delta} pts`;
  },

  // ── Tutorial ─────────────────────────────────────────────────────────────
  tutorialSteps: MEMORY_TUTORIAL_STEPS,
  renderDemo: renderMemoryMatchDemo,
};
