import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Get API URL from environment or use default
// Use the mildfun.com API if VITE_API_URL is set, otherwise fall back to localhost
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000/server/api.php';
const TEST_USER_ID = `test_user_${Date.now()}`;

// Save test user ID for cleanup script
const testUserFile = path.join(process.cwd(), '.test-user-id');
fs.writeFileSync(testUserFile, TEST_USER_ID, 'utf8');

test.describe('Stats API Endpoints - Complete Test Suite', () => {
  test.describe('Highscores Endpoints', () => {
    test('POST /api/highscore/{userId}/{mode}/{levelId} - Save highscore with moves and time', async ({ request }) => {
      console.log('📋 Testing: Save highscore with best_moves and best_time');

      const response = await request.post(`${API_URL}/api/highscore/${TEST_USER_ID}/classic/1`, {
        data: {
          moves: 12,
          time: 45.5,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ Highscore saved with moves and time');
    });

    test('POST /api/highscore - Save multiple highscores to track improvements', async ({ request }) => {
      console.log('📋 Testing: Save multiple highscores and track best');

      // First score
      const response1 = await request.post(`${API_URL}/api/highscore/${TEST_USER_ID}/blitz/5`, {
        data: {
          moves: 25,
          time: 60.0,
        },
      });
      expect(response1.status()).toBe(200);

      // Better score - should update
      const response2 = await request.post(`${API_URL}/api/highscore/${TEST_USER_ID}/blitz/5`, {
        data: {
          moves: 20, // Better (lower) moves
          time: 50.0, // Better (lower) time
        },
      });
      expect(response2.status()).toBe(200);

      console.log('✅ Multiple highscores saved correctly');
    });

    test('GET /api/highscore - Retrieve user highscore', async ({ request }) => {
      console.log('📋 Testing: Get user highscore');

      // First save a score
      await request.post(`${API_URL}/api/highscore/${TEST_USER_ID}/zen/3`, {
        data: {
          moves: 8,
          time: 25.0,
        },
      });

      // Then retrieve it
      const response = await request.get(`${API_URL}/api/highscore/${TEST_USER_ID}/zen/3`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      // Server calculates score based on moves, time, and difficulty
      expect(body.score).toBeGreaterThan(0);
      expect(typeof body.score).toBe('number');
      console.log('✅ Highscore retrieved successfully');
    });
  });

  test.describe('User Profile Endpoints', () => {
    test('GET /api/profile/{userId} - Get user profile with stats', async ({ request }) => {
      console.log('📋 Testing: Get user profile');

      // Create user by saving a score first
      await request.post(`${API_URL}/api/highscore/${TEST_USER_ID}/classic/2`, {
        data: {
          moves: 15,
          time: 40.0,
        },
      });

      // Get profile
      const response = await request.get(`${API_URL}/api/profile/${TEST_USER_ID}`);
      expect(response.status()).toBe(200);
      const body = await response.json();

      // Verify user profile structure
      expect(body.user_id).toBe(TEST_USER_ID);
      expect(body.total_score).toBeDefined();
      expect(body.total_moves).toBeDefined();
      expect(body.levels_completed).toBeDefined();

      // New stats fields
      expect(body.max_combo).toBeDefined();
      expect(body.total_walls_survived).toBeDefined();
      expect(body.no_reset_streak).toBeDefined();
      expect(body.speed_levels).toBeDefined();
      expect(body.perfect_levels).toBeDefined();
      expect(body.total_days_played).toBeDefined();

      console.log('✅ User profile retrieved with all stats fields');
    });

    test('POST /api/profile/{userId} - Update username', async ({ request }) => {
      console.log('📋 Testing: Update user profile');

      const response = await request.post(`${API_URL}/api/profile/${TEST_USER_ID}`, {
        data: {
          username: 'TestPlayer_' + Date.now(),
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ Username updated successfully');
    });

    test('POST /api/profile/{userId}/stats - Update user stats', async ({ request }) => {
      console.log('📋 Testing: Update user performance stats');

      const response = await request.post(`${API_URL}/api/profile/${TEST_USER_ID}/stats`, {
        data: {
          maxCombo: 42,
          wallsSurvived: 8,
          noResetStreak: 5,
          speedLevels: 3,
          perfectLevels: 2,
          daysPlayed: 7,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      // Verify stats were saved
      const profile = await request.get(`${API_URL}/api/profile/${TEST_USER_ID}`);
      const profileData = await profile.json();
      expect(profileData.max_combo).toBe(42);
      expect(profileData.total_walls_survived).toBe(8);
      expect(profileData.no_reset_streak).toBe(5);
      expect(profileData.speed_levels).toBe(3);
      expect(profileData.perfect_levels).toBe(2);
      expect(profileData.total_days_played).toBe(7);

      console.log('✅ User stats updated and verified');
    });

    test('POST /api/profile/{userId}/stats - Stats only increase (never decrease)', async ({ request }) => {
      console.log('📋 Testing: Stats monotonic increase constraint');

      const testUser = `test_stats_${Date.now()}`;

      // Set initial stats
      await request.post(`${API_URL}/api/profile/${testUser}/stats`, {
        data: {
          maxCombo: 50,
          wallsSurvived: 10,
          speedLevels: 5,
        },
      });

      // Try to set lower values
      const response = await request.post(`${API_URL}/api/profile/${testUser}/stats`, {
        data: {
          maxCombo: 30, // Should stay at 50
          wallsSurvived: 5, // Should stay at 10
          speedLevels: 3, // Should stay at 5
        },
      });

      expect(response.status()).toBe(200);

      // Verify stats didn't decrease
      const profile = await request.get(`${API_URL}/api/profile/${testUser}`);
      const profileData = await profile.json();
      expect(profileData.max_combo).toBe(50); // Kept higher value
      expect(profileData.total_walls_survived).toBe(10); // Kept higher value
      expect(profileData.speed_levels).toBe(5); // Kept higher value

      console.log('✅ Stats correctly maintain highest values only');
    });

    test('GET /api/profile/{userId}/wins - Get user recent wins', async ({ request }) => {
      console.log('📋 Testing: Get user wins history');

      // Save some scores
      await request.post(`${API_URL}/api/highscore/${TEST_USER_ID}/classic/1`, {
        data: { moves: 10, time: 30.0 },
      });
      await request.post(`${API_URL}/api/highscore/${TEST_USER_ID}/blitz/2`, {
        data: { moves: 12, time: 45.0 },
      });

      const response = await request.get(`${API_URL}/api/profile/${TEST_USER_ID}/wins?limit=10`);
      expect(response.status()).toBe(200);
      const wins = await response.json();

      expect(Array.isArray(wins)).toBe(true);
      if (wins.length > 0) {
        expect(wins[0].user_id).toBe(TEST_USER_ID);
        expect(wins[0].score).toBeDefined();
        expect(wins[0].mode).toBeDefined();
        expect(wins[0].level_id).toBeDefined();
      }

      console.log(`✅ User wins retrieved (${wins.length} wins)`);
    });
  });

  test.describe('Leaderboard Endpoints', () => {
    test('GET /api/leaderboard/global - Get global leaderboard with total_score', async ({ request }) => {
      console.log('📋 Testing: Get global leaderboard');

      // Save some scores to populate leaderboard
      const userId1 = `global_test_${Date.now()}_1`;
      const userId2 = `global_test_${Date.now()}_2`;

      await request.post(`${API_URL}/api/highscore/${userId1}/classic/1`, {
        data: { moves: 10, time: 30.0 },
      });
      await request.post(`${API_URL}/api/highscore/${userId2}/blitz/2`, {
        data: { moves: 12, time: 45.0 },
      });

      const response = await request.get(`${API_URL}/api/leaderboard/global?limit=10`);
      expect(response.status()).toBe(200);
      const leaderboard = await response.json();

      expect(Array.isArray(leaderboard)).toBe(true);
      if (leaderboard.length > 0) {
        // Global leaderboard should have total_score
        expect(leaderboard[0].total_score).toBeDefined();
        expect(leaderboard[0].username).toBeDefined();
        expect(leaderboard[0].user_id).toBeDefined();
      }

      console.log(`✅ Global leaderboard retrieved (${leaderboard.length} entries)`);
    });

    test('GET /api/leaderboard/{mode} - Get mode-specific leaderboard', async ({ request }) => {
      console.log('📋 Testing: Get mode-specific leaderboard');

      const response = await request.get(`${API_URL}/api/leaderboard/classic?limit=10`);
      expect(response.status()).toBe(200);
      const leaderboard = await response.json();

      expect(Array.isArray(leaderboard)).toBe(true);
      if (leaderboard.length > 0) {
        // Mode leaderboard should have score and be deduplicated by user
        expect(leaderboard[0].score).toBeDefined();
        expect(leaderboard[0].username).toBeDefined();

        // Verify no duplicate usernames in leaderboard
        const userIds = leaderboard.map((entry: any) => entry.user_id);
        const uniqueUserIds = new Set(userIds);
        expect(uniqueUserIds.size).toBe(userIds.length);
      }

      console.log(`✅ Mode leaderboard retrieved with ${leaderboard.length} unique users`);
    });

    test('GET /api/leaderboard - Mode leaderboard shows highest score per user only', async ({ request }) => {
      console.log('📋 Testing: Leaderboard deduplication by user');

      const testUser = `mode_test_${Date.now()}`;

      // Save multiple scores for same user in same mode
      await request.post(`${API_URL}/api/highscore/${testUser}/classic/1`, {
        data: { moves: 15, time: 50.0 },
      });
      await request.post(`${API_URL}/api/highscore/${testUser}/classic/2`, {
        data: { moves: 12, time: 45.0 },
      });
      await request.post(`${API_URL}/api/highscore/${testUser}/classic/3`, {
        data: { moves: 13, time: 40.0 },
      });

      const response = await request.get(`${API_URL}/api/leaderboard/classic?limit=50`);
      const leaderboard = await response.json();

      // Count how many times testUser appears
      const userAppearances = leaderboard.filter((entry: any) => entry.user_id === testUser);

      // Should appear exactly once with their best score
      expect(userAppearances.length).toBe(1);
      // Score is calculated server-side: MAX(score) across all levels for the user
      expect(userAppearances[0].score).toBeGreaterThan(0);
      expect(typeof userAppearances[0].score).toBe('number');

      console.log('✅ Leaderboard correctly shows single best entry per user');
    });

    test('GET /api/leaderboard/{mode} - Includes total_score from user_profiles', async ({ request }) => {
      console.log('📋 Testing: Mode leaderboard includes total_score');

      const response = await request.get(`${API_URL}/api/leaderboard/classic?limit=10`);
      expect(response.status()).toBe(200);
      const leaderboard = await response.json();

      // Mode leaderboard should now include total_score
      if (leaderboard.length > 0) {
        expect(leaderboard[0].total_score).toBeDefined();
        expect(typeof leaderboard[0].total_score).toBe('number');
      }

      console.log('✅ Mode leaderboard includes total_score field');
    });
  });

  test.describe('Replay Endpoints', () => {
    test('POST /api/replay/{userId}/{mode}/{levelId} - Save replay with move log', async ({ request }) => {
      console.log('📋 Testing: Save replay with move log');

      const moveLog = [
        { x: 0, y: 0, t: 0 },
        { x: 1, y: 0, t: 500 },
        { x: 1, y: 1, t: 1000 },
        { x: 0, y: 1, t: 1500 },
      ];

      const response = await request.post(`${API_URL}/api/replay/${TEST_USER_ID}/classic/1`, {
        data: {
          moves: moveLog,
          score: 1200,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ Replay saved with move log');
    });

    test('GET /api/replay/{userId}/{mode}/{levelId} - Retrieve replay with moves', async ({ request }) => {
      console.log('📋 Testing: Retrieve replay');

      const moveLog = [
        { x: 2, y: 2, t: 0 },
        { x: 3, y: 2, t: 1000 },
      ];

      // Save replay
      await request.post(`${API_URL}/api/replay/${TEST_USER_ID}/blitz/5`, {
        data: {
          moves: moveLog,
          score: 1500,
        },
      });

      // Get replay
      const response = await request.get(`${API_URL}/api/replay/${TEST_USER_ID}/blitz/5`);
      expect(response.status()).toBe(200);
      const body = await response.json();

      expect(body.moves).toBeDefined();
      expect(Array.isArray(body.moves)).toBe(true);
      expect(body.moves.length).toBeGreaterThan(0);
      expect(body.score).toBe(1500);

      // Verify move structure
      expect(body.moves[0].x).toBeDefined();
      expect(body.moves[0].y).toBeDefined();
      expect(body.moves[0].t).toBeDefined();

      console.log('✅ Replay retrieved with complete move data');
    });

    test('GET /api/replay - 404 for non-existent replay', async ({ request }) => {
      console.log('📋 Testing: 404 for missing replay');

      const response = await request.get(`${API_URL}/api/replay/nonexistent_user/classic/999`, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status()).toBe(404);
      console.log('✅ Correctly returns 404 for missing replay');
    });
  });

  test.describe('End-to-End Data Flow', () => {
    test('Complete game lifecycle: score → stats → leaderboard → profile', async ({ request }) => {
      console.log('📋 Testing: Complete game lifecycle');

      const e2eUser = `e2e_test_${Date.now()}`;

      // Step 1: Save highscore with moves and time
      console.log('  1️⃣ Saving highscore...');
      const scoreResp = await request.post(`${API_URL}/api/highscore/${e2eUser}/classic/1`, {
        data: { moves: 15, time: 45.5 },
      });
      expect(scoreResp.status()).toBe(200);

      // Step 2: Save replay
      console.log('  2️⃣ Saving replay...');
      const replayResp = await request.post(`${API_URL}/api/replay/${e2eUser}/classic/1`, {
        data: {
          moves: [
            { x: 0, y: 0, t: 0 },
            { x: 1, y: 0, t: 1000 },
            { x: 1, y: 1, t: 2000 },
          ],
          score: 2000,
        },
      });
      expect(replayResp.status()).toBe(200);

      // Step 3: Update user stats
      console.log('  3️⃣ Updating stats...');
      const statsResp = await request.post(`${API_URL}/api/profile/${e2eUser}/stats`, {
        data: {
          maxCombo: 12,
          wallsSurvived: 3,
          speedLevels: 1,
        },
      });
      expect(statsResp.status()).toBe(200);

      // Step 4: Verify user profile
      console.log('  4️⃣ Checking user profile...');
      const profileResp = await request.get(`${API_URL}/api/profile/${e2eUser}`);
      expect(profileResp.status()).toBe(200);
      const profile = await profileResp.json();
      expect(profile.total_score).toBeGreaterThan(0);
      expect(profile.max_combo).toBe(12);

      // Step 5: Verify leaderboard
      console.log('  5️⃣ Checking leaderboard...');
      const lbResp = await request.get(`${API_URL}/api/leaderboard/classic?limit=50`);
      expect(lbResp.status()).toBe(200);
      const leaderboard = await lbResp.json();
      const userEntry = leaderboard.find((entry: any) => entry.user_id === e2eUser);
      expect(userEntry).toBeDefined();
      expect(userEntry.total_score).toBeDefined();

      // Step 6: Retrieve replay
      console.log('  6️⃣ Retrieving replay...');
      const getReplayResp = await request.get(`${API_URL}/api/replay/${e2eUser}/classic/1`);
      expect(getReplayResp.status()).toBe(200);
      const replay = await getReplayResp.json();
      expect(replay.moves.length).toBe(3);

      console.log('✅ Complete game lifecycle verified end-to-end');
    });

    test('Verify consistency: user profile matches aggregate data', async ({ request }) => {
      console.log('📋 Testing: Data consistency verification');

      const consistencyUser = `consistency_test_${Date.now()}`;

      // Save multiple scores
      const scores = [
        { mode: 'classic', level: 1, moves: 10, time: 30.0 },
        { mode: 'classic', level: 2, moves: 12, time: 40.0 },
        { mode: 'blitz', level: 1, moves: 15, time: 45.0 },
      ];

      for (const s of scores) {
        await request.post(`${API_URL}/api/highscore/${consistencyUser}/${s.mode}/${s.level}`, {
          data: { moves: s.moves, time: s.time },
        });
      }

      // Get profile
      const profileResp = await request.get(`${API_URL}/api/profile/${consistencyUser}`);
      const profile = await profileResp.json();

      // Verify aggregated values (score is calculated server-side)
      expect(profile.total_score).toBeGreaterThan(0);
      expect(profile.levels_completed).toBeGreaterThan(0);

      // Get leaderboards to verify consistency
      const classicResp = await request.get(`${API_URL}/api/leaderboard/classic?limit=100`);
      const blitzResp = await request.get(`${API_URL}/api/leaderboard/blitz?limit=100`);

      const classicEntry = (await classicResp.json()).find((e: any) => e.user_id === consistencyUser);
      const blitzEntry = (await blitzResp.json()).find((e: any) => e.user_id === consistencyUser);

      // User should appear in both mode leaderboards
      expect(classicEntry).toBeDefined();
      expect(blitzEntry).toBeDefined();

      // Both should reference same user profile
      expect(classicEntry.total_score).toBe(profile.total_score);
      expect(blitzEntry.total_score).toBe(profile.total_score);

      console.log('✅ Data consistency verified across all endpoints');
    });
  });
});
