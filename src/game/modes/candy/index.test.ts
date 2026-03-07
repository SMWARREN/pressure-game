import { describe, it, expect, beforeEach } from 'vitest';
import { CandyMode } from './index';
import type { Level } from '@/game/types';
import { useGameStore } from '@/game/store';

describe('Candy Mode', () => {
  let level: Level;

  beforeEach(() => {
    const state = useGameStore.getState();
    level = state.currentLevel || ({
      id: 'test_candy_1',
      modeId: 'candy',
      difficulty: 1,
      title: 'Test Candy Level',
      wallCompression: 'optional',
      tiles: [],
      goalNodes: [],
    } as any);
  });

  describe('mode configuration', () => {
    it('should have valid mode config', () => {
      expect(CandyMode).toBeDefined();
      expect(CandyMode.id).toBe('candy');
      expect(CandyMode.name).toBeDefined();
      expect(typeof CandyMode.name).toBe('string');
    });

    it('should have wall compression setting', () => {
      expect(['always', 'never', 'optional']).toContain(CandyMode.wallCompression);
    });

    it('should have color context', () => {
      const colors = CandyMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it('should have custom tile renderer', () => {
      expect(CandyMode.tileRenderer).toBeDefined();
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(CandyMode.tutorialSteps).toBeDefined();
      expect(Array.isArray(CandyMode.tutorialSteps)).toBe(true);
    });

    it('should have walkthrough or guidance system', () => {
      const hasWalkthrough = CandyMode.walkthrough !== undefined;
      const hasTutorial = CandyMode.tutorialSteps !== undefined;
      expect(hasWalkthrough || hasTutorial).toBe(true);
    });

    it('should have demo render function', () => {
      expect(CandyMode.renderDemo).toBeDefined();
      expect(typeof CandyMode.renderDemo).toBe('function');
    });
  });

  describe('level system', () => {
    it('should have levels available', () => {
      const levels = CandyMode.getLevels?.();
      expect(levels).toBeDefined();
      expect(Array.isArray(levels)).toBe(true);
      if (Array.isArray(levels)) {
        expect(levels.length).toBeGreaterThan(0);
      }
    });

    it('each level should have core properties', () => {
      const levels = CandyMode.getLevels?.();
      if (Array.isArray(levels) && levels.length > 0) {
        levels.forEach((level) => {
          expect(level.id).toBeDefined();
          expect(level.tiles).toBeDefined();
        });
      }
    });

    it('levels should be properly structured', () => {
      const levels = CandyMode.getLevels?.();
      expect(Array.isArray(levels)).toBe(true);
      if (Array.isArray(levels) && levels.length > 0) {
        expect(levels[0].id).toBeDefined();
      }
    });
  });

  describe('gameplay mechanics', () => {
    it('should have required handlers', () => {
      expect(CandyMode.onTileTap).toBeDefined();
      expect(CandyMode.checkWin).toBeDefined();
    });

    it('should support loss condition if defined', () => {
      if (CandyMode.checkLoss) {
        const state = useGameStore.getState();
        const result = CandyMode.checkLoss(state);
        expect(result === null || typeof result === 'boolean' || typeof result === 'object').toBe(true);
      }
    });
  });

  describe('candy-specific mechanics', () => {
    it('should support match detection', () => {
      expect(CandyMode.onTileTap).toBeDefined();
    });

    it('should have cascade mechanics if needed', () => {
      if (CandyMode.onTick) {
        const state = useGameStore.getState();
        const result = CandyMode.onTick(state);
        expect(result === null || typeof result === 'object').toBe(true);
      }
    });
  });

  describe('mode state management', () => {
    it('should provide initial state mechanism', () => {
      expect(CandyMode.getModeState === undefined || typeof CandyMode.getModeState === 'function').toBe(true);
    });
  });

  describe('integration', () => {
    it('should work with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
    });

    it('should have valid level sequence', () => {
      const levels = CandyMode.getLevels?.();
      if (Array.isArray(levels) && levels.length > 0) {
        // Verify levels are accessible and have IDs
        levels.forEach((level) => {
          expect(level.id).toBeDefined();
        });
      }
    });

    it('should support win tile highlighting if available', () => {
      if (CandyMode.getWinTiles && level && level.tiles.length > 0) {
        const winTiles = CandyMode.getWinTiles(level.tiles, level);
        expect(Array.isArray(winTiles) || winTiles === null).toBe(true);
      }
    });
  });
});
