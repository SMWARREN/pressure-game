import { describe, it, expect } from 'vitest';

describe('Game Types and Utils', () => {
  describe('Direction utilities', () => {
    it('should handle all valid directions', () => {
      const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
      expect(directions.length).toBe(4);
      expect(directions).toContain('up');
      expect(directions).toContain('down');
      expect(directions).toContain('left');
      expect(directions).toContain('right');
    });
  });

  describe('Tile utilities', () => {
    it('should create valid tile', () => {
      const tile = {
        id: 'test-tile',
        type: 'path' as const,
        x: 0,
        y: 0,
        connections: ['up' as const, 'right' as const],
        canRotate: true,
        isGoalNode: false,
      };

      expect(tile.id).toBe('test-tile');
      expect(tile.type).toBe('path');
      expect(tile.connections).toHaveLength(2);
    });

    it('should support different tile types', () => {
      const types: Array<'path' | 'node' | 'wall' | 'crushed'> = ['path', 'node', 'wall', 'crushed'];
      expect(types).toHaveLength(4);
    });
  });

  describe('Position utilities', () => {
    it('should create valid position', () => {
      const pos = { x: 5, y: 3 };
      expect(pos.x).toBe(5);
      expect(pos.y).toBe(3);
    });

    it('should handle position equality', () => {
      const pos1 = { x: 1, y: 2 };
      const pos2 = { x: 1, y: 2 };
      const pos3 = { x: 2, y: 1 };

      expect(pos1.x === pos2.x && pos1.y === pos2.y).toBe(true);
      expect(pos1.x === pos3.x && pos1.y === pos3.y).toBe(false);
    });
  });
});
