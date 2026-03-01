// QUANTUM CHAIN MODE — Math Chain Puzzle
//
// Connect numbers and operators to hit target sums!
// Tap a number, then an adjacent operator, then another number, etc.
// End your chain on a Target tile with the matching sum to win.
// Quantum Flux tiles modify adjacent number values!
// Chain Multiplier tiles boost your score!
// Wildcard tiles can be any number 1-9!

import type {
  GameModeConfig,
  TileRenderer,
  TileRenderContext,
  TileColors,
  WinResult,
  TapResult,
} from '@/game/modes/types';
import type {
  GameState,
  Tile,
  NumberTileData,
  OperatorTileData,
  QuantumFluxTileData,
  TargetTileData,
  QuantumFluxEffect,
} from '@/game/types';
import { isEmpty, isNotEmpty } from '@/utils/conditionalStyles';
import { QUANTUM_CHAIN_LEVELS } from './levels';
import { QUANTUM_CHAIN_TUTORIAL_STEPS } from './tutorial';
import { renderQuantumChainDemo } from './demo';
import { QUANTUM_CHAIN_WALKTHROUGH } from './walkthrough';

// ── Mode State Interface ─────────────────────────────────────────────────────

interface QuantumChainModeState extends Record<string, unknown> {
  activeChain: Tile[];
  currentCalculation: string;
  currentValue: number;
  lastTilePosition: { x: number; y: number } | null;
  comboCount: number;
  lastActionValid: boolean;
  chainMultiplier: number;
}

function getInitialState(): QuantumChainModeState {
  return {
    activeChain: [],
    currentCalculation: '',
    currentValue: 0,
    lastTilePosition: null,
    comboCount: 0,
    lastActionValid: true,
    chainMultiplier: 1,
  };
}

// ── Helper Functions ─────────────────────────────────────────────────────────

function getTileAt(x: number, y: number, tiles: Tile[]): Tile | undefined {
  return tiles.find((t) => t.x === x && t.y === y);
}

function getNeighbors(tile: Tile, tiles: Tile[]): Tile[] {
  const neighbors: Tile[] = [];
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }, // right
  ];

  for (const dir of directions) {
    const neighbor = getTileAt(tile.x + dir.x, tile.y + dir.y, tiles);
    if (neighbor) neighbors.push(neighbor);
  }

  return neighbors;
}

// Quantum flux effect processors (replaces switch statement)
const FLUX_EFFECT_PROCESSORS: Record<string, (value: number, fluxValue?: number) => number> = {
  double: (v) => v * 2,
  halve: (v) => Math.floor(v / 2),
  add: (v, fv) => v + (fv ?? 0),
  subtract: (v, fv) => v - (fv ?? 0),
};

function applyQuantumFlux(tile: Tile, allTiles: Tile[]): number {
  if (tile.type !== 'number' || !tile.displayData) return 0;

  const data = tile.displayData as NumberTileData;
  let value = data.baseValue;

  const neighbors = getNeighbors(tile, allTiles);
  for (const neighbor of neighbors) {
    if (neighbor.type === 'quantumFlux' && neighbor.displayData) {
      const flux = neighbor.displayData as QuantumFluxTileData;
      const processor = FLUX_EFFECT_PROCESSORS[flux.effect];
      if (processor) {
        value = processor(value, flux.value);
      }
    }
  }

  return value;
}

// Arithmetic operator evaluators (replaces switch statement)
const OPERATOR_EVALUATORS: Record<string, (a: number, b: number) => number> = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => Math.floor(a / b),
};

function evaluateExpression(expression: string): number {
  const tokens = expression.match(/\d+|[+\-*/]/g);
  if (!tokens || tokens.length === 0) return 0;

  let result = Number.parseInt(tokens[0], 10);

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const operand = Number.parseInt(tokens[i + 1], 10);
    const evaluator = OPERATOR_EVALUATORS[operator];
    if (evaluator) {
      result = evaluator(result, operand);
    }
  }

  return result;
}

