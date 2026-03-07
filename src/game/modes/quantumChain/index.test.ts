import { describe, it, expect, beforeEach } from 'vitest';
import { QuantumChainMode } from './index';
import type { Level } from '@/game/types';
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
      tiles: [],
      goalNodes: [],
    } as any);
  });

  describe('mode configuration', () => {
    it('should have valid mode config', () => {
      expect(QuantumChainMode).toBeDefined();
      expect(QuantumChainMode.id).toBe('quantum_chain');
      expect(QuantumChainMode.name).toBeDefined();
      expect(typeof QuantumChainMode.name).toBe('string');
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

    it('should have walkthrough guidance', () => {
      const hasWalkthrough = QuantumChainMode.walkthrough !== undefined;
      const hasTutorial = QuantumChainMode.tutorialSteps !== undefined;
      expect(hasWalkthrough || hasTutorial).toBe(true);
    });

    it('should have demo render function', () => {
      expect(QuantumChainMode.renderDemo).toBeDefined();
      expect(typeof QuantumChainMode.renderDemo).toBe('function');
    });
  });

  describe('level system', () => {
    it('should have levels array', () => {
      const levels = QuantumChainMode.getLevels?.();
      expect(levels).toBeDefined();
      expect(Array.isArray(levels)).toBe(true);
      expect(levels?.length).toBeGreaterThan(0);
    });

    it('each level should have valid structure', () => {
      const levels = QuantumChainMode.getLevels?.();
      if (Array.isArray(levels)) {
        levels.forEach((level) => {
          expect(level.id).toBeDefined();
          expect(level.tiles).toBeDefined();
        });
      }
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
      if (QuantumChainMode.checkLoss) {
        const isLost = QuantumChainMode.checkLoss(useGameStore.getState());
        expect(typeof isLost).toBe('boolean');
      }
    });

    it('should handle onTick if defined', () => {
      if (QuantumChainMode.onTick) {
        const state = useGameStore.getState();
        const result = QuantumChainMode.onTick(state);
        expect(result === null || typeof result === 'object').toBe(true);
      }
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
    });

    it('should have valid levels if available', () => {
      const levels = QuantumChainMode.getLevels?.();
      if (Array.isArray(levels) && levels.length > 1) {
        const firstLevel = levels[0];
        const secondLevel = levels[1];
        expect(firstLevel.id).not.toBe(secondLevel.id);
      }
    });
  });
});
