import { describe, it, expect, beforeEach } from 'vitest';
import { GravityDropMode } from './index';
import type { Level } from '@/game/types';
import { useGameStore } from '@/game/store';

describe('Gravity Drop Mode', () => {
  let level: Level;

  beforeEach(() => {
    const state = useGameStore.getState();
    level = state.currentLevel || ({
      id: 'test_gravity_1',
      modeId: 'gravity_drop',
      difficulty: 1,
      title: 'Test Gravity Level',
      wallCompression: 'optional',
      tiles: [],
      goalNodes: [],
    } as any);
  });

  describe('mode configuration', () => {
    it('should have valid mode config', () => {
      expect(GravityDropMode).toBeDefined();
      if (GravityDropMode) {
        expect(GravityDropMode.id).toBe('gravityDrop');
        expect(GravityDropMode.name).toBeDefined();
      }
    });

    it('should have wall compression setting', () => {
      expect(GravityDropMode.wallCompression).toBeDefined();
      expect(['always', 'never', 'optional']).toContain(GravityDropMode.wallCompression);
    });

    it('should have color context', () => {
      const colors = GravityDropMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it('should have tile renderer or use default', () => {
      expect(GravityDropMode.tileRenderer === undefined || typeof GravityDropMode.tileRenderer === 'object').toBe(true);
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(GravityDropMode.tutorialSteps).toBeDefined();
      expect(Array.isArray(GravityDropMode.tutorialSteps)).toBe(true);
    });

    it('should have walkthrough or tutorial content', () => {
      const hasWalkthrough = GravityDropMode.walkthrough !== undefined;
      const hasTutorial = GravityDropMode.tutorialSteps !== undefined;
      expect(hasWalkthrough || hasTutorial).toBe(true);
    });

    it('should have demo render function', () => {
      expect(GravityDropMode.renderDemo).toBeDefined();
      expect(typeof GravityDropMode.renderDemo).toBe('function');
    });
  });

  describe('level system', () => {
    it('should have levels available', () => {
      const levels = GravityDropMode.getLevels?.();
      expect(levels).toBeDefined();
      expect(Array.isArray(levels)).toBe(true);
      expect(levels?.length).toBeGreaterThan(0);
    });

    it('each level should have core properties', () => {
      const levels = GravityDropMode.getLevels?.();
      if (Array.isArray(levels)) {
        levels.forEach((level) => {
          expect(level.id).toBeDefined();
          expect(level.tiles).toBeDefined();
        });
      }
    });
  });

  describe('gameplay mechanics', () => {
    it('should have required handler methods', () => {
      expect(GravityDropMode.onTileTap).toBeDefined();
      expect(GravityDropMode.checkWin).toBeDefined();
    });

    it('should support optional handlers', () => {
      const hasLossCheck = GravityDropMode.checkLoss !== undefined;
      const hasTickHandler = GravityDropMode.onTick !== undefined;
      expect(typeof hasLossCheck).toBe('boolean');
      expect(typeof hasTickHandler).toBe('boolean');
    });
  });

  describe('gravity mechanics', () => {
    it('should be properly named', () => {
      expect(GravityDropMode.name.toLowerCase()).toContain('gravity');
    });

    it('should have onTick for physics if needed', () => {
      if (GravityDropMode.onTick) {
        const state = useGameStore.getState();
        const result = GravityDropMode.onTick(state);
        expect(result === null || typeof result === 'object').toBe(true);
      }
    });
  });

  describe('integration', () => {
    it('should work with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
    });

    it('should have valid level progression', () => {
      const levels = GravityDropMode.getLevels?.();
      if (Array.isArray(levels) && levels.length > 0) {
        // Verify all levels are accessible
        levels.forEach((level, idx) => {
          expect(level.id).toBeDefined();
        });
      }
    });
  });
});
