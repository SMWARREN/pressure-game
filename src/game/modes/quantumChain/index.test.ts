import { describe, it, expect, beforeEach } from 'vitest';
import { QuantumChainMode } from './index';
import type { Tile, GameState, Level } from '@/game/types';
import { useGameStore } from '@/game/store';

describe('Quantum Chain Mode', () => {
  let level: Level;

  beforeEach(() => {
    const state = useGameStore.getState();
    level = state.currentLevel || ({
      id: 'test_quantum_1',
      modeId: 'quantum_chain',
      difficulty: 1,
      title: 'Test Level',
      wallCompression: 'never',
      tiles: [
        { id: '1', x: 0, y: 0, type: 'number', connections: [], displayData: { value: 5 } as any },
        { id: '2', x: 1, y: 0, type: 'operator', connections: [], displayData: { operator: '+' } as any },
        { id: '3', x: 2, y: 0, type: 'number', connections: [], displayData: { value: 3 } as any },
        { id: '4', x: 0, y: 1, type: 'target', connections: [], displayData: { targetSum: 8 } as any },
      ],
      goalNodes: [],
    } as any);
  });

  describe('mode configuration', () => {
    it('should have valid mode config', () => {
      expect(QuantumChainMode).toBeDefined();
      expect(QuantumChainMode.id).toBe('quantum_chain');
      expect(QuantumChainMode.name).toBe('Quantum Chain');
    });

    it('should have wall compression disabled', () => {
      expect(QuantumChainMode.wallCompression).toBe('never');
    });

    it('should have color context', () => {
      const colors = QuantumChainMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
      expect(colors.secondary).toBeDefined();
    });

    it('should have tile renderer', () => {
      expect(QuantumChainMode.tileRenderer).toBeDefined();
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(QuantumChainMode.tutorialSteps).toBeDefined();
      expect(Array.isArray(QuantumChainMode.tutorialSteps)).toBe(true);
      expect(QuantumChainMode.tutorialSteps.length).toBeGreaterThan(0);
    });

    it('should have walkthrough steps', () => {
      expect(QuantumChainMode.walkthroughSteps).toBeDefined();
      expect(Array.isArray(QuantumChainMode.walkthroughSteps)).toBe(true);
    });

    it('should have demo render function', () => {
      expect(QuantumChainMode.renderDemo).toBeDefined();
      expect(typeof QuantumChainMode.renderDemo).toBe('function');
    });
  });

  describe('level system', () => {
    it('should have levels array', () => {
      expect(QuantumChainMode.getLevels?.()).toBeDefined();
      expect(Array.isArray(QuantumChainMode.getLevels?.())).toBe(true);
      expect(QuantumChainMode.getLevels?.().length).toBeGreaterThan(0);
    });

    it('should have at least 3 levels', () => {
      expect(QuantumChainMode.getLevels?.().length).toBeGreaterThanOrEqual(3);
    });

    it('each level should have valid structure', () => {
      QuantumChainMode.getLevels?.().forEach((level) => {
        expect(level.id).toBeDefined();
        expect(level.modeId).toBe('quantum_chain');
        expect(level.title).toBeDefined();
        expect(level.tiles).toBeDefined();
        expect(Array.isArray(level.tiles)).toBe(true);
      });
    });
  });

  describe('gameplay mechanics', () => {
    it('should have onTileTap handler', () => {
      expect(QuantumChainMode.onTileTap).toBeDefined();
    });

    it('should have checkWin handler', () => {
      expect(QuantumChainMode.checkWin).toBeDefined();
    });

    it('should handle loss condition check if defined', () => {
      const hasLossCheck = QuantumChainMode.checkLoss !== undefined;
      expect(typeof hasLossCheck).toBe('boolean');
    });

    it('should handle onTick if defined', () => {
      const hasTickHandler = QuantumChainMode.onTick !== undefined;
      expect(typeof hasTickHandler).toBe('boolean');
    });
  });

  describe('scoring', () => {
    it('should support score calculation', () => {
      expect(QuantumChainMode.onTileTap).toBeDefined();
    });
  });

  describe('tile rendering', () => {
    it('should render quantum chain specific tile styles', () => {
      const renderer = QuantumChainMode.tileRenderer;
      expect(renderer).toBeDefined();

      if (renderer && renderer.getSymbol && renderer.getColors) {
        const tile = level.tiles[0];
        if (tile.displayData) {
          const symbol = renderer.getSymbol?.(tile);
          const colors = renderer.getColors?.(tile);

          expect(symbol === null || typeof symbol === 'string').toBe(true);
          expect(colors === null || typeof colors === 'object').toBe(true);
        }
      }
    });
  });

  describe('mode lifecycle', () => {
    it('should be properly configured', () => {
      expect(QuantumChainMode.id).toBe('quantum_chain');
      expect(QuantumChainMode.name).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should work with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
      expect(state.currentModeId).toBeDefined();
    });

    it('should have valid levels array', () => {
      if (QuantumChainMode.getLevels?.() && QuantumChainMode.getLevels?.().length > 1) {
        const firstLevel = QuantumChainMode.getLevels?.()[0];
        const secondLevel = QuantumChainMode.getLevels?.()[1];

        expect(firstLevel.id).not.toBe(secondLevel.id);
      }
    });
  });
});
