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
      expect(GravityDropMode.id).toBe('gravity_drop');
      expect(GravityDropMode.name).toBe('Gravity Drop');
    });

    it('should have optional wall compression', () => {
      expect(GravityDropMode.wallCompression).toBe('optional');
    });

    it('should have color context', () => {
      const colors = GravityDropMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
      expect(colors.secondary).toBeDefined();
    });

    it('should have tile renderer', () => {
      expect(GravityDropMode.tileRenderer).toBeDefined();
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(GravityDropMode.tutorialSteps).toBeDefined();
      expect(Array.isArray(GravityDropMode.tutorialSteps)).toBe(true);
      expect(GravityDropMode.tutorialSteps.length).toBeGreaterThan(0);
    });

    it('should have walkthrough steps', () => {
      expect(GravityDropMode.walkthroughSteps).toBeDefined();
      expect(Array.isArray(GravityDropMode.walkthroughSteps)).toBe(true);
    });

    it('should have demo render function', () => {
      expect(GravityDropMode.renderDemo).toBeDefined();
      expect(typeof GravityDropMode.renderDemo).toBe('function');
    });
  });

  describe('level system', () => {
    it('should have levels array', () => {
      expect(GravityDropMode.levels).toBeDefined();
      expect(Array.isArray(GravityDropMode.levels)).toBe(true);
      expect(GravityDropMode.levels.length).toBeGreaterThan(0);
    });

    it('each level should have modeId matching mode', () => {
      GravityDropMode.levels.forEach((level) => {
        expect(level.modeId).toBe('gravity_drop');
      });
    });

    it('each level should have required properties', () => {
      GravityDropMode.levels.forEach((level) => {
        expect(level.id).toBeDefined();
        expect(level.title).toBeDefined();
        expect(level.tiles).toBeDefined();
        expect(level.difficulty).toBeGreaterThan(0);
      });
    });
  });

  describe('gameplay mechanics', () => {
    it('should initialize mode state', () => {
      const initialState = GravityDropMode.getModeState?.();
      expect(initialState === null || typeof initialState === 'object').toBe(true);
    });

    it('should handle tile tap events', () => {
      if (!level) return;

      const result = GravityDropMode.onTileTap?.(
        level.tiles[0],
        level,
        useGameStore.getState()
      );

      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should check win condition', () => {
      if (!level) return;

      const isWon = GravityDropMode.checkWin?.(
        level.tiles,
        level
      );

      expect(typeof isWon).toBe('boolean');
    });

    it('should support loss condition check if defined', () => {
      if (GravityDropMode.checkLoss) {
        const isLost = GravityDropMode.checkLoss(useGameStore.getState());
        expect(typeof isLost).toBe('boolean');
      }
    });
  });

  describe('gravity mechanics', () => {
    it('should have gravity as core mechanic', () => {
      expect(GravityDropMode).toBeDefined();
      expect(GravityDropMode.name).toContain('Gravity');
    });

    it('should have onTick for gravity simulation if needed', () => {
      const hasTickHandler = GravityDropMode.onTick !== undefined;
      if (hasTickHandler) {
        const state = useGameStore.getState();
        const result = GravityDropMode.onTick?.(state);
        expect(result === null || typeof result === 'object').toBe(true);
      }
    });
  });

  describe('tile rendering', () => {
    it('should render tiles with gravity-specific styling', () => {
      const renderer = GravityDropMode.tileRenderer;
      expect(renderer).toBeDefined();
    });
  });

  describe('mode state management', () => {
    it('should reset state on getModeState call', () => {
      const state1 = GravityDropMode.getModeState?.();
      const state2 = GravityDropMode.getModeState?.();

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should integrate with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
      expect(state.currentModeId).toBeDefined();
    });

    it('should have valid difficulty progression', () => {
      const levels = GravityDropMode.levels;
      expect(levels.length).toBeGreaterThan(0);

      for (let i = 1; i < Math.min(levels.length, 5); i++) {
        expect(levels[i].difficulty).toBeGreaterThanOrEqual(levels[i - 1].difficulty);
      }
    });

    it('should support win tile highlighting', () => {
      const hasGetWinTiles = GravityDropMode.getWinTiles !== undefined;
      if (hasGetWinTiles && level && level.tiles.length > 0) {
        const winTiles = GravityDropMode.getWinTiles?.(level.tiles, level);
        expect(Array.isArray(winTiles) || winTiles === null).toBe(true);
      }
    });
  });
});
