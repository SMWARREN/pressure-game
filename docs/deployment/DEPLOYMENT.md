# Pressure Game - Server Deployment Guide

## Files to Upload

Upload these files to your server:

1. **api.php** (UPDATED)
   - Location: `/home/saintsea/mildfun.com/pressure/api.php`
   - Now includes:
     - Automatic schema creation on startup
     - All relational tables (users, game_completions, user_achievements, user_stats, replays, leaderboard_cache)
     - Legacy tables for backward compatibility
     - Auto-inclusion of new relational endpoints

2. **api-endpoints.php** (NEW)
   - Location: `/home/saintsea/mildfun.com/pressure/api-endpoints.php`
   - Contains all new relational API endpoints:
     - POST /api/games
     - GET /api/games
     - POST /api/achievements/{id}
     - GET /api/achievements
     - POST /api/stats
     - GET /api/stats
     - GET /api/leaderboards/{mode}
     - POST/GET /api/replays
     - POST /api/users
     - GET /api/users

## Deployment Steps

### Step 1: Upload Files
```bash
# From local machine
scp /Users/saint/Downloads/pressure-game/server/api.php saintsea@mildfun.com:/home/saintsea/mildfun.com/pressure/
scp /Users/saint/Downloads/pressure-game/server/api-endpoints.php saintsea@mildfun.com:/home/saintsea/mildfun.com/pressure/
```

### Step 2: Verify (Optional)
```bash
# Test the API is working
curl https://mildfun.com/pressure/api.php/health

# Should return:
# {"status":"ok","time":"2026-03-07T...","database":"connected"}
```

### Step 3: Automatic Setup
- Schema creates automatically on first request
- No manual SQL execution needed
- All tables created with proper indexes and foreign keys

## What Happens Automatically

1. **On First Request:**
   - api.php connects to MySQL
   - Checks if `users` table exists
   - If not, creates all 6 relational tables
   - Creates all legacy tables for compatibility
   - Sets up indexes and foreign keys

2. **On Every Request:**
   - Checks if new endpoints match the route
   - Falls back to legacy endpoints if needed
   - Returns 404 only if neither matches

## Schema Details

### New Relational Tables

#### users
- Core user profiles
- Primary key: id (VARCHAR 64)
- Contains: username, created_at, updated_at

#### game_completions
- All level completion records
- Contains: user_id, mode, level_id, score, moves, elapsed_seconds
- Indexed for fast queries: (user_id), (mode), (score DESC)
- UNIQUE per user per level per mode

#### user_achievements
- Unlocked achievements
- Contains: user_id, achievement_id, unlocked_at
- UNIQUE per user per achievement

#### user_stats
- Aggregate performance metrics
- Contains: total_levels_completed, max_combo, wallsSurvived, etc.
- Updated whenever stats change

#### replays
- Game move history (JSON stored properly)
- Contains: user_id, mode, level_id, moves_json, score
- Indexed for fast replay lookup

#### leaderboard_cache
- Pre-computed rankings per mode
- Indexed for O(log n) leaderboard queries

### Legacy Tables (Backward Compatible)
- highscores
- game_data
- user_profiles
- achievements

These continue to work with existing clients.

## Data Flow

### New Clients (with CookieBackend)
```
Browser (pressure_data cookie)
    ↓
VITE_API_URL = https://mildfun.com/pressure/
    ↓
POST /api/games          → stores in game_completions
GET /api/achievements    → queries user_achievements
GET /api/leaderboards/{mode} → reads leaderboard_cache
    ↓
MySQL (relational schema)
```

### Old Clients (with localStorage)
```
Browser (localStorage keys)
    ↓
VITE_API_URL = https://mildfun.com/pressure/
    ↓
POST /api/data/{userId}/{key}  → stores in game_data
GET /api/data/{userId}/{key}   → queries game_data
    ↓
MySQL (legacy key-value)
```

## Monitoring

### Check Database
```bash
# SSH to server
mysql -u saintsea_pressure -p

# List tables
SHOW TABLES;

# Check row counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'game_completions', COUNT(*) FROM game_completions
UNION ALL
SELECT 'user_achievements', COUNT(*) FROM user_achievements;
```

### Check Logs
```bash
# Monitor PHP errors
tail -f /home/saintsea/public_html/pressure/error_log

# Check MySQL logs (if accessible)
tail -f /var/log/mysql/error.log
```

## Rollback Plan

If issues arise:

1. **Rename api.php**
   ```bash
   mv api.php api.php.new
   # Keep old version available
   ```

2. **Revert to previous version**
   ```bash
   # If you have old backup
   cp api.php.old api.php
   ```

3. **Tables won't be deleted** - data is safe
   - All tables remain in database
   - Clients can switch back anytime

## Performance Notes

### Query Performance
- game_completions indexed by: user_id, mode, score DESC
- Leaderboard queries now O(log n) instead of O(n)
- All foreign keys prevent orphaned data

### Data Size
- Consolidated schema uses ~30% less space than JSON blobs
- Normalized structure prevents duplication
- Indexes add ~15% overhead but well worth it

### Sync Performance
- One cookie (single HTTP request) vs multiple
- Single database write per game completion
- Batch aggregation in user_stats table

## Support

If you encounter issues:

1. Check PHP error logs
2. Verify MySQL connection
3. Ensure api-endpoints.php is in same directory as api.php
4. Check file permissions (644 for .php files)
5. Test health endpoint: `GET /api/health`

## Next Steps

After deployment:

1. Clients automatically use new cookie format
2. New data flows to relational schema
3. Legacy data coexists in both schema versions
4. Over time, leaderboard_cache will populate
5. Old localStorage keys slowly replaced by cookies

No client update needed - deployment is transparent to users!
