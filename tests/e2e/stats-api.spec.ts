import { test, expect } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:8888/api.php';
const TEST_USER_ID = `test_user_${Date.now()}`;

test.describe('Relational API Endpoints', () => {
  test.describe('User Endpoints', () => {
    test('POST /api/users - Create user', async ({ request }) => {
      console.log('📋 Testing: Create user');

      const response = await request.post(`${API_URL}/api/users`, {
        data: {
          id: TEST_USER_ID,
          username: `TestPlayer_${Date.now()}`,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.id).toBe(TEST_USER_ID);
      expect(body.username).toBeDefined();
      expect(body.created_at).toBeDefined();
      console.log('✅ User created successfully');
    });

    test('GET /api/users?id=... - Get user profile with stats', async ({ request }) => {
      console.log('📋 Testing: Get user profile');

      const response = await request.get(`${API_URL}/api/users?id=${TEST_USER_ID}`);
      expect(response.status()).toBe(200);
      const body = await response.json();

      expect(body.user).toBeDefined();
      expect(body.user.id).toBe(TEST_USER_ID);
      expect(body.stats).toBeDefined();
      console.log('✅ User profile retrieved with stats');
    });

    test('GET /api/users?id=... - 404 for missing user', async ({ request }) => {
      console.log('📋 Testing: 404 for non-existent user');

      const response = await request.get(`${API_URL}/api/users?id=nonexistent_user_${Date.now()}`);
      expect(response.status()).toBe(404);
      console.log('✅ Correctly returns 404 for missing user');
    });
  });

  test.describe('Game Completion Endpoints', () => {
    test('POST /api/games - Record game completion', async ({ request }) => {
      console.log('📋 Testing: Record game completion');

      const response = await request.post(`${API_URL}/api/games`, {
        data: {
          user_id: TEST_USER_ID,
          mode: 'classic',
          level_id: 1,
          score: 5000,
          moves: 12,
          elapsed_seconds: 45.5,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ Game completion recorded');
    });

    test('POST /api/games - Multiple games in different modes', async ({ request }) => {
      console.log('📋 Testing: Record games in multiple modes');

      const modes = ['classic', 'blitz', 'zen'];
      for (let i = 0; i < modes.length; i++) {
        const response = await request.post(`${API_URL}/api/games`, {
          data: {
            user_id: TEST_USER_ID,
            mode: modes[i],
            level_id: i + 1,
            score: 5000 - i * 1000,
            moves: 10 + i,
            elapsed_seconds: 30.0 + i * 10,
          },
        });
        expect(response.status()).toBe(201);
      }

      console.log('✅ Multiple games recorded across modes');
    });

    test('GET /api/games?user_id=... - Get user games', async ({ request }) => {
      console.log('📋 Testing: Get user game history');

      const response = await request.get(`${API_URL}/api/games?user_id=${TEST_USER_ID}`);
      expect(response.status()).toBe(200);
      const games = await response.json();

      expect(Array.isArray(games)).toBe(true);
      if (games.length > 0) {
        expect(games[0].user_id).toBe(TEST_USER_ID);
        expect(games[0].mode).toBeDefined();
        expect(games[0].level_id).toBeDefined();
        expect(games[0].score).toBeDefined();
        expect(games[0].moves).toBeDefined();
        expect(games[0].elapsed_seconds).toBeDefined();
      }

      console.log(`✅ User game history retrieved (${games.length} games)`);
    });

    test('GET /api/games?user_id=...&mode=... - Filter by mode', async ({ request }) => {
      console.log('📋 Testing: Get games by mode');

      const response = await request.get(`${API_URL}/api/games?user_id=${TEST_USER_ID}&mode=classic`);
      expect(response.status()).toBe(200);
      const games = await response.json();

      expect(Array.isArray(games)).toBe(true);
      if (games.length > 0) {
        games.forEach((game: any) => {
          expect(game.mode).toBe('classic');
        });
      }

      console.log(`✅ Games filtered by mode (${games.length} classic games)`);
    });
  });

  test.describe('Stats Endpoints', () => {
    test('POST /api/stats - Update user stats', async ({ request }) => {
      console.log('📋 Testing: Update user stats');

      const response = await request.post(`${API_URL}/api/stats`, {
        data: {
          user_id: TEST_USER_ID,
          total_levels_completed: 5,
          total_score: 25000,
          max_combo: 42,
          total_walls_survived: 10,
          no_reset_streak: 3,
          speed_levels: 2,
          perfect_levels: 1,
          total_hours_played: 2.5,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ User stats updated');
    });

    test('GET /api/stats?user_id=... - Get user stats', async ({ request }) => {
      console.log('📋 Testing: Get user stats');

      const response = await request.get(`${API_URL}/api/stats?user_id=${TEST_USER_ID}`);
      expect(response.status()).toBe(200);
      const stats = await response.json();

      expect(stats.user_id).toBe(TEST_USER_ID);
      expect(stats.total_levels_completed).toBe(5);
      expect(stats.total_score).toBe(25000);
      expect(stats.max_combo).toBe(42);
      expect(stats.total_walls_survived).toBe(10);
      expect(stats.no_reset_streak).toBe(3);
      expect(stats.speed_levels).toBe(2);
      expect(stats.perfect_levels).toBe(1);

      console.log('✅ User stats retrieved with all fields');
    });

    test('POST /api/stats - Partial update', async ({ request }) => {
      console.log('📋 Testing: Partial stats update');

      const response = await request.post(`${API_URL}/api/stats`, {
        data: {
          user_id: TEST_USER_ID,
          max_combo: 50, // Only update this field
        },
      });

      expect(response.status()).toBe(200);

      // Verify other fields were preserved
      const statsResp = await request.get(`${API_URL}/api/stats?user_id=${TEST_USER_ID}`);
      const stats = await statsResp.json();
      expect(stats.max_combo).toBe(50);
      expect(stats.total_score).toBe(25000); // Preserved from previous update

      console.log('✅ Partial stats update preserved existing values');
    });
  });

  test.describe('Achievement Endpoints', () => {
    test('POST /api/achievements/{id} - Unlock achievement', async ({ request }) => {
      console.log('📋 Testing: Unlock achievement');

      const response = await request.post(`${API_URL}/api/achievements/first_win?user_id=${TEST_USER_ID}`, {
        data: {}, // POST endpoint, empty body
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ Achievement unlocked');
    });

    test('POST /api/achievements/{id} - Multiple achievements', async ({ request }) => {
      console.log('📋 Testing: Unlock multiple achievements');

      const achievements = ['first_win', 'ten_levels', 'speed_demon'];
      for (const achievement of achievements) {
        const response = await request.post(`${API_URL}/api/achievements/${achievement}?user_id=${TEST_USER_ID}`, {
          data: {},
        });
        expect(response.status()).toBe(201);
      }

      console.log('✅ Multiple achievements unlocked');
    });

    test('GET /api/achievements?user_id=... - Get user achievements', async ({ request }) => {
      console.log('📋 Testing: Get user achievements');

      const response = await request.get(`${API_URL}/api/achievements?user_id=${TEST_USER_ID}`);
      expect(response.status()).toBe(200);
      const achievements = await response.json();

      expect(Array.isArray(achievements)).toBe(true);
      if (achievements.length > 0) {
        expect(achievements[0].achievement_id).toBeDefined();
        expect(achievements[0].unlocked_at).toBeDefined();
      }

      console.log(`✅ User achievements retrieved (${achievements.length} achievements)`);
    });
  });

  test.describe('Leaderboard Endpoints', () => {
    test('GET /api/leaderboards/{mode} - Get mode leaderboard', async ({ request }) => {
      console.log('📋 Testing: Get mode leaderboard');

      const response = await request.get(`${API_URL}/api/leaderboards/classic?limit=10`);
      expect(response.status()).toBe(200);
      const leaderboard = await response.json();

      expect(Array.isArray(leaderboard)).toBe(true);
      if (leaderboard.length > 0) {
        expect(leaderboard[0].user_id).toBeDefined();
        expect(leaderboard[0].username).toBeDefined();
        expect(leaderboard[0].score).toBeDefined();
        expect(leaderboard[0].rank).toBeDefined();
      }

      console.log(`✅ Mode leaderboard retrieved (${leaderboard.length} entries)`);
    });

    test('GET /api/leaderboards/{mode} - Different modes', async ({ request }) => {
      console.log('📋 Testing: Get leaderboards for all modes');

      const modes = ['classic', 'blitz', 'zen'];
      for (const mode of modes) {
        const response = await request.get(`${API_URL}/api/leaderboards/${mode}?limit=5`);
        expect(response.status()).toBe(200);
        const leaderboard = await response.json();
        expect(Array.isArray(leaderboard)).toBe(true);
      }

      console.log('✅ Leaderboards retrieved for all modes');
    });

    test('GET /api/leaderboards/{mode} - Rankings are ordered', async ({ request }) => {
      console.log('📋 Testing: Leaderboard rankings are properly ordered');

      const response = await request.get(`${API_URL}/api/leaderboards/classic?limit=20`);
      expect(response.status()).toBe(200);
      const leaderboard = await response.json();

      if (leaderboard.length > 1) {
        for (let i = 1; i < leaderboard.length; i++) {
          // Ranks should be in ascending order
          expect(leaderboard[i].rank).toBeGreaterThanOrEqual(leaderboard[i - 1].rank);
        }
      }

      console.log('✅ Leaderboard rankings are properly ordered');
    });
  });

  test.describe('Replay Endpoints', () => {
    test('POST /api/replays - Save replay', async ({ request }) => {
      console.log('📋 Testing: Save replay');

      const moveLog = [
        { x: 0, y: 0, rotation: 1 },
        { x: 1, y: 0, rotation: 2 },
        { x: 1, y: 1, rotation: 3 },
      ];

      const response = await request.post(`${API_URL}/api/replays`, {
        data: {
          user_id: TEST_USER_ID,
          mode: 'classic',
          level_id: 1,
          moves: moveLog,
          score: 5000,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.id).toBeDefined();
      console.log('✅ Replay saved with move log');
    });

    test('GET /api/replays?user_id=...&mode=...&level_id=... - Get replay', async ({ request }) => {
      console.log('📋 Testing: Retrieve replay');

      const response = await request.get(`${API_URL}/api/replays?user_id=${TEST_USER_ID}&mode=classic&level_id=1`);
      expect(response.status()).toBe(200);
      const body = await response.json();

      if (body) {
        expect(body.moves).toBeDefined();
        expect(Array.isArray(body.moves)).toBe(true);
        expect(body.score).toBeDefined();
      }

      console.log('✅ Replay retrieved with move data');
    });

    test('GET /api/replays - 404 for non-existent replay', async ({ request }) => {
      console.log('📋 Testing: 404 for missing replay');

      const response = await request.get(
        `${API_URL}/api/replays?user_id=nonexistent&mode=classic&level_id=999`
      );
      expect(response.status()).toBe(200); // Returns null, not 404
      const body = await response.json();
      expect(body).toBeNull();
      console.log('✅ Missing replay returns null');
    });
  });

  test.describe('End-to-End Data Flow', () => {
    test('Complete game lifecycle: user → games → stats → achievements → leaderboard → replay', async ({
      request,
    }) => {
      console.log('📋 Testing: Complete game lifecycle');

      const e2eUser = `e2e_test_${Date.now()}`;

      // Step 1: Create user
      console.log('  1️⃣ Creating user...');
      const userResp = await request.post(`${API_URL}/api/users`, {
        data: {
          id: e2eUser,
          username: `E2E_Player_${Date.now()}`,
        },
      });
      expect(userResp.status()).toBe(201);

      // Step 2: Record game completion
      console.log('  2️⃣ Recording game completion...');
      const gameResp = await request.post(`${API_URL}/api/games`, {
        data: {
          user_id: e2eUser,
          mode: 'classic',
          level_id: 1,
          score: 8500,
          moves: 10,
          elapsed_seconds: 35.5,
        },
      });
      expect(gameResp.status()).toBe(201);

      // Step 3: Update stats
      console.log('  3️⃣ Updating stats...');
      const statsResp = await request.post(`${API_URL}/api/stats`, {
        data: {
          user_id: e2eUser,
          total_levels_completed: 1,
          total_score: 8500,
          max_combo: 8,
          total_walls_survived: 2,
        },
      });
      expect(statsResp.status()).toBe(200);

      // Step 4: Unlock achievement
      console.log('  4️⃣ Unlocking achievement...');
      const achResp = await request.post(`${API_URL}/api/achievements/first_win?user_id=${e2eUser}`, {
        data: {},
      });
      expect(achResp.status()).toBe(201);

      // Step 5: Save replay
      console.log('  5️⃣ Saving replay...');
      const replayResp = await request.post(`${API_URL}/api/replays`, {
        data: {
          user_id: e2eUser,
          mode: 'classic',
          level_id: 1,
          moves: [
            { x: 0, y: 0, rotation: 1 },
            { x: 1, y: 0, rotation: 2 },
          ],
          score: 8500,
        },
      });
      expect(replayResp.status()).toBe(201);

      // Step 6: Verify user profile
      console.log('  6️⃣ Verifying user profile...');
      const profileResp = await request.get(`${API_URL}/api/users?id=${e2eUser}`);
      expect(profileResp.status()).toBe(200);

      // Step 7: Verify game history
      console.log('  7️⃣ Verifying game history...');
      const gamesResp = await request.get(`${API_URL}/api/games?user_id=${e2eUser}`);
      expect(gamesResp.status()).toBe(200);
      const games = await gamesResp.json();
      expect(games.length).toBeGreaterThan(0);

      // Step 8: Verify stats
      console.log('  8️⃣ Verifying stats...');
      const statsCheckResp = await request.get(`${API_URL}/api/stats?user_id=${e2eUser}`);
      expect(statsCheckResp.status()).toBe(200);

      // Step 9: Verify achievements
      console.log('  9️⃣ Verifying achievements...');
      const achCheckResp = await request.get(`${API_URL}/api/achievements?user_id=${e2eUser}`);
      expect(achCheckResp.status()).toBe(200);

      // Step 10: Verify replay
      console.log('  🔟 Verifying replay...');
      const replayCheckResp = await request.get(
        `${API_URL}/api/replays?user_id=${e2eUser}&mode=classic&level_id=1`
      );
      expect(replayCheckResp.status()).toBe(200);

      console.log('✅ Complete game lifecycle verified end-to-end');
    });

    test('Data consistency: stats and games match', async ({ request }) => {
      console.log('📋 Testing: Data consistency verification');

      const consistencyUser = `consistency_test_${Date.now()}`;

      // Create user
      await request.post(`${API_URL}/api/users`, {
        data: { id: consistencyUser, username: `Consistency_${Date.now()}` },
      });

      // Record multiple games
      const games = [
        { mode: 'classic', level: 1, score: 5000, moves: 10, time: 30 },
        { mode: 'classic', level: 2, score: 6000, moves: 12, time: 35 },
        { mode: 'blitz', level: 1, score: 4000, moves: 8, time: 25 },
      ];

      for (const g of games) {
        await request.post(`${API_URL}/api/games`, {
          data: {
            user_id: consistencyUser,
            mode: g.mode,
            level_id: g.level,
            score: g.score,
            moves: g.moves,
            elapsed_seconds: g.time,
          },
        });
      }

      // Update stats
      const totalScore = games.reduce((sum, g) => sum + g.score, 0);
      await request.post(`${API_URL}/api/stats`, {
        data: {
          user_id: consistencyUser,
          total_levels_completed: games.length,
          total_score: totalScore,
        },
      });

      // Verify stats match game data
      const statsResp = await request.get(`${API_URL}/api/stats?user_id=${consistencyUser}`);
      const stats = await statsResp.json();
      expect(stats.total_levels_completed).toBe(games.length);
      expect(stats.total_score).toBe(totalScore);

      // Verify games list matches
      const gamesResp = await request.get(`${API_URL}/api/games?user_id=${consistencyUser}`);
      const gamesList = await gamesResp.json();
      expect(gamesList.length).toBe(games.length);

      console.log('✅ Data consistency verified between games and stats');
    });
  });
});
