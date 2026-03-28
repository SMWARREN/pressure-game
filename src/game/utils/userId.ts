import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Get or generate user ID for database persistence
 * Separated from GameEngineProvider to avoid circular dependencies
 * and to support React Native (globalThis.localStorage)
 */
export function getUserId(): string {
  const envUserId =
    ((import.meta as any).env?.VITE_USER_ID as string | undefined) ||
    (typeof process !== 'undefined' && process.env.VITE_USER_ID) ||
    (globalThis as any).__VITE_USER_ID;
  if (envUserId) {
    return envUserId;
  }

  // Check localStorage for existing user ID
  try {
    const storedUserId =
      globalThis.localStorage === undefined
        ? null
        : globalThis.localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (storedUserId) {
      return storedUserId;
    }
  } catch {
    // localStorage not available (React Native, etc.)
  }

  // Generate new UUID for anonymous user
  const newUserId = `user_${Math.random().toString(36).slice(2, 11)}`;

  try {
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
    }
  } catch {
    // localStorage not available - just use generated ID
  }

  return newUserId;
}
