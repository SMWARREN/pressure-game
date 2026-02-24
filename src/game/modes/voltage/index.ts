// VOLTAGE MODE
//
// Cells charge up every second. Tap ANYWHERE to discharge the entire grid —
// scoring points equal to the total charge at that moment.
// Wait too long → overload → game over. Act too early → low score.
//
// Hot cells (🔥) charge at 2× per tick and cap out twice as fast.
// Cold cells (❄️) skip every other tick — they charge slowly and safely.
//
// Engine exploitation:
// - onTileTap ignores x/y entirely — any tap = global discharge event
// - onTick drives charge accumulation and overload detection
// - move limit = number of discharges allowed, not tile taps

import { GameModeConfig, TapResult, WinResult } from '../types';
import { Tile } from '../../types';
import { VOLTAGE_LEVELS, VOLTAGE_WORLDS } from './levels';
import { VOLTAGE_TUTORIAL_STEPS } from './tutorial';
import { renderVoltageDemo } from './demo';
import { VOLTAGE_WALKTHROUGH } from './walkthrough';

// ── Charge constants ──────────────────────────────────────────────────────────

const OVERLOAD_THRESHOLD = 8;

// ── Tile visuals ──────────────────────────────────────────────────────────────

function chargeToColors(charge: number, kind: string) {
  if (kind === 'cold') {
    return {
      background: 'linear-gradient(145deg,#0c1a2e,#0f2040)',
      border: '1px solid #1d4ed8',
      boxShadow: '0 0 4px rgba(29,78,216,0.2)',
    };
  }

  const levels = [
    // 0: dormant
    { bg: '#0a0a14', border: '#1e293b', glow: 'none' },
    // 1: barely charged
    { bg: '#0a1a0a', border: '#14532d', glow: 'rgba(20,83,45,0.2)' },
    // 2
    { bg: '#0f2d0f', border: '#166534', glow: 'rgba(22,101,52,0.3)' },
    // 3
    { bg: '#1a3d0a', border: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
    // 4
    { bg: '#3d3d00', border: '#eab308', glow: 'rgba(234,179,8,0.5)' },
    // 5
    { bg: '#3d1f00', border: '#f97316', glow: 'rgba(249,115,22,0.6)' },
    // 6
    { bg: '#3d0a00', border: '#ef4444', glow: 'rgba(239,68,68,0.7)' },
    // 7: danger — near overload
    { bg: '#2d0000', border: '#ff0000', glow: 'rgba(255,0,0,0.85)' },
  ];

  const idx = Math.max(0, Math.min(7, Math.floor(charge)));
  const l = levels[idx];
  const hotExtra = kind === 'hot' ? ', 0 0 6px rgba(251,191,36,0.4)' : '';
  return {
    background: `linear-gradient(145deg, ${l.bg}, ${l.bg}cc)`,
    border: `2px solid ${l.border}`,
    boxShadow: l.glow === 'none' ? `inset 0 0 0 1px #1e293b` : `0 0 12px ${l.glow}${hotExtra}`,
  };
}

function chargeToSymbol(charge: number, kind: string): string | null {
  if (kind === 'cold') return '❄';
  if (kind === 'hot' && charge === 0) return '🔥';
  if (charge === 0) return null;
  if (charge >= 7) return '⚡';
  const bars = ['', '▁', '▂', '▃', '▄', '▅', '▆', '▇'];
  return bars[Math.min(7, Math.floor(charge))];
}

// ── Mode config ───────────────────────────────────────────────────────────────

export const VoltageMode: GameModeConfig = {
  id: 'voltage',
  name: 'Voltage',
  description: 'Let cells charge up, then tap anywhere to discharge for big points.',
  icon: '⚡',
  color: '#eab308',
  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,
  tutorialSteps: VOLTAGE_TUTORIAL_STEPS,
  renderDemo: renderVoltageDemo,
  walkthrough: VOLTAGE_WALKTHROUGH,
  getLevels: () => VOLTAGE_LEVELS,
  worlds: VOLTAGE_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'DISCHARGED!', loss: 'OVERLOADED!' },

  tileRenderer: {
    type: 'voltage',
    hidePipes: true,
    symbolSize: '1.1rem',
    getColors(tile) {
      const charge = (tile.displayData?.charge as number) ?? 0;
      const kind = (tile.displayData?.kind as string) ?? 'cell';
      return chargeToColors(charge, kind);
    },
    getSymbol(tile) {
      const charge = (tile.displayData?.charge as number) ?? 0;
      const kind = (tile.displayData?.kind as string) ?? 'cell';
      return chargeToSymbol(charge, kind);
    },
  },

  initialState() {
    return { tick: 0 };
  },

  onTick(state) {
    const ms = state.modeState as { tick?: number };
    const tick = (ms?.tick ?? 0) + 1;
    const tiles = state.tiles;

    let overloaded = false;
    const newTiles: Tile[] = tiles.map((t) => {
      const kind = (t.displayData?.kind as string) ?? 'cell';
      if (kind === 'cold') {
        // Cold tiles only charge on even ticks
        if (tick % 2 !== 0) return t;
        const charge = ((t.displayData?.charge as number) ?? 0) + 1;
        if (charge >= OVERLOAD_THRESHOLD) overloaded = true;
        return {
          ...t,
          displayData: { ...t.displayData, charge: Math.min(OVERLOAD_THRESHOLD, charge) },
        };
      }
      const rate = kind === 'hot' ? 2 : 1;
      const charge = ((t.displayData?.charge as number) ?? 0) + rate;
      if (charge >= OVERLOAD_THRESHOLD) overloaded = true;
      return {
        ...t,
        displayData: { ...t.displayData, charge: Math.min(OVERLOAD_THRESHOLD, charge) },
      };
    });

    const newMs = { ...ms, tick };

    if (overloaded) {
      return {
        tiles: newTiles,
        modeState: newMs,
        status: 'lost' as const,
        lossReason: '⚡ OVERLOADED!',
      };
    }

    return { tiles: newTiles, modeState: newMs };
  },

  // Any tap on any tile = discharge the entire grid
  onTileTap(_x, _y, tiles, _gridSize, modeState): TapResult | null {
    const totalCharge = tiles.reduce((sum, t) => sum + ((t.displayData?.charge as number) ?? 0), 0);
    if (totalCharge === 0) return null; // Nothing to discharge — invalid tap

    const discharged: Tile[] = tiles.map((t) => ({
      ...t,
      justRotated: true,
      displayData: { ...t.displayData, charge: 0 },
    }));

    return {
      tiles: discharged,
      valid: true,
      scoreDelta: totalCharge,
      customState: { ...(modeState ?? {}), lastDischarge: totalCharge },
    };
  },

  checkWin(_tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    return { won: score >= target };
  },

  checkLoss(_tiles, _wallOffset, moves, maxMoves, modeState): { lost: boolean; reason?: string } {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves && score < target) {
      return { lost: true, reason: 'Not enough charge!' };
    }
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    return new Set(tiles.map((t) => `${t.x},${t.y}`));
  },

  getNotification(_tiles, _moves, modeState) {
    const last = modeState?.lastDischarge as number | undefined;
    if (!last) return null;
    if (last >= 200) return `⚡ ${last} pts — MASSIVE DISCHARGE!`;
    if (last >= 100) return `⚡ ${last} pts — nice timing!`;
    return null;
  },

  statsLabels: { moves: 'DISCHARGES' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
};
