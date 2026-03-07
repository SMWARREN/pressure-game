import { describe, it, expect } from 'vitest';
import { useGameStore } from './store';

describe('Game Store', () => {
  describe('Store Structure', () => {
    it('should have a valid game state', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('should have status property', () => {
      const state = useGameStore.getState();
      expect(state.status).toBeDefined();
      expect(['tutorial', 'menu', 'idle', 'playing', 'won', 'lost']).toContain(state.status);
    });

    it('should have moves counter', () => {
      const state = useGameStore.getState();
      expect(typeof state.moves).toBe('number');
      expect(state.moves).toBeGreaterThanOrEqual(0);
    });

    it('should have tiles array', () => {
      const state = useGameStore.getState();
      expect(Array.isArray(state.tiles)).toBe(true);
    });

    it('should have current mode', () => {
      const state = useGameStore.getState();
      expect(state.currentModeId).toBeDefined();
      expect(typeof state.currentModeId).toBe('string');
    });

    it('should have mode state', () => {
      const state = useGameStore.getState();
      expect(state.modeState).toBeDefined();
    });
  });

  describe('Game State Validity', () => {
    it('should maintain state consistency', () => {
      const state1 = useGameStore.getState();
      const state2 = useGameStore.getState();
      expect(state1).toBe(state2); // Same reference
    });

    it('should have valid tile structure', () => {
      const state = useGameStore.getState();
      for (const tile of state.tiles) {
        expect(tile.id).toBeDefined();
        expect(typeof tile.x).toBe('number');
        expect(typeof tile.y).toBe('number');
        expect(Array.isArray(tile.connections)).toBe(true);
      }
    });
  });
});
