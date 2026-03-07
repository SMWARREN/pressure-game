# Persistence Backends Guide

The Pressure engine supports pluggable persistence backends, allowing you to choose how and where game data is stored.

## Available Backends

### 1. **LocalStorageBackend** (Default)
Stores data in browser localStorage. Best for simple offline-first applications.

```typescript
import { createPressureEngine } from '@/game/engine';
import { LocalStorageBackend } from '@/game/engine/persistence';

// This is the default, but you can be explicit:
const backend = new LocalStorageBackend();
const engine = createPressureEngine({
  persistenceBackend: backend,
});
```

**Pros:**
- Works offline
- No server required
- Fast access
- Simple implementation

**Cons:**
- Limited storage (~5-10MB per domain)
- No cloud backup
- Data lost if user clears browser cache

---

### 2. **DatabaseBackend**
Template for connecting to a backend database or API.

```typescript
import { createPressureEngine } from '@/game/engine';
import { DatabaseBackend } from '@/game/engine/persistence';

// Implement the stub methods
class MyDatabaseBackend extends DatabaseBackend {
  getItem(key: string): string | null {
    // Fetch from your database
    const response = await fetch(`${this.apiUrl}/data/${key}`);
    return response.ok ? await response.text() : null;
  }

  setItem(key: string, value: string): void {
    // Save to your database
    await fetch(`${this.apiUrl}/data/${key}`, {
      method: 'POST',
      body: value,
    });
  }

  removeItem(key: string): void {
    // Delete from your database
    await fetch(`${this.apiUrl}/data/${key}`, {
      method: 'DELETE',
    });
  }
}

const backend = new MyDatabaseBackend('https://api.example.com');
const engine = createPressureEngine({
  persistenceBackend: backend,
});
```

**Pros:**
- Cloud storage
- Automatic backups
- Multi-device sync
- No storage limits

**Cons:**
- Requires server
- No offline access
- Network latency
- Server costs

---

### 3. **SyncingBackend** (Recommended for Production)
Combines localStorage with a remote backend for offline-first with online sync.

```typescript
import { createPressureEngine } from '@/game/engine';
import { SyncingBackend } from '@/game/engine/persistence';

const backend = new SyncingBackend('https://api.example.com');
const engine = createPressureEngine({
  persistenceBackend: backend,
});
```

**How it works:**
1. **Offline**: Writes to localStorage immediately, allowing full offline functionality
2. **Online**: Automatically syncs changes to the server every 30 seconds
3. **Reconnect**: When coming back online, automatically syncs pending changes
4. **Data pull**: Call `backend.pullServerData(key)` to fetch latest server data

```typescript
// Pull server data when app goes online
window.addEventListener('online', () => {
  // Fetch server version of high scores
  backend.pullServerData('pressure_unlimited_highscores');
  // Fetch server version of game state
  backend.pullServerData('pressure_save_v3');
});
```

**Pros:**
- Works offline with localStorage
- Auto-syncs changes when online
- No data loss during downtime
- Best user experience

**Cons:**
- More complex setup
- Network calls in background
- Potential sync conflicts (requires conflict resolution)

---

### 4. **InMemoryBackend**
Stores data in RAM. Useful for testing.

```typescript
import { InMemoryBackend } from '@/game/engine/persistence';

const backend = new InMemoryBackend();
const engine = createPressureEngine({
  persistenceBackend: backend,
});

// Clear all data for testing
backend.clear();
```

**Use case:** Unit tests, integration tests, development

---

## Choosing a Backend

### For Development
Use **LocalStorageBackend** (default):
```typescript
const engine = createPressureEngine(); // Uses localStorage by default
```

### For Testing
Use **InMemoryBackend**:
```typescript
import { InMemoryBackend } from '@/game/engine/persistence';

const testBackend = new InMemoryBackend();
const engine = createPressureEngine({ persistenceBackend: testBackend });
```

### For Production (Recommended)
Use **SyncingBackend**:
```typescript
import { SyncingBackend } from '@/game/engine/persistence';

// Save works offline, syncs automatically when online
const backend = new SyncingBackend(process.env.REACT_APP_API_URL);
const engine = createPressureEngine({ persistenceBackend: backend });
```

