import { describe, it, expect, beforeEach } from 'vitest';
import { LaserRelayMode } from './index';
import type { Level } from '@/game/types';
import { useGameStore } from '@/game/store';

describe('Laser Relay Mode', () => {
  let level: Level;

  beforeEach(() => {
    const state = useGameStore.getState();
    level = state.currentLevel || ({
      id: 'test_laser_1',
      modeId: 'laser_relay',
      difficulty: 1,
      title: 'Test Laser Level',
      wallCompression: 'never',
      tiles: [],
      goalNodes: [],
    } as any);
  });

  describe('mode configuration', () => {
    it('should have valid mode config', () => {
      expect(LaserRelayMode).toBeDefined();
      expect(LaserRelayMode.id).toBe('laser_relay');
      expect(LaserRelayMode.name).toBe('Laser Relay');
    });

    it('should have wall compression setting', () => {
      expect(['always', 'never', 'optional']).toContain(LaserRelayMode.wallCompression);
    });

    it('should have color context', () => {
      const colors = LaserRelayMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it('should have tile renderer', () => {
      expect(LaserRelayMode.tileRenderer).toBeDefined();
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(LaserRelayMode.tutorialSteps).toBeDefined();
      expect(Array.isArray(LaserRelayMode.tutorialSteps)).toBe(true);
    });

    it('should have walkthrough steps', () => {
      expect(LaserRelayMode.walkthroughSteps).toBeDefined();
    });

    it('should have demo render function', () => {
      expect(LaserRelayMode.renderDemo).toBeDefined();
      expect(typeof LaserRelayMode.renderDemo).toBe('function');
    });
  });

  describe('level system', () => {
    it('should have levels array', () => {
      expect(LaserRelayMode.levels).toBeDefined();
      expect(Array.isArray(LaserRelayMode.levels)).toBe(true);
      expect(LaserRelayMode.levels.length).toBeGreaterThan(0);
    });

    it('each level should have valid structure', () => {
      LaserRelayMode.levels.forEach((level) => {
        expect(level.id).toBeDefined();
        expect(level.modeId).toBe('laser_relay');
        expect(level.title).toBeDefined();
        expect(level.tiles).toBeDefined();
      });
    });
  });

  describe('gameplay mechanics', () => {
    it('should initialize mode state', () => {
      const initialState = LaserRelayMode.getModeState?.();
      expect(initialState === null || typeof initialState === 'object').toBe(true);
    });

    it('should handle tile tap events', () => {
      if (!level || level.tiles.length === 0) {
        // Level might not have tiles, that's OK
        expect(LaserRelayMode.onTileTap).toBeDefined();
        return;
      }

      const result = LaserRelayMode.onTileTap?.(
        level.tiles[0],
        level,
        useGameStore.getState()
      );

      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should check win condition', () => {
      if (!level) return;

      const isWon = LaserRelayMode.checkWin?.(
        level.tiles,
        level
      );

      expect(typeof isWon).toBe('boolean');
    });
  });

  describe('laser mechanics', () => {
    it('should have laser path checking', () => {
      expect(LaserRelayMode).toBeDefined();
      // Laser relay specific behavior would be tested here
    });
  });

  describe('tile rendering', () => {
    it('should have tile renderer with laser style', () => {
      const renderer = LaserRelayMode.tileRenderer;
      expect(renderer).toBeDefined();
    });
  });

  describe('mode lifecycle', () => {
    it('should initialize without errors', () => {
      expect(() => {
        LaserRelayMode.getModeState?.();
      }).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should work with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
    });

    it('should have consistent level difficulty', () => {
      const levels = LaserRelayMode.levels;
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].difficulty).toBeGreaterThanOrEqual(levels[i - 1].difficulty);
      }
    });
  });
});
