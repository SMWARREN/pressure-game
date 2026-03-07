# Database Migration Guide

## Old Architecture (JSON Blobs)
- **localStorage**: Single `pressure_save_v3` key with all game state
- **Database**: Generic `/api/data/{userId}/{key}` endpoint storing JSON
- **Problems**: Not queryable, no relational structure, poor performance at scale

## New Architecture (Relational)
- **Cookie**: Single `pressure_data` cookie with all client-side state
- **Database**: Proper normalized tables with real queries
- **Benefits**: Fully queryable, indexed for performance, proper foreign keys

## Database Schema

### Core Tables

#### `users`
- `id` (VARCHAR 64, PK) - User ID from frontend
- `username` (VARCHAR 255, UNIQUE) - Optional username
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

#### `game_completions`
- `id` (INT, PK)
- `user_id` (FK → users)
- `mode` (VARCHAR 50) - Game mode (classic, blitz, candy, etc.)
- `level_id` (INT) - Level ID
- `score` (INT) - Final score
- `moves` (INT) - Total moves taken
- `elapsed_seconds` (FLOAT) - Time taken
- `completed_at` - When level was completed
- **UNIQUE**: (user_id, mode, level_id)
- **Indexes**: user_id, mode, score DESC

Query examples:
```sql
-- Get user's best scores in classic mode
SELECT * FROM game_completions
WHERE user_id = 'user123' AND mode = 'classic'
ORDER BY score DESC

-- Get top scores for a mode
SELECT user_id, username, score
FROM game_completions gc
JOIN users u ON gc.user_id = u.id
WHERE gc.mode = 'classic'
ORDER BY gc.score DESC
LIMIT 10
```

#### `user_achievements`
- `id` (INT, PK)
- `user_id` (FK → users)
- `achievement_id` (VARCHAR 100)
- `unlocked_at` - When achievement was unlocked
- **UNIQUE**: (user_id, achievement_id)

Query examples:
```sql
-- Get all achievements for a user
SELECT * FROM user_achievements
WHERE user_id = 'user123'
ORDER BY unlocked_at DESC

-- Count achievements per user
SELECT user_id, COUNT(*) as total
FROM user_achievements
GROUP BY user_id
ORDER BY total DESC
```

#### `user_stats`
- `user_id` (PK, FK → users)
- `total_levels_completed` (INT)
- `total_score` (INT)
- `max_combo` (INT)
- `total_walls_survived` (INT)
- `no_reset_streak` (INT)
- `speed_levels` (INT) - Completed in under time limit
- `perfect_levels` (INT) - Completed with perfect score
- `total_hours_played` (FLOAT)
- `updated_at` - Last stats update

Query examples:
```sql
-- Get top users by total score
SELECT * FROM user_stats
ORDER BY total_score DESC
LIMIT 50

-- Get users with perfect level records
SELECT * FROM user_stats
WHERE perfect_levels > 0
ORDER BY perfect_levels DESC
```

#### `replays`
- `id` (INT, PK)
- `user_id` (FK → users)
- `mode` (VARCHAR 50)
- `level_id` (INT)
- `moves_json` (JSON) - Array of move objects
- `score` (INT)
- `recorded_at` - When replay was saved
- **Indexes**: (user_id, mode, level_id), recorded_at DESC

Query examples:
```sql
-- Get latest replay for a level
SELECT * FROM replays
WHERE user_id = 'user123' AND mode = 'classic' AND level_id = 5
ORDER BY recorded_at DESC
LIMIT 1
```

#### `leaderboard_cache`
- Materialized view for fast leaderboard queries
- Updated whenever game_completions changes
- Contains pre-computed ranks

## Migration Steps

1. **Run schema.sql** to create tables
   ```bash
   mysql -u root -p pressure_game < server/schema.sql
   ```

2. **Update API** to use new endpoints
   - Old: `POST /api/data/userId/key` → New: `POST /api/games`
   - Old: `GET /api/data/userId/key` → New: `GET /api/games?user_id=userId`

3. **Update client** to use CookieBackend
   - Already done: persistence layer now uses `CookieBackend` by default

4. **Retire old localStorage keys**
   - No longer used: `pressure_save_v3`, `pressure_unlimited_highscores`, `pressure_achievements_v1`
   - Single cookie now: `pressure_data`

## Client-Side (Cookie)

Single `pressure_data` cookie contains:
```json
{
  "pressure_storage_v1": "{...all game state...}",
  "other_keys": "..."
}
```

**Benefits**:
- Single HTTP round-trip for all client data
- Sent with every request (unlike localStorage)
- Secure flag can be set for HTTPS
- Expires in 1 year
- Size limit ~4KB (enforced by browser)

## Performance Improvements

### Before (JSON blobs)
```sql
-- Can't do this - data is JSON strings
SELECT * FROM data WHERE value LIKE '%score%'  -- FULL TABLE SCAN
```

### After (Relational)
```sql
-- Fast indexed query
SELECT * FROM game_completions
WHERE score > 1000
ORDER BY score DESC
```

**Index usage**:
- Leaderboard queries: O(log n) instead of O(n)
- User history: O(log n) with (user_id, mode) index
- Achievement counts: Pre-computed, instant

## Rollback Plan

If needed, old localStorage data is still available in browsers:
1. Old `localStorage` keys persist in browser storage
2. Can migrate data back if new system has issues
3. Keep both systems running for grace period

## Security

- Database:
  - Foreign key constraints prevent orphaned data
  - Normalized schema reduces injection surface
  - Per-user queries with proper parameterization

- Cookie:
  - Single trusted source of truth
  - Can add `Secure` flag for HTTPS-only
  - `SameSite=Lax` prevents CSRF
  - Automatic server sync replaces stale client data

## Next Steps

1. Deploy schema.sql to production database
2. Update api.php to include new endpoints
3. Test client with new CookieBackend
4. Monitor cookie size (should be <2KB)
5. Verify leaderboards calculate correctly
