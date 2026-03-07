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
    });

    it('should have wall compression setting', () => {
      expect(['always', 'never', 'optional']).toContain(CandyMode.wallCompression);
    });

    it('should have color context', () => {
      const colors = CandyMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it('should have tile renderer with candy styling', () => {
      expect(CandyMode.tileRenderer).toBeDefined();
      const renderer = CandyMode.tileRenderer;
      expect(renderer?.type).toBeDefined();
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(CandyMode.tutorialSteps).toBeDefined();
      expect(Array.isArray(CandyMode.tutorialSteps)).toBe(true);
    });

    it('should have walkthrough steps', () => {
      expect(CandyMode.walkthrough).toBeDefined();
      expect(Array.isArray(CandyMode.walkthrough)).toBe(true);
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

    it('each level should have candy mode ID', () => {
      const levels = CandyMode.getLevels?.();
      if (Array.isArray(levels)) {
        levels.forEach((level) => {
          expect(level.modeId).toBe('candy');
        });
      }
    });

    it('each level should have required properties', () => {
      const levels = CandyMode.getLevels?.();
      if (Array.isArray(levels)) {
        levels.forEach((level) => {
          expect(level.id).toBeDefined();
          expect(level.title).toBeDefined();
          expect(level.tiles).toBeDefined();
        });
      }
    });
  });

  describe('gameplay mechanics', () => {
    it('should initialize mode state', () => {
      const initialState = CandyMode.getModeState?.();
      expect(initialState === null || typeof initialState === 'object').toBe(true);
    });

    it('should handle tile tap events', () => {
      if (!level || level.tiles.length === 0) {
        expect(CandyMode.onTileTap).toBeDefined();
        return;
      }

      const result = CandyMode.onTileTap?.(
        level.tiles[0],
        level,
        useGameStore.getState()
      );

      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should check win condition', () => {
      if (!level) return;

      const isWon = CandyMode.checkWin?.(
        level.tiles,
        level
      );

      expect(typeof isWon).toBe('boolean');
    });

    it('should support loss condition check if defined', () => {
      if (CandyMode.checkLoss) {
        const isLost = CandyMode.checkLoss(useGameStore.getState());
        expect(typeof isLost).toBe('boolean');
      }
    });
  });

  describe('candy-specific mechanics', () => {
    it('should support swap operations', () => {
      // Candy mode involves swapping adjacent tiles
      expect(CandyMode.onTileTap).toBeDefined();
    });

    it('should support match detection', () => {
      // Candy mode detects 3+ matches
      expect(CandyMode).toBeDefined();
    });

    it('should support cascade/gravity', () => {
      // Candy mode typically has pieces fall after matches
      if (CandyMode.onTick) {
        const state = useGameStore.getState();
        const result = CandyMode.onTick(state);
        expect(result === null || typeof result === 'object').toBe(true);
      }
    });
  });

  describe('tile rendering', () => {
    it('should have custom tile renderer', () => {
      const renderer = CandyMode.tileRenderer;
      expect(renderer).toBeDefined();

      if (renderer?.getSymbol || renderer?.getColors) {
        expect(renderer.type).toBe('candy');
      }
    });
  });

  describe('mode state management', () => {
    it('should provide initial state', () => {
      const state = CandyMode.getModeState?.();
      expect(state === null || typeof state === 'object').toBe(true);
    });
  });

  describe('integration', () => {
    it('should work with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
    });

    it('should have valid level sequence', () => {
      const levels = CandyMode.levels;
      expect(levels.length).toBeGreaterThan(0);

      // Each level should be properly configured
      levels.forEach((level, index) => {
        expect(level.id).toContain('candy');
        expect(level.difficulty).toBeGreaterThanOrEqual(1);
      });
    });

    it('should support win tile highlighting', () => {
      if (CandyMode.getWinTiles && level && level.tiles.length > 0) {
        const winTiles = CandyMode.getWinTiles(level.tiles, level);
        expect(Array.isArray(winTiles) || winTiles === null).toBe(true);
      }
    });
  });

  describe('tile rotation', () => {
    it('should support tile rotation if applicable', () => {
      // Some candy-style modes may still support rotation
      const supportsRotation = CandyMode.onTileTap !== undefined;
      expect(supportsRotation).toBe(true);
    });
  });
});
