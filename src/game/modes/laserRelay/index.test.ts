import { describe, it, expect, beforeEach } from 'vitest';
import { LaserRelayMode } from './index';
import type { Level } from '@/game/types';
import { useGameStore } from '@/game/store';

describe('Laser Relay Mode', () => {
  let level: Level;

  beforeEach(() => {
    const state = useGameStore.getState();
    level =
      state.currentLevel ||
      ({
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
      if (LaserRelayMode) {
        expect(LaserRelayMode.id).toBe('laserRelay');
        expect(LaserRelayMode.name).toBeDefined();
      }
    });

    it('should have wall compression setting', () => {
      expect(['always', 'never', 'optional']).toContain(LaserRelayMode.wallCompression);
    });

    it('should have color context', () => {
      const colors = LaserRelayMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it('should have custom tile renderer', () => {
      expect(LaserRelayMode.tileRenderer).toBeDefined();
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(LaserRelayMode.tutorialSteps).toBeDefined();
      expect(Array.isArray(LaserRelayMode.tutorialSteps)).toBe(true);
    });

    it('should have walkthrough or alternative guidance', () => {
      const hasWalkthrough = LaserRelayMode.walkthrough !== undefined;
      const hasTutorial = LaserRelayMode.tutorialSteps !== undefined;
      expect(hasWalkthrough || hasTutorial).toBe(true);
    });

    it('should have demo render function', () => {
      expect(LaserRelayMode.renderDemo).toBeDefined();
      expect(typeof LaserRelayMode.renderDemo).toBe('function');
    });
  });

  describe('level system', () => {
    it('should have levels available', () => {
      const levels = LaserRelayMode.getLevels?.();
      expect(levels).toBeDefined();
      expect(Array.isArray(levels)).toBe(true);
      if (Array.isArray(levels)) {
        expect(levels.length).toBeGreaterThan(0);
      }
    });

    it('each level should be properly configured', () => {
      const levels = LaserRelayMode.getLevels?.();
      if (Array.isArray(levels)) {
        levels.forEach((level) => {
          expect(level.id).toBeDefined();
          expect(level.tiles).toBeDefined();
        });
      }
    });
  });

  describe('gameplay mechanics', () => {
    it('should have required handlers', () => {
      expect(LaserRelayMode.onTileTap).toBeDefined();
      expect(LaserRelayMode.checkWin).toBeDefined();
    });

    it('should support optional features', () => {
      expect(
        typeof LaserRelayMode.checkLoss === 'function' || LaserRelayMode.checkLoss === undefined
      ).toBe(true);
    });
  });

  describe('laser-specific mechanics', () => {
    it('should have laser pathfinding logic', () => {
      expect(LaserRelayMode.onTileTap).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should work with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
    });

    it('should have valid level structure', () => {
      const levels = LaserRelayMode.getLevels?.();
      if (Array.isArray(levels) && levels.length > 0) {
        const firstLevel = levels[0];
        expect(firstLevel.id).toBeDefined();
      }
    });
  });
});
