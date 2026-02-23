// QUANTUM CHAIN MODE — Math Chain Puzzle
//
// Connect numbers and operators to hit target sums!
// Tap a number, then an adjacent operator, then another number, etc.
// End your chain on a Target tile with the matching sum to win.
// Quantum Flux tiles modify adjacent number values!

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
import { QUANTUM_CHAIN_LEVELS } from './levels';

// ── Mode State Interface ─────────────────────────────────────────────────────

interface QuantumChainModeState extends Record<string, unknown> {
  activeChain: Tile[];
  currentCalculation: string;
  currentValue: number;
  lastTilePosition: { x: number; y: number } | null;
}

function getInitialState(): QuantumChainModeState {
  return {
    activeChain: [],
    currentCalculation: '',
    currentValue: 0,
    lastTilePosition: null,
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

function applyQuantumFlux(tile: Tile, allTiles: Tile[]): number {
  if (tile.type !== 'number' || !tile.displayData) return 0;

  const data = tile.displayData as NumberTileData;
  let value = data.baseValue;

  const neighbors = getNeighbors(tile, allTiles);
  for (const neighbor of neighbors) {
    if (neighbor.type === 'quantumFlux' && neighbor.displayData) {
      const flux = neighbor.displayData as QuantumFluxTileData;
      switch (flux.effect) {
        case 'double':
          value *= 2;
          break;
        case 'halve':
          value = Math.floor(value / 2);
          break;
        case 'add':
          value += flux.value ?? 0;
          break;
        case 'subtract':
          value -= flux.value ?? 0;
          break;
      }
    }
  }

  return value;
}

function evaluateExpression(expression: string): number {
  const tokens = expression.match(/\d+|[+\-*/]/g);
  if (!tokens || tokens.length === 0) return 0;

  let result = parseInt(tokens[0], 10);

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const operand = parseInt(tokens[i + 1], 10);

    switch (operator) {
      case '+':
        result += operand;
        break;
      case '-':
        result -= operand;
        break;
      case '*':
        result *= operand;
        break;
      case '/':
        result = Math.floor(result / operand);
        break;
    }
  }

  return result;
}

function isAdjacent(tile1: Tile, tile2: Tile): boolean {
  const dx = Math.abs(tile1.x - tile2.x);
  const dy = Math.abs(tile1.y - tile2.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
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
      const symbols: Record<QuantumFluxEffect, string> = {
        double: '×2',
        halve: '÷2',
        add: `+${data.value ?? 0}`,
        subtract: `-${data.value ?? 0}`,
      };
      return symbols[data.effect] || '?';
    }
    if (tile.type === 'target') {
      const data = tile.displayData as TargetTileData;
      return data.isFulfilled ? '✓' : String(data.targetSum);
    }
    return null;
  },

  getColors(tile: Tile, _ctx: TileRenderContext): TileColors {
    if (tile.type === 'number') {
      return {
        background: 'linear-gradient(145deg, #1e3a5f 0%, #0d1f33 100%)',
        border: '2px solid #3b82f6',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
        color: '#93c5fd',
      };
    }
    if (tile.type === 'operator') {
      return {
        background: 'linear-gradient(145deg, #4c1d95 0%, #2e1065 100%)',
        border: '2px solid #8b5cf6',
        boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
        color: '#c4b5fd',
      };
    }
    if (tile.type === 'quantumFlux') {
      return {
        background: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 100%)',
        border: '2px solid #ef4444',
        boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
        color: '#fca5a5',
      };
    }
    if (tile.type === 'target') {
      const data = tile.displayData as TargetTileData;
      if (data.isFulfilled) {
        return {
          background: 'linear-gradient(145deg, #14532d 0%, #052e16 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
          color: '#86efac',
        };
      }
      return {
        background: 'linear-gradient(145deg, #78350f 0%, #451a03 100%)',
        border: '2px solid #f59e0b',
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
        color: '#fcd34d',
      };
    }
    return {
      background: '#1a1a2e',
      border: '1px solid #333',
    };
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

  tutorialSteps: [
    {
      icon: '🔢',
      iconColor: '#3b82f6',
      title: 'Start with a Number',
      subtitle: 'FIRST STEP',
      demo: 'fixed-path',
      body: 'Tap any blue number tile to start your chain. This will be the first value in your calculation.',
    },
    {
      icon: '➕',
      iconColor: '#8b5cf6',
      title: 'Add an Operator',
      subtitle: 'NEXT STEP',
      demo: 'fixed-path',
      body: 'Tap an adjacent purple operator tile (+, -, ×, ÷) to add it to your chain. Operators must be next to your current tile.',
    },
    {
      icon: '🎯',
      iconColor: '#f59e0b',
      title: 'Hit the Target',
      subtitle: 'GOAL',
      demo: 'fixed-path',
      body: 'Continue the pattern: Number → Operator → Number → Target. When your calculation matches the target sum, you win!',
    },
    {
      icon: '⚛️',
      iconColor: '#ef4444',
      title: 'Quantum Flux',
      subtitle: 'SPECIAL TILES',
      demo: 'fixed-path',
      body: 'Red Quantum Flux tiles modify adjacent numbers! They can double, halve, add, or subtract from nearby values. Use them wisely!',
    },
  ],

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
    const { activeChain, lastTilePosition, currentCalculation } = state;

    // If tapping a tile already in chain, reset the chain
    if (activeChain.some((t) => t.id === tappedTile.id)) {
      return {
        tiles,
        valid: true,
        customState: getInitialState(),
      };
    }

    // First tile must be a number
    if (activeChain.length === 0) {
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

    // Subsequent tiles must be adjacent
    if (
      !lastTilePosition ||
      !isAdjacent(tappedTile, { ...tappedTile, x: lastTilePosition.x, y: lastTilePosition.y })
    ) {
      // Check if tapped tile is adjacent to last tile in chain
      const lastChainTile = activeChain[activeChain.length - 1];
      if (!isAdjacent(tappedTile, lastChainTile)) {
        // Not adjacent - reset chain
        return {
          tiles,
          valid: true,
          customState: getInitialState(),
        };
      }
    }

    const lastTile = activeChain[activeChain.length - 1];
    const lastIsNumber = lastTile.type === 'number';
    const lastIsOperator = lastTile.type === 'operator';

    // Validate tile type alternation
    if (lastIsNumber && tappedTile.type !== 'operator' && tappedTile.type !== 'target') {
      // After number, must be operator or target
      return {
        tiles,
        valid: true,
        customState: getInitialState(),
      };
    }

    if (lastIsOperator && tappedTile.type !== 'number') {
      // After operator, must be number
      return {
        tiles,
        valid: true,
        customState: getInitialState(),
      };
    }

    // Handle number tile
    if (tappedTile.type === 'number') {
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

    // Handle operator tile
    if (tappedTile.type === 'operator') {
      const opData = tappedTile.displayData as OperatorTileData;
      const newCalculation = currentCalculation + opData.symbol;

      return {
        tiles,
        valid: true,
        customState: {
          activeChain: [...activeChain, tappedTile],
          currentCalculation: newCalculation,
          currentValue: state.currentValue,
          lastTilePosition: { x: tappedTile.x, y: tappedTile.y },
        },
      };
    }

    // Handle target tile
    if (tappedTile.type === 'target') {
      const targetData = tappedTile.displayData as TargetTileData;
      const calculatedResult = evaluateExpression(currentCalculation);

      if (calculatedResult === targetData.targetSum) {
        // Success! Mark target as fulfilled
        const newTiles = tiles.map((t) =>
          t.id === tappedTile.id
            ? { ...t, displayData: { ...(t.displayData as TargetTileData), isFulfilled: true } }
            : t
        );

        return {
          tiles: newTiles,
          valid: true,
          customState: getInitialState(),
        };
      } else {
        // Wrong sum - reset chain
        return {
          tiles,
          valid: true,
          customState: getInitialState(),
        };
      }
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

    if (targetTiles.length === 0) {
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
};