### For Server-Only (No Offline)
Use **DatabaseBackend**:
```typescript
import { DatabaseBackend } from '@/game/engine/persistence';

// Implement custom methods for your API
class MyBackend extends DatabaseBackend { /* ... */ }

const backend = new MyBackend(process.env.REACT_APP_API_URL);
const engine = createPressureEngine({ persistenceBackend: backend });
```

---

## Implementation Examples

### Implementing SyncingBackend with a Real Server

```typescript
import { SyncingBackend } from '@/game/engine/persistence';

// Extend the database backend to make sync actually work
class FirebaseBackend extends DatabaseBackend {
  async getItem(key: string): Promise<string | null> {
    const doc = await fetch(`${this.apiUrl}/users/${userId}/data/${key}`);
    const data = await doc.json();
    return data.value ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await fetch(`${this.apiUrl}/users/${userId}/data/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  }

  async removeItem(key: string): Promise<void> {
    await fetch(`${this.apiUrl}/users/${userId}/data/${key}`, {
      method: 'DELETE',
    });
  }
}

const backend = new SyncingBackend(process.env.REACT_APP_API_URL);
const engine = createPressureEngine({ persistenceBackend: backend });
```

---

## Data Keys

All persistence data is stored with these keys:

| Key | Purpose | Backend |
|-----|---------|---------|
| `pressure_save_v3` | Main game state | All backends |
| `pressure_unlimited_highscores` | High scores | All backends |
| `walkthrough-{mode}-{levelId}` | Walkthrough progress | All backends |
| `state-editor-presets` | Editor presets | All backends |
| `pressure_stats_v2` | Game statistics | Stats system |
| `pressure_achievements_v1` | Achievements | Achievements system |

---

## Custom Backend

To create your own backend, implement the `PersistenceBackend` interface:

```typescript
import { PersistenceBackend } from '@/game/engine/persistence';

class MyCustomBackend implements PersistenceBackend {
  getItem(key: string): string | null {
    // Your implementation
  }

  setItem(key: string, value: string): void {
    // Your implementation
  }

  removeItem(key: string): void {
    // Your implementation
  }
}

const backend = new MyCustomBackend();
const engine = createPressureEngine({ persistenceBackend: backend });
```

---

## Switching Backends at Runtime

You can switch backends by creating a new engine instance:

```typescript
// Start with offline
let backend = new LocalStorageBackend();
let engine = createPressureEngine({ persistenceBackend: backend });

// Later, upgrade to syncing
if (user.isLoggedIn) {
  backend = new SyncingBackend('https://api.example.com');
  engine = createPressureEngine({ persistenceBackend: backend });
}
```

> **Note:** When switching backends, data from the old backend won't automatically migrate. Consider manually copying data if needed.

---

## Troubleshooting

### Data not persisting
- Check if the backend's `setItem()` method is being called
- For localStorage, check browser storage limits
- For syncing, check network errors in console

### Offline sync not working
- Verify `SyncingBackend.syncChanges()` is being called
- Check network tab for API errors
- Review sync queue status in console

### Sync conflicts
- When data exists both locally and on server, local data wins
- Implement custom conflict resolution in your backend

---

## Migration Guide

### From localStorage to Syncing

```typescript
// Before: localStorage only
const engine = createPressureEngine();

// After: offline-first with sync
import { SyncingBackend } from '@/game/engine/persistence';

const syncBackend = new SyncingBackend('https://api.example.com');
const engine = createPressureEngine({ persistenceBackend: syncBackend });

// Data automatically syncs when online
```

### From localStorage to Database

```typescript
// Before: localStorage
const oldEngine = createPressureEngine();

// After: cloud database
class CloudBackend extends DatabaseBackend { /* ... */ }
const backend = new CloudBackend('https://api.example.com');
const engine = createPressureEngine({ persistenceBackend: backend });

// Note: You'll need to migrate existing localStorage data to the server
```
