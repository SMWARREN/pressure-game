# E2E Tests for Pressure Game

This directory contains Playwright end-to-end tests for the Pressure Game.

## Test Files

### `stats-api.spec.ts` - Complete Stats API Test Suite ✅
Comprehensive tests for all updated stats endpoints including:

#### Highscores Endpoints
- ✅ **POST /api/highscore/{userId}/{mode}/{levelId}** - Save/update highscores with moves and times
- ✅ **GET /api/highscore/{userId}/{mode}/{levelId}** - Retrieve highscores
- ✅ Multiple score tracking and best value preservation

#### User Profile Endpoints
- ✅ **GET /api/profile/{userId}** - Get user profile with all stats fields
  - total_score, total_moves, levels_completed
  - max_combo, total_walls_survived, no_reset_streak
  - speed_levels, perfect_levels, total_days_played
- ✅ **POST /api/profile/{userId}** - Update username
- ✅ **POST /api/profile/{userId}/stats** - Update performance metrics
- ✅ **GET /api/profile/{userId}/wins** - Get recent wins history
- ✅ Stats monotonic increase constraint (never decrease)

#### Leaderboard Endpoints
- ✅ **GET /api/leaderboard/global** - Global leaderboard with total_score
- ✅ **GET /api/leaderboard/{mode}** - Mode-specific leaderboards
- ✅ **Deduplication** - Only one entry per user (best score)
- ✅ **total_score field** - Included in mode leaderboards

#### Replay Endpoints
- ✅ **POST /api/replay/{userId}/{mode}/{levelId}** - Save replays with move logs
- ✅ **GET /api/replay/{userId}/{mode}/{levelId}** - Retrieve replays with move data
- ✅ **404 handling** - Correct response for missing replays

#### End-to-End Flows
- ✅ **Complete game lifecycle** - Score → Stats → Leaderboard → Profile → Replay
- ✅ **Data consistency** - User profile matches aggregate data across endpoints

## Running Tests

### Prerequisites
```bash
npm install
npm run build
```

### Run All Tests
```bash
# With API server running
VITE_API_URL=http://localhost:8000/server/api.php npm run test:e2e
```

### Run Stats Tests Only
```bash
VITE_API_URL=http://localhost:8000/server/api.php npm run test:e2e -- stats-api.spec.ts
```

### Run with UI (visual debugging)
```bash
VITE_API_URL=http://localhost:8000/server/api.php npm run test:e2e:ui
```

### Run Single Test
```bash
VITE_API_URL=http://localhost:8000/server/api.php npm run test:e2e -- stats-api.spec.ts -g "Save highscore"
```

## Environment Variables

- `VITE_API_URL` - API endpoint (default: `http://localhost:8000/server/api.php`)
- `TEST_URL` - Frontend URL (default: `http://localhost:3000`)

## Test Coverage

### 30+ Tests covering:
- ✅ Highscore persistence (score, moves, time)
- ✅ User profile management (creation, updates)
- ✅ Performance stats (combo, walls, streaks, speeds, perfects)
- ✅ Leaderboard ranking (global, mode-specific)
- ✅ Leaderboard deduplication (one entry per user)
- ✅ Replay saving and retrieval
- ✅ Move log accuracy
- ✅ Data consistency across endpoints
- ✅ Stats monotonic constraint (never decrease)
- ✅ Error handling (404 responses)

## Expected Results

All tests should pass with:
```
✅ 30+ tests passed
✅ All endpoints responding correctly
✅ Data persisted and retrievable
✅ Deduplication working properly
✅ Stats only increasing
✅ Move logs preserved
```

## Troubleshooting

### API URL not found
Ensure your API server is running and `VITE_API_URL` environment variable is set correctly.

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if API server is responding slowly
- Verify network connectivity

### Flaky tests
- Tests are sequential by design (see `fullyParallel: false`)
- Each test uses unique IDs to avoid conflicts
- Timestamps ensure user isolation

## Coverage Analysis

| Endpoint | Tests | Status |
|----------|-------|--------|
| POST /api/highscore | 2+ | ✅ |
| GET /api/highscore | 1+ | ✅ |
| POST /api/profile/{id} | 1+ | ✅ |
| POST /api/profile/{id}/stats | 2+ | ✅ |
| GET /api/profile/{id} | 1+ | ✅ |
| GET /api/profile/{id}/wins | 1+ | ✅ |
| GET /api/leaderboard/global | 1+ | ✅ |
| GET /api/leaderboard/{mode} | 4+ | ✅ |
| POST /api/replay | 1+ | ✅ |
| GET /api/replay | 2+ | ✅ |
| E2E Flows | 2+ | ✅ |

**Total: 30+ comprehensive tests**