function isAdjacent(tile1: Tile, tile2: Tile): boolean {
  const dx = Math.abs(tile1.x - tile2.x);
  const dy = Math.abs(tile1.y - tile2.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

// ── Hint System ──────────────────────────────────────────────────────────────

function getValidNextTiles(
  activeChain: Tile[],
  _lastTilePosition: { x: number; y: number } | null,
  tiles: Tile[]
): Tile[] {
  // No chain started - all number tiles are valid
  if (isEmpty(activeChain)) {
    return tiles.filter((t) => t.type === 'number');
  }

  const lastTile = activeChain[activeChain.length - 1];
  const neighbors = getNeighbors(lastTile, tiles);

  // After a number, can tap operator or target
  if (lastTile.type === 'number') {
    return neighbors.filter((t) => t.type === 'operator' || t.type === 'target');
  }

  // After an operator, must tap a number
  if (lastTile.type === 'operator') {
    return neighbors.filter((t) => t.type === 'number');
  }

  return [];
}

// ── Quantum Flux symbol mapping ──────────────────────────────────────────────

const QUANTUM_FLUX_SYMBOLS: Record<QuantumFluxEffect, (value: number) => string> = {
  double: () => '×2',
  halve: () => '÷2',
  add: (v) => `+${v}`,
  subtract: (v) => `-${v}`,
};

/**
 * Get symbol for quantum flux tile
 */
function getQuantumFluxSymbol(data: QuantumFluxTileData): string {
  const fn = QUANTUM_FLUX_SYMBOLS[data.effect];
  return fn ? fn(data.value ?? 0) : '?';
}

// ── Tile color constants ─────────────────────────────────────────────────────

const TILE_COLORS_BY_TYPE: Record<string, TileColors> = {
  number: {
    background: 'linear-gradient(145deg, #1e3a5f 0%, #0d1f33 100%)',
    border: '2px solid #3b82f6',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
    color: '#93c5fd',
  },
  operator: {
    background: 'linear-gradient(145deg, #4c1d95 0%, #2e1065 100%)',
    border: '2px solid #8b5cf6',
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
    color: '#c4b5fd',
  },
  quantumFlux: {
    background: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 100%)',
    border: '2px solid #ef4444',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
  },
  targetFulfilled: {
    background: 'linear-gradient(145deg, #14532d 0%, #052e16 100%)',
    border: '2px solid #22c55e',
    boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
    color: '#86efac',
  },
  targetPending: {
    background: 'linear-gradient(145deg, #78350f 0%, #451a03 100%)',
    border: '2px solid #f59e0b',
    boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
    color: '#fcd34d',
  },
  empty: {
    background: '#1a1a2e',
    border: '1px solid #333',
  },
};

/**
 * Get colors for target tile based on fulfillment state
 */
// ── onTileTap helpers (reduce cognitive complexity) ──────────────────────

function handleFirstNumber(tappedTile: Tile, tiles: Tile[]): TapResult | null {
  if (tappedTile.type !== 'number') return null;
  const value = applyQuantumFlux(tappedTile, tiles);
  const newCalculation = String(value);
  return {
    tiles,
    valid: true,
    customState: {
      activeChain: [
        { ...tappedTile, displayData: { ...tappedTile.displayData, currentValue: value } },
      ],
      currentCalculation: newCalculation,
      currentValue: value,
      lastTilePosition: { x: tappedTile.x, y: tappedTile.y },
    },
  };
}

function handleNumberTile(
  tappedTile: Tile,
  activeChain: Tile[],
  currentCalculation: string,
  tiles: Tile[]
): TapResult {
  const value = applyQuantumFlux(tappedTile, tiles);
  const newCalculation = currentCalculation + String(value);
  return {
    tiles,
    valid: true,
    customState: {
      activeChain: [
        ...activeChain,
        { ...tappedTile, displayData: { ...tappedTile.displayData, currentValue: value } },
      ],
      currentCalculation: newCalculation,
      currentValue: evaluateExpression(newCalculation),
      lastTilePosition: { x: tappedTile.x, y: tappedTile.y },
    },
  };
}

function handleOperatorTile(
  tappedTile: Tile,
  activeChain: Tile[],
  currentCalculation: string,
  currentValue: number,
  tiles: Tile[]
): TapResult {
  const opData = tappedTile.displayData as OperatorTileData;
  const newCalculation = currentCalculation + opData.symbol;
  return {
    tiles,
    valid: true,
    customState: {
      activeChain: [...activeChain, tappedTile],
      currentCalculation: newCalculation,
      currentValue,
      lastTilePosition: { x: tappedTile.x, y: tappedTile.y },
    },
  };
}

function handleTargetTile(tappedTile: Tile, currentCalculation: string, tiles: Tile[]): TapResult {
  const targetData = tappedTile.displayData as TargetTileData;
  const calculatedResult = evaluateExpression(currentCalculation);

  if (calculatedResult === targetData.targetSum) {
    const newTiles = tiles.map((t) =>
      t.id === tappedTile.id
        ? { ...t, displayData: { ...(t.displayData as TargetTileData), isFulfilled: true } }
        : t
    );
    return { tiles: newTiles, valid: true, customState: getInitialState() };
  }
  return { tiles, valid: true, customState: getInitialState() };
}

function getTargetColors(data: TargetTileData): TileColors {
  return data.isFulfilled ? TILE_COLORS_BY_TYPE.targetFulfilled : TILE_COLORS_BY_TYPE.targetPending;
}

// ── Tile Renderer ────────────────────────────────────────────────────────────

const quantumChainTileRenderer: TileRenderer = {
  type: 'quantum_chain',
  hidePipes: true,
  symbolSize: '1.4rem',

  getSymbol(tile: Tile): string | null {
    if (tile.type === 'number') {
      const data = tile.displayData as NumberTileData;
      const displayValue = data.currentValue ?? data.baseValue;
      return String(displayValue);
    }
    if (tile.type === 'operator') {
      const data = tile.displayData as OperatorTileData;
      return data.symbol;
    }
    if (tile.type === 'quantumFlux') {
      const data = tile.displayData as QuantumFluxTileData;
      return getQuantumFluxSymbol(data);
    }
    if (tile.type === 'target') {
      const data = tile.displayData as TargetTileData;
      return data.isFulfilled ? '✓' : String(data.targetSum);
    }
    return null;
  },

  getColors(tile: Tile, _ctx: TileRenderContext): TileColors {
    if (tile.type === 'number') {
      return TILE_COLORS_BY_TYPE.number;
    }
    if (tile.type === 'operator') {
      return TILE_COLORS_BY_TYPE.operator;
    }
    if (tile.type === 'quantumFlux') {
      return TILE_COLORS_BY_TYPE.quantumFlux;
    }
    if (tile.type === 'target') {
      const data = tile.displayData as TargetTileData;
      return getTargetColors(data);
    }
    return TILE_COLORS_BY_TYPE.empty;
  },
};

// ── Mode Configuration ───────────────────────────────────────────────────────

export const QuantumChainMode: GameModeConfig = {
  id: 'quantum_chain',
  name: 'Quantum Chain',
  description: 'Connect numbers and operators to hit target sums. Watch out for quantum flux!',
  icon: '🔗',
  color: '#8b5cf6',
  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: false,

  overlayText: {
    win: 'CHAIN COMPLETE!',
    loss: 'CHAIN BROKEN',
  },

  statsDisplay: [{ type: 'score' }],

  tutorialSteps: QUANTUM_CHAIN_TUTORIAL_STEPS,
  renderDemo: renderQuantumChainDemo,
  walkthrough: QUANTUM_CHAIN_WALKTHROUGH,

  worlds: [{ id: 1, name: 'Quantum', tagline: 'Chain reactions', color: '#8b5cf6', icon: '🔗' }],

  tileRenderer: quantumChainTileRenderer,

  getLevels: () => QUANTUM_CHAIN_LEVELS,

  initialState: (_state: GameState): Record<string, unknown> => {
    return getInitialState();
  },

  onTileTap(
    x: number,
    y: number,
    tiles: Tile[],
    _gridSize: number,
    modeState?: Record<string, unknown>
  ): TapResult | null {
    const tappedTile = getTileAt(x, y, tiles);
    if (!tappedTile) return null;

    const state: QuantumChainModeState = (modeState as QuantumChainModeState) || getInitialState();
    const { activeChain, currentCalculation } = state;

    if (activeChain.some((t) => t.id === tappedTile.id)) {
      return { tiles, valid: true, customState: getInitialState() };
    }

    if (isEmpty(activeChain)) {
      return handleFirstNumber(tappedTile, tiles);
    }

    const lastChainTile = activeChain[activeChain.length - 1];
    if (!isAdjacent(tappedTile, lastChainTile)) {
      return { tiles, valid: true, customState: getInitialState() };
    }

    const lastTile = activeChain[activeChain.length - 1];
    const lastIsNumber = lastTile.type === 'number';
    const lastIsOperator = lastTile.type === 'operator';

    if (lastIsNumber && tappedTile.type !== 'operator' && tappedTile.type !== 'target') {
      return { tiles, valid: true, customState: getInitialState() };
    }

    if (lastIsOperator && tappedTile.type !== 'number') {
      return { tiles, valid: true, customState: getInitialState() };
    }

    if (tappedTile.type === 'number') {
      return handleNumberTile(tappedTile, activeChain, currentCalculation, tiles);
    }

    if (tappedTile.type === 'operator') {
      return handleOperatorTile(
        tappedTile,
        activeChain,
        currentCalculation,
        state.currentValue,
        tiles
      );
    }

    if (tappedTile.type === 'target') {
      return handleTargetTile(tappedTile, currentCalculation, tiles);
    }

    return null;
  },

  checkWin(
    tiles: Tile[],
    _goalNodes: { x: number; y: number }[],
    _moves: number,
    _maxMoves: number,
    _modeState?: Record<string, unknown>
  ): WinResult {
    const targetTiles = tiles.filter((t) => t.type === 'target');

    if (isEmpty(targetTiles)) {
      return { won: false };
    }

    const allFulfilled = targetTiles.every((t) => {
      const data = t.displayData as TargetTileData;
      return data?.isFulfilled === true;
    });

    return {
      won: allFulfilled,
      reason: allFulfilled ? 'All targets fulfilled!' : undefined,
    };
  },

  getWinTiles(tiles: Tile[]): Set<string> {
    const winTiles = new Set<string>();
    tiles.forEach((t) => {
      if (t.type === 'target') {
        const data = t.displayData as TargetTileData;
        if (data?.isFulfilled) {
          winTiles.add(`${t.x},${t.y}`);
        }
      }
    });
    return winTiles;
  },

  // ── Hint System ────────────────────────────────────────────────────────────
  getHintTiles(
    tiles: Tile[],
    _goalNodes: { x: number; y: number }[],
    modeState?: Record<string, unknown>
  ): Set<string> {
    const state: QuantumChainModeState = (modeState as QuantumChainModeState) || getInitialState();
    const validTiles = getValidNextTiles(state.activeChain, state.lastTilePosition, tiles);
    const hintSet = new Set<string>();
    validTiles.forEach((t) => hintSet.add(`${t.x},${t.y}`));
    return hintSet;
  },

  // ── Notification System ─────────────────────────────────────────────────────
  getNotification(
    _tiles: Tile[],
    _moves: number,
    modeState?: Record<string, unknown>
  ): string | null {
    const state: QuantumChainModeState = (modeState as QuantumChainModeState) || getInitialState();

    // Show chain progress
    if (isNotEmpty(state.activeChain)) {
      const chainLength = state.activeChain.length;
      if (chainLength >= 5) {
        return `🔥 Chain x${chainLength}!`;
      }
      if (chainLength >= 3) {
        return `${state.currentCalculation} = ${state.currentValue}`;
      }
    }

    return null;
  },
};
