import { describe, it, expect } from 'vitest';
import { getSolution, verifyLevel, generateLevel } from './levels';
import { CLASSIC_LEVELS } from './modes/classic/levels';

describe('Game Levels', () => {
  describe('getSolution', () => {
    it('should compute solution for classic level 1', () => {
      const level = CLASSIC_LEVELS[0];
      const solution = getSolution(level);
      expect(solution).toBeDefined();
      expect(Array.isArray(solution)).toBe(true);
    });

    it('should cache solution on second call', () => {
      const level = CLASSIC_LEVELS[0];
      const solution1 = getSolution(level);
      const solution2 = getSolution(level);
      expect(solution1).toBe(solution2); // Same reference due to caching
    });

    it('should handle levels with no solution', () => {
      const unsolvableLevel = {
        id: 999,
        name: 'Unsolvable',
        world: 1,
        gridSize: 3,
        tiles: [
          {
            id: 't1',
            type: 'node' as const,
            x: 0,
            y: 0,
            connections: ['up' as const],
            canRotate: false,
            isGoalNode: true,
          },
          {
            id: 't2',
            type: 'node' as const,
            x: 2,
            y: 2,
            connections: ['down' as const],
            canRotate: false,
            isGoalNode: true,
          },
        ],
        goalNodes: [
          { x: 0, y: 0 },
          { x: 2, y: 2 },
        ],
        maxMoves: 1,
        compressionDelay: 0,
        compressionEnabled: false,
        targetScore: 0,
      };
      const solution = getSolution(unsolvableLevel);
      expect(solution).toBeNull();
    });
  });

  describe('verifyLevel', () => {
    it('should verify solvable level', () => {
      const level = CLASSIC_LEVELS[0];
      const result = verifyLevel(level);
      expect(result).toBeDefined();
      expect(result.solvable).toBe(true);
    });

    it('should return solution moves for solvable level', () => {
      const level = CLASSIC_LEVELS[0];
      const result = verifyLevel(level);
      expect(result.minMoves).toBeGreaterThanOrEqual(0);
      expect(typeof result.minMoves).toBe('number');
    });
  });

  describe('generateLevel', () => {
    it('should generate a level with correct structure', () => {
      const level = generateLevel({ gridSize: 4, nodeCount: 2, difficulty: 'medium' });
      expect(level).toBeDefined();
      expect(level.gridSize).toBe(4);
      expect(Array.isArray(level.tiles)).toBe(true);
      expect(level.tiles.length).toBeGreaterThan(0);
    });

    it('should create wall tiles for grid borders', () => {
      const level = generateLevel({ gridSize: 4, nodeCount: 2, difficulty: 'easy' });
      const wallTiles = level.tiles.filter((t) => t.type === 'wall');
      expect(wallTiles.length).toBeGreaterThan(0);
    });

    it('should include at least 2 goal nodes', () => {
      const level = generateLevel({ gridSize: 5, nodeCount: 2, difficulty: 'hard' });
      const goalNodes = level.tiles.filter((t) => t.isGoalNode);
      expect(goalNodes.length).toBeGreaterThanOrEqual(2);
    });

    it('should have valid grid coordinates', () => {
      const level = generateLevel({ gridSize: 4, nodeCount: 2, difficulty: 'medium' });
      for (const tile of level.tiles) {
        expect(tile.x).toBeGreaterThanOrEqual(0);
        expect(tile.x).toBeLessThan(level.gridSize);
        expect(tile.y).toBeGreaterThanOrEqual(0);
        expect(tile.y).toBeLessThan(level.gridSize);
      }
    });

    it('should be solvable', () => {
      const level = generateLevel({ gridSize: 4, nodeCount: 2, difficulty: 'easy' });
      const result = verifyLevel(level);
      expect(result.solvable).toBe(true);
    });
  });

  describe('Level properties', () => {
    it('all classic levels should be solvable', () => {
      for (const level of CLASSIC_LEVELS) {
        const result = verifyLevel(level);
        expect(result.solvable).toBe(true);
      }
    });

    it('all classic levels should have goal nodes', () => {
      for (const level of CLASSIC_LEVELS) {
        expect(level.goalNodes.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('all tiles should have valid coordinates', () => {
      for (const level of CLASSIC_LEVELS) {
        for (const tile of level.tiles) {
          expect(tile.x).toBeGreaterThanOrEqual(0);
          expect(tile.x).toBeLessThan(level.gridSize);
          expect(tile.y).toBeGreaterThanOrEqual(0);
          expect(tile.y).toBeLessThan(level.gridSize);
        }
      }
    });
  });
});
