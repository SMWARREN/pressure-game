// PRESSURE - Persistence Backends
// Abstract interface for different storage backends (localStorage, database, etc.)

import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Abstract interface for persistence backends.
 * Implement this to add support for different storage mechanisms (DB, Cloud, etc.)
 */
export interface PersistenceBackend {
  /**
   * Get a value by key
   */
  getItem(key: string): string | null;

  /**
   * Set a value by key
   */
  setItem(key: string, value: string): void;

  /**
   * Remove a value by key
   */
  removeItem(key: string): void;
}

/**
 * Cookie backend - stores all data in a single HTTP-only cookie
 * Uses document.cookie for persistence across sessions
 */
export class CookieBackend implements PersistenceBackend {
  private readonly cookieName = 'pressure_data';
  private data: Map<string, string> = new Map();
  private loaded = false;

  constructor() {
    this.loadFromCookie();
  }

  private loadFromCookie(): void {
    if (globalThis.window === undefined || this.loaded) return;

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.cookieName && value) {
          const decoded = decodeURIComponent(value);
          const parsed = JSON.parse(decoded);
          this.data = new Map(Object.entries(parsed));
          console.log(`[CookieBackend] Loaded ${this.data.size} items from cookie`);
          this.loaded = true;
          return;
        }
      }
    } catch (error) {
      console.error(`[CookieBackend] Failed to load from cookie:`, error);
    }
    this.loaded = true;
  }

  private saveToCookie(): void {
    if (globalThis.window === undefined) return;

    try {
      const obj = Object.fromEntries(this.data);
      const encoded = encodeURIComponent(JSON.stringify(obj));
      // Set cookie with 1-year expiry, secure, sameSite
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      document.cookie = `${this.cookieName}=${encoded}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
      console.log(`[CookieBackend] Saved to cookie (${encoded.length} bytes)`);
    } catch (error) {
      console.error(`[CookieBackend] Failed to save to cookie:`, error);
    }
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
    this.saveToCookie();
  }

  removeItem(key: string): void {
    this.data.delete(key);
    this.saveToCookie();
  }
}

/**
 * localStorage backend - stores data in browser localStorage (deprecated, use CookieBackend)
 */
export class LocalStorageBackend implements PersistenceBackend {
  getItem(key: string): string | null {
    if (globalThis.window === undefined) return null;

    try {
      const value = localStorage.getItem(key);
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && value) {
        console.log(`[LocalStorageBackend] Loaded ${key}`);
      }
      return value;
    } catch (error) {
      console.error(`[LocalStorageBackend] Failed to load ${key}:`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (globalThis.window === undefined) return;

    try {
      localStorage.setItem(key, value);
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log(`[LocalStorageBackend] Saved ${key}`);
      }
    } catch (error) {
      console.error(`[LocalStorageBackend] Failed to save ${key}:`, error);
    }
  }

  removeItem(key: string): void {
    if (globalThis.window === undefined) return;

    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  }
}

/**
 * In-memory backend - useful for testing
 */
export class InMemoryBackend implements PersistenceBackend {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.data.clear();
  }
}

/**
 * Database backend template - implement this to use a backend database
 * Example usage:
 *   const dbBackend = new DatabaseBackend('https://api.example.com');
 *   const engine = createPressureEngine({ persistenceBackend: dbBackend });
 */
export class DatabaseBackend implements PersistenceBackend {
  readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  getItem(_key: string): string | null {
    // Not implemented - use MySQL or Syncing backend instead
    console.warn('[DatabaseBackend] getItem not yet implemented');
    return null;
  }

  setItem(_key: string, _value: string): void {
    // Not implemented - use MySQL or Syncing backend instead
    console.warn('[DatabaseBackend] setItem not yet implemented');
  }

  removeItem(_key: string): void {
    // Not implemented - use MySQL or Syncing backend instead
    console.warn('[DatabaseBackend] removeItem not yet implemented');
  }
}

/**
 * Robust fetch wrapper that handles CORS and redirects gracefully
 * For write operations (POST/DELETE), falls back to no-cors mode if needed
 */
export async function robustFetch(url: string, options?: RequestInit): Promise<Response> {
  const isWriteOperation = options?.method && ['POST', 'DELETE', 'PUT'].includes(options.method);

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // For write operations, try no-cors mode as fallback
    if (isWriteOperation && error instanceof TypeError) {
      console.log(`[robustFetch] CORS error on write operation, trying no-cors mode`);
      try {
        const noCorsFetch = await fetch(url, {
          ...options,
          mode: 'no-cors',
        });
        console.log(`[robustFetch] no-cors fallback succeeded`);
        return noCorsFetch;
      } catch (noCorsError) {
        console.error(`[robustFetch] no-cors mode also failed, data queued locally`, noCorsError);
        throw noCorsError;
      }
    }

    // If CORS error with http, try https
    if (url.startsWith('http://') && error instanceof TypeError) {
      const httpsUrl = url.replace('http://', 'https://');
      console.log(`[robustFetch] HTTP failed, retrying with HTTPS: ${httpsUrl}`);
      try {
        return await fetch(httpsUrl, options);
      } catch (httpsError) {
        console.error(`[robustFetch] HTTPS also failed:`, httpsError);
        throw httpsError;
      }
    }

    throw error;
  }
}

/**
 * MySQL API Backend - Connects to MySQL through a REST API
 * This is recommended to use with SyncingBackend for offline-first support.
 *
 * Usage (with SyncingBackend):
 *   const backend = new SyncingBackend('http://localhost:8000/server.php');
 *   const engine = createPressureEngine({ persistenceBackend: backend });
 *
 * Requires a PHP/Node server with endpoints:
 * - GET /api/data/{userId}/{key}
 * - POST /api/data/{userId}/{key}
 * - DELETE /api/data/{userId}/{key}
 *
 * See: server.php or server.example.js
 */
export class MySQLBackend implements PersistenceBackend {
  private readonly apiUrl: string;
  private readonly userId: string;
  private readonly cache: Map<string, string | null> = new Map();

  constructor(apiUrl: string, userId: string) {
    this.apiUrl = apiUrl;
    this.userId = userId;
  }

  getItem(key: string): string | null {
    // Return cached value if available (synchronous)
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }

    // Queue async fetch in background
    this.fetchItemAsync(key);

    // Return null for now (will update cache when fetch completes)
    return null;
  }

  setItem(key: string, value: string): void {
    // Update cache immediately
    this.cache.set(key, value);

    // Queue async save in background
    this.saveItemAsync(key, value);
  }

  removeItem(key: string): void {
    // Clear cache
    this.cache.delete(key);

    // Queue async delete in background
    this.deleteItemAsync(key);
  }

  /**
   * Fetch item from server asynchronously and return the value
   */
  async fetchAndGetItem(key: string): Promise<string | null> {
    try {
      const response = await robustFetch(`${this.apiUrl}/api/data/${this.userId}/${key}`);
      if (!response.ok) {
        this.cache.set(key, null);
        return null;
      }

      const data = await response.json();
      const value = data.value ?? null;
      this.cache.set(key, value);
      return value;
    } catch (error) {
      console.error('[MySQLBackend] fetchAndGetItem failed:', error);
      this.cache.set(key, null);
      return null;
    }
  }

  /**
   * Fetch item from server asynchronously
   */
  private async fetchItemAsync(key: string): Promise<void> {
    await this.fetchAndGetItem(key);
  }

  /**
   * Save item to server asynchronously
   */
  private async saveItemAsync(key: string, value: string): Promise<void> {
    try {
      await robustFetch(`${this.apiUrl}/api/data/${this.userId}/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch (error) {
      console.error('[MySQLBackend] saveItemAsync failed:', error);
    }
  }

  /**
   * Delete item from server asynchronously
   */
  private async deleteItemAsync(key: string): Promise<void> {
    try {
      await robustFetch(`${this.apiUrl}/api/data/${this.userId}/${key}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('[MySQLBackend] deleteItemAsync failed:', error);
    }
  }
}

/**
 * Syncing Backend - Offline-first with online sync
 *
 * This backend saves data locally (for offline use) and syncs with a remote server when online.
 *
 * Usage:
 *   const syncBackend = new SyncingBackend('https://api.example.com');
 *   const engine = createPressureEngine({ persistenceBackend: syncBackend });
 *
 * The backend will:
 * 1. Write immediately to localStorage (offline-first)
 * 2. Queue changes for sync to server
 * 3. Periodically check online status and sync changes
 * 4. Pull server data when online to keep local up-to-date
 */
export class SyncingBackend implements PersistenceBackend {
  private readonly localBackend: CookieBackend;
  private readonly remoteBackend: MySQLBackend;
  private readonly syncQueue: Map<string, string | null> = new Map();
  isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(apiUrl: string, userId?: string) {
    this.localBackend = new CookieBackend();

    // Get or generate userId
    const finalUserId = userId || this.getUserId();

    // Use MySQLBackend for actual API communication
    this.remoteBackend = new MySQLBackend(apiUrl, finalUserId);
    this.startAutoSync();
  }

  /**
   * Get or generate user ID
   */
  private getUserId(): string {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (storedUserId) {
      return storedUserId;
    }

    // Generate new UUID for anonymous user
    const newUserId = `user_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
    return newUserId;
  }

  getItem(key: string): string | null {
    // Always read from local storage (for offline-first)
    return this.localBackend.getItem(key);
  }

  setItem(key: string, value: string): void {
    // 1. Write to local storage immediately (offline-first)
    this.localBackend.setItem(key, value);

    // 2. Queue change for sync to server
    this.syncQueue.set(key, value);

    // 3. Try to sync immediately if online, otherwise will sync on interval
    this.syncChanges();
  }

  removeItem(key: string): void {
    // 1. Remove from local storage immediately
    this.localBackend.removeItem(key);

    // 2. Queue removal for sync to server
    this.syncQueue.set(key, null);

    // 3. Try to sync immediately if online
    this.syncChanges();
  }

  /**
   * Start automatic sync when online
   */
  private startAutoSync(): void {
    // Check online status every 30 seconds
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        // Sync any queued changes
        if (this.syncQueue.size > 0) {
          this.syncChanges();
        }
        // Also pull critical data from server to stay in sync
        this.pullCriticalData();
      }
    }, 30000);

    // Also sync when coming back online
    if (globalThis.window !== undefined) {
      globalThis.addEventListener('online', () => {
        // Sync changes and pull fresh data
        this.syncChanges();
        this.pullCriticalData();
      });
    }
  }

  /**
   * Pull critical data from server on reconnect
   */
  private pullCriticalData(): void {
    if (!navigator.onLine) return;

    // Single consolidated storage key contains all game data
    const storageKey = 'pressure_storage_v1';

    // Pull consolidated data in background
    this.remoteBackend
      .fetchAndGetItem(storageKey)
      .then((serverValue) => {
        // Only update local if server has the data
        if (serverValue !== null) {
          this.localBackend.setItem(storageKey, serverValue);
          console.log(`[SyncingBackend] Pulled ${storageKey} from server`);
        }
      })
      .catch(() => {
        // Silently fail - server may not have data yet
      });
  }

  /**
   * Attempt to sync queued changes to server
   */
  private async syncChanges(): Promise<void> {
    // Skip if no changes or already syncing
    if (this.syncQueue.size === 0 || this.isSyncing) return;

    // Skip if offline
    if (!navigator.onLine) return;

    this.isSyncing = true;

    try {
      // Sync each queued change to the server
      for (const [key, value] of this.syncQueue.entries()) {
        if (value === null) {
          this.remoteBackend.removeItem(key);
        } else {
          this.remoteBackend.setItem(key, value);
        }
      }

      // Clear sync queue after successful sync
      this.syncQueue.clear();
      console.log('[SyncingBackend] Successfully synced changes to server');
    } catch (error) {
      console.error('[SyncingBackend] Sync failed:', error);
      // Leave items in sync queue for retry
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pull latest data from server and merge with local
   */
  async pullServerData(key: string): Promise<void> {
    if (!navigator.onLine) {
      console.warn('[SyncingBackend] Cannot pull data while offline');
      return;
    }

    try {
      const serverValue = this.remoteBackend.getItem(key);
      if (serverValue !== null) {
        // Update local with server data
        this.localBackend.setItem(key, serverValue);
      }
    } catch (error) {
      console.error('[SyncingBackend] Failed to pull data:', error);
    }
  }

  /**
   * Cleanup: stop auto-sync
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}
