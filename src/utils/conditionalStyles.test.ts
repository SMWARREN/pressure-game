import { describe, it, expect } from 'vitest';
import {
  selectByCondition,
  getStateColor,
  pickRandom,
  clamp,
  coalesce,
  isNotEmpty,
  isEmpty,
} from './conditionalStyles';

describe('conditionalStyles utilities', () => {
  describe('selectByCondition', () => {
    it('should return first matching value', () => {
      const result = selectByCondition(
        [true, 'first'],
        [true, 'second'],
        [true, 'third']
      );
      expect(result).toBe('first');
    });

    it('should return second value when first condition is false', () => {
      const result = selectByCondition(
        [false, 'first'],
        [true, 'second'],
        [true, 'third']
      );
      expect(result).toBe('second');
    });

    it('should return fallback when no conditions match', () => {
      const result = selectByCondition(
        [false, 'first'],
        [false, 'second'],
        [true, 'fallback']
      );
      expect(result).toBe('fallback');
    });

    it('should handle undefined conditions', () => {
      const result = selectByCondition(
        [undefined, 'first'],
        [true, 'second'],
        [true, 'fallback']
      );
      expect(result).toBe('second');
    });

    it('should work with numeric values', () => {
      const result = selectByCondition(
        [false, 1],
        [true, 2],
        [true, 3]
      );
      expect(result).toBe(2);
    });

    it('should work with object values', () => {
      const obj1 = { color: 'red' };
      const obj2 = { color: 'blue' };
      const result = selectByCondition(
        [false, obj1],
        [true, obj2]
      );
      expect(result).toBe(obj2);
    });

    it('should return last option as fallback if no conditions match', () => {
      const result = selectByCondition(
        [false, 'a'],
        [false, 'b'],
        [false, 'c']
      );
      expect(result).toBe('c');
    });

    it('should handle single option', () => {
      const result = selectByCondition([true, 'only']);
      expect(result).toBe('only');
    });
  });

  describe('getStateColor', () => {
    it('should return hint color when isHint is true', () => {
      const result = getStateColor(true, false, '#60a5fa', '#ef4444', '#3b82f6');
      expect(result).toBe('#60a5fa');
    });

    it('should return danger color when inDanger is true and isHint is false', () => {
      const result = getStateColor(false, true, '#60a5fa', '#ef4444', '#3b82f6');
      expect(result).toBe('#ef4444');
    });

    it('should return normal color when both flags are false', () => {
      const result = getStateColor(false, false, '#60a5fa', '#ef4444', '#3b82f6');
      expect(result).toBe('#3b82f6');
    });

    it('should prioritize hint over danger', () => {
      const result = getStateColor(true, true, '#60a5fa', '#ef4444', '#3b82f6');
      expect(result).toBe('#60a5fa');
    });

    it('should handle any color strings', () => {
      const result = getStateColor(true, false, 'red', 'orange', 'blue');
      expect(result).toBe('red');
    });
  });

  describe('pickRandom', () => {
    it('should return an element from the array', () => {
      const array = ['a', 'b', 'c'];
      const result = pickRandom(array);
      expect(array).toContain(result);
    });

    it('should return the only element for single-item array', () => {
      const result = pickRandom(['only']);
      expect(result).toBe('only');
    });

    it('should work with numbers', () => {
      const array = [1, 2, 3, 4, 5];
      const result = pickRandom(array);
      expect(array).toContain(result);
    });

    it('should work with objects', () => {
      const objs = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = pickRandom(objs);
      expect(objs).toContain(result);
    });

    it('should handle larger arrays', () => {
      const array = Array.from({ length: 100 }, (_, i) => i);
      const result = pickRandom(array);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(100);
    });

    it('should eventually pick different elements (statistical test)', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const picks = new Set();
      for (let i = 0; i < 100; i++) {
        picks.add(pickRandom(array));
      }
      // With 100 picks from 5 elements, should get multiple different elements
      expect(picks.size).toBeGreaterThan(1);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min when value is below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when value is above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should return value when equal to min', () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it('should return value when equal to max', () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -2)).toBe(-5);
      expect(clamp(-15, -10, -2)).toBe(-10);
      expect(clamp(0, -10, -2)).toBe(-2);
    });

    it('should handle decimal numbers', () => {
      expect(clamp(5.5, 0, 10)).toBe(5.5);
      expect(clamp(-0.5, 0, 10)).toBe(0);
      expect(clamp(10.5, 0, 10)).toBe(10);
    });

    it('should handle zero range', () => {
      expect(clamp(5, 5, 5)).toBe(5);
      expect(clamp(0, 5, 5)).toBe(5);
    });
  });

  describe('coalesce', () => {
    it('should return value if defined', () => {
      expect(coalesce('value', 'fallback')).toBe('value');
    });

    it('should return fallback if value is null', () => {
      expect(coalesce(null, 'fallback')).toBe('fallback');
    });

    it('should return fallback if value is undefined', () => {
      expect(coalesce(undefined, 'fallback')).toBe('fallback');
    });

    it('should return value even if falsy (not null/undefined)', () => {
      expect(coalesce(0, 0)).toBe(0);
      expect(coalesce(false, true)).toBe(false);
      expect(coalesce('', '')).toBe('');
    });

    it('should work with numbers', () => {
      expect(coalesce(42, 0)).toBe(42);
      expect(coalesce(null, 0)).toBe(0);
    });

    it('should work with objects', () => {
      const obj = { id: 1 };
      const fallback = { id: 2 };
      expect(coalesce(obj, fallback)).toBe(obj);
      expect(coalesce(null, fallback)).toBe(fallback);
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty array', () => {
      expect(isNotEmpty([1, 2, 3])).toBe(true);
      expect(isNotEmpty(['a'])).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(isNotEmpty([])).toBe(false);
    });

    it('should return true for non-empty set', () => {
      const set = new Set([1, 2, 3]);
      expect(isNotEmpty(set)).toBe(true);
    });

    it('should return false for empty set', () => {
      expect(isNotEmpty(new Set())).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNotEmpty(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNotEmpty(undefined)).toBe(false);
    });

    it('should handle arrays with falsy values', () => {
      expect(isNotEmpty([0, false, null, undefined])).toBe(true);
      expect(isNotEmpty([null])).toBe(true);
    });
  });

  describe('isEmpty', () => {
    it('should return false for non-empty array', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty(['a'])).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return false for non-empty set', () => {
      const set = new Set([1, 2, 3]);
      expect(isEmpty(set)).toBe(false);
    });

    it('should return true for empty set', () => {
      expect(isEmpty(new Set())).toBe(true);
    });

    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should be opposite of isNotEmpty', () => {
      const arrays = [[], [1], [1, 2, 3]];
      arrays.forEach(arr => {
        expect(isEmpty(arr)).toBe(!isNotEmpty(arr));
      });

      const sets = [new Set(), new Set([1]), new Set([1, 2])];
      sets.forEach(set => {
        expect(isEmpty(set)).toBe(!isNotEmpty(set));
      });
    });
  });

  describe('Integration tests', () => {
    it('should use selectByCondition and clamp together', () => {
      const value = 15;
      const clamped = clamp(value, 0, 10);
      const color = selectByCondition([clamped > 5, 'red'], [true, 'blue']);
      expect(clamped).toBe(10);
      expect(color).toBe('red');
    });

    it('should use coalesce with isNotEmpty', () => {
      const list = coalesce(null, []);
      expect(isEmpty(list)).toBe(true);

      const list2 = coalesce(undefined, [1, 2, 3]);
      expect(isNotEmpty(list2)).toBe(true);
    });
  });
});
