import { describe, it, expect, beforeEach } from 'vitest';
import { CookieBackend, LocalStorageBackend } from './backends';

describe('CookieBackend', () => {
  let backend: CookieBackend;

  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = 'pressure_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    backend = new CookieBackend();
  });

  describe('getItem', () => {
    it('should return null for non-existent key', () => {
      const value = backend.getItem('nonexistent');
      expect(value).toBeNull();
    });

    it('should return stored value', () => {
      backend.setItem('test_key', 'test_value');
      const value = backend.getItem('test_key');
      expect(value).toBe('test_value');
    });

    it('should handle multiple keys', () => {
      backend.setItem('key1', 'value1');
      backend.setItem('key2', 'value2');
      expect(backend.getItem('key1')).toBe('value1');
      expect(backend.getItem('key2')).toBe('value2');
    });
  });

  describe('setItem', () => {
    it('should store and retrieve simple string', () => {
      backend.setItem('simple', 'value');
      expect(backend.getItem('simple')).toBe('value');
    });

    it('should store JSON string', () => {
      const data = JSON.stringify({ x: 1, y: 2 });
      backend.setItem('json', data);
      const retrieved = backend.getItem('json');
      expect(JSON.parse(retrieved!)).toEqual({ x: 1, y: 2 });
    });

    it('should overwrite existing key', () => {
      backend.setItem('key', 'value1');
      expect(backend.getItem('key')).toBe('value1');
      backend.setItem('key', 'value2');
      expect(backend.getItem('key')).toBe('value2');
    });

    it('should handle empty string', () => {
      backend.setItem('empty', '');
      expect(backend.getItem('empty')).toBe('');
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      backend.setItem('special', special);
      expect(backend.getItem('special')).toBe(special);
    });
  });

  describe('removeItem', () => {
    it('should remove existing key', () => {
      backend.setItem('key', 'value');
      backend.removeItem('key');
      expect(backend.getItem('key')).toBeNull();
    });

    it('should handle removing non-existent key', () => {
      expect(() => backend.removeItem('nonexistent')).not.toThrow();
    });

    it('should not affect other keys', () => {
      backend.setItem('key1', 'value1');
      backend.setItem('key2', 'value2');
      backend.removeItem('key1');
      expect(backend.getItem('key1')).toBeNull();
      expect(backend.getItem('key2')).toBe('value2');
    });
  });

  describe('Multiple operations', () => {
    it('should handle set, get, remove sequence', () => {
      backend.setItem('test', 'value');
      expect(backend.getItem('test')).toBe('value');
      backend.removeItem('test');
      expect(backend.getItem('test')).toBeNull();
    });

    it('should handle many items', () => {
      for (let i = 0; i < 10; i++) {
        backend.setItem(`key${i}`, `value${i}`);
      }
      for (let i = 0; i < 10; i++) {
        expect(backend.getItem(`key${i}`)).toBe(`value${i}`);
      }
    });
  });
});

describe('LocalStorageBackend', () => {
  let backend: LocalStorageBackend;

  beforeEach(() => {
    backend = new LocalStorageBackend();
  });

  describe('getItem', () => {
    it('should handle getItem gracefully', () => {
      const value = backend.getItem('nonexistent');
      // Just ensure it doesn't throw
      expect(typeof value === 'string' || value === null).toBe(true);
    });
  });

  describe('setItem', () => {
    it('should handle setItem gracefully', () => {
      // Should not throw
      expect(() => {
        backend.setItem('key', 'value');
      }).not.toThrow();
    });
  });

  describe('removeItem', () => {
    it('should handle removeItem gracefully', () => {
      // Should not throw
      expect(() => {
        backend.removeItem('key');
      }).not.toThrow();
    });
  });
});
