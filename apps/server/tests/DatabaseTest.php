<?php

use PHPUnit\Framework\TestCase;
use Pressure\Database;

/**
 * Tests for Database class using real MySQL test database.
 * Each test uses saintsea_pressure_test database.
 */
class DatabaseTest extends TestCase
{
    private Database $db;

    protected function setUp(): void
    {
        $this->db = new Database(
            'localhost',
            3306,
            'root',
            'root',
            'saintsea_pressure_test'
        );

        // Clear all tables for clean test state
        $this->cleanDatabase();
    }

    protected function tearDown(): void
    {
        $this->cleanDatabase();
    }

    private function cleanDatabase(): void
    {
        // Disable foreign key constraints to allow truncation
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 0");

        $tables = [
            'game_completions',
            'user_achievements',
            'user_stats',
            'replays',
            'leaderboard_cache',
            'highscores',
            'game_data',
            'user_profiles',
            'achievements',
            'users',
        ];

        foreach ($tables as $table) {
            $this->db->conn->query("TRUNCATE TABLE `$table`");
        }

        // Re-enable foreign key constraints
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 1");
    }

    // ─── getItem / setItem / removeItem ─────────────────────────────────────

    public function testSetItemAndGetItem(): void
    {
        $this->db->setItem('user1', 'save', '{"level":5}');

        $value = $this->db->getItem('user1', 'save');
        $this->assertSame('{"level":5}', $value);
    }

    public function testGetItemNotFound(): void
    {
        $value = $this->db->getItem('user1', 'nonexistent');
        $this->assertNull($value);
    }

    public function testSetItemUpdate(): void
    {
        $this->db->setItem('user1', 'save', '{"level":3}');
        $this->db->setItem('user1', 'save', '{"level":10}');

        $value = $this->db->getItem('user1', 'save');
        $this->assertSame('{"level":10}', $value);
    }

    public function testRemoveItem(): void
    {
        $this->db->setItem('user1', 'save', '{"level":5}');
        $this->db->removeItem('user1', 'save');

        $value = $this->db->getItem('user1', 'save');
        $this->assertNull($value);
    }

    public function testGetAllUserData(): void
    {
        $this->db->setItem('user1', 'save', '{"level":5}');
        $this->db->setItem('user1', 'settings', '{"difficulty":"hard"}');

        $data = $this->db->getAllUserData('user1');

        $this->assertCount(2, $data);
        $this->assertSame('{"level":5}', $data['save']);
        $this->assertSame('{"difficulty":"hard"}', $data['settings']);
    }

    // ─── saveHighscore / getUserHighScore ────────────────────────────────────

    public function testSaveHighscore(): void
    {
        $result = $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);

        $this->assertTrue($result);

        $score = $this->db->getUserHighScore('user1', 'classic', 1);
        $this->assertSame(9500, $score);
    }

    public function testGetUserHighScoreNotFound(): void
    {
        $score = $this->db->getUserHighScore('user1', 'classic', 999);
        $this->assertNull($score);
    }

    public function testSaveHighscoreKeepsBest(): void
    {
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->saveHighscore('user1', 'classic', 1, 12, 30.0, 9200);  // Lower score

        $score = $this->db->getUserHighScore('user1', 'classic', 1);
        $this->assertSame(9500, $score);  // Should keep higher
    }

    // ─── ensureUserProfile ──────────────────────────────────────────────────

    public function testEnsureUserProfile(): void
    {
        $this->db->ensureUserProfile('user1');

        $profile = $this->db->getUserProfile('user1');
        $this->assertNotNull($profile);
        $this->assertSame('user1', $profile['user_id']);
    }

    public function testEnsureUserProfileIdempotent(): void
    {
        $this->db->ensureUserProfile('user1');
        $this->db->ensureUserProfile('user1');  // Second call should not error

        $profile = $this->db->getUserProfile('user1');
        $this->assertNotNull($profile);
    }

    // ─── getUserProfile / updateUserUsername ────────────────────────────────

    public function testGetUserProfile(): void
    {
        $this->db->ensureUserProfile('user1');
        $this->db->updateUserUsername('user1', 'alice');

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame('alice', $profile['username']);
        $this->assertSame(0, (int)$profile['total_score']);
    }

    public function testUpdateUserUsername(): void
    {
        $this->db->ensureUserProfile('user1');
        $result = $this->db->updateUserUsername('user1', 'bob');

        $this->assertTrue($result);

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame('bob', $profile['username']);
    }

    // ─── unlockAchievement / getUserAchievements ─────────────────────────────

    public function testUnlockAchievement(): void
    {
        $result = $this->db->unlockAchievement('user1', 'first_win');

        $this->assertTrue($result);

        $achievements = $this->db->getUserAchievements('user1');
        $this->assertCount(1, $achievements);
        $this->assertSame('first_win', $achievements[0]['id']);
    }

    public function testUnlockAchievementIdempotent(): void
    {
        $this->db->unlockAchievement('user1', 'first_win');
        $this->db->unlockAchievement('user1', 'first_win');  // Second unlock

        $achievements = $this->db->getUserAchievements('user1');
        $this->assertCount(1, $achievements);  // Should only have one
    }

    public function testGetAllAchievements(): void
    {
        $this->db->unlockAchievement('user1', 'first_win');
        $this->db->unlockAchievement('user2', 'first_win');
        $this->db->unlockAchievement('user1', 'speedrunner');

        $achievements = $this->db->getAllAchievements();

        // Should have 2 distinct achievement IDs
        $ids = array_map(fn($a) => $a['achievement_id'], $achievements);
        $this->assertContains('first_win', $ids);
        $this->assertContains('speedrunner', $ids);
    }

    // ─── getUserWins ────────────────────────────────────────────────────────

    public function testGetUserWins(): void
    {
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->saveHighscore('user1', 'classic', 2, 12, 30.0, 9200);

        $wins = $this->db->getUserWins('user1', 50);

        $this->assertCount(2, $wins);
        $this->assertSame('classic', $wins[0]['mode']);
    }

    public function testGetUserWinsRespectLimit(): void
    {
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->saveHighscore('user1', 'classic', 2, 12, 30.0, 9200);
        $this->db->saveHighscore('user1', 'classic', 3, 14, 35.0, 9000);

        $wins = $this->db->getUserWins('user1', 2);

        $this->assertCount(2, $wins);
    }

    // ─── updateUserStats ────────────────────────────────────────────────────

    public function testUpdateUserStats(): void
    {
        $this->db->ensureUserProfile('user1');
        $result = $this->db->updateUserStats(
            'user1',
            maxCombo: 42,
            wallsSurvived: 10,
            noResetStreak: 5,
            speedLevels: 3,
            perfectLevels: 1,
            daysPlayed: 7
        );

        $this->assertTrue($result);

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(42, (int)$profile['max_combo']);
        $this->assertSame(10, (int)$profile['total_walls_survived']);
    }

    public function testUpdateUserStatsKeepsMax(): void
    {
        $this->db->ensureUserProfile('user1');
        $this->db->updateUserStats('user1', maxCombo: 50);
        $this->db->updateUserStats('user1', maxCombo: 30);  // Lower value

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(50, (int)$profile['max_combo']);  // Should keep higher
    }

    // ─── saveReplay / getReplay ─────────────────────────────────────────────

    public function testSaveAndGetReplay(): void
    {
        // Create user (replays table needs user to exist)
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $moves = json_encode([['x' => 0, 'y' => 0, 'dir' => 'CW']]);
        $result = $this->db->saveReplay('user1', 'classic', 1, $moves, 9500);

        $this->assertTrue($result);

        $replay = $this->db->getReplay('user1', 'classic', 1);
        $this->assertNotNull($replay);
        $this->assertSame('user1', $replay['user_id']);
        $this->assertSame(9500, (int)$replay['score']);
    }

    public function testGetReplayNotFound(): void
    {
        $replay = $this->db->getReplay('user1', 'classic', 999);
        $this->assertNull($replay);
    }

    public function testSaveReplayMultiple(): void
    {
        // Create user (replays table needs user to exist)
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $moves1 = json_encode([['x' => 0, 'y' => 0, 'dir' => 'CW']]);
        $moves2 = json_encode([['x' => 1, 'y' => 1, 'dir' => 'CCW']]);

        $this->db->saveReplay('user1', 'classic', 1, $moves1, 9500);
        $this->db->saveReplay('user1', 'classic', 1, $moves2, 9600);

        $replay = $this->db->getReplay('user1', 'classic', 1);
        // getReplay returns latest by recorded_at DESC, so should be either one (both have same user/mode/level)
        $this->assertNotNull($replay);
        $this->assertSame('user1', $replay['user_id']);
    }

    // ─── getLeaderboard ─────────────────────────────────────────────────────

    public function testGetLeaderboardByMode(): void
    {
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->saveHighscore('user2', 'classic', 1, 12, 30.0, 9200);
        $this->db->saveHighscore('user3', 'classic', 1, 8, 20.0, 9800);  // Best

        $leaderboard = $this->db->getLeaderboard('classic', 100);

        $this->assertCount(3, $leaderboard);
        $this->assertSame('user3', $leaderboard[0]['user_id']);  // Best score first
        $this->assertSame(1, $leaderboard[0]['rank']);
    }

    public function testGetLeaderboardRespectLimit(): void
    {
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->saveHighscore('user2', 'classic', 1, 12, 30.0, 9200);
        $this->db->saveHighscore('user3', 'classic', 1, 8, 20.0, 9800);

        $leaderboard = $this->db->getLeaderboard('classic', 2);

        $this->assertCount(2, $leaderboard);
    }

    // ─── getSchemaInfo ──────────────────────────────────────────────────────

    public function testGetSchemaInfo(): void
    {
        $schema = $this->db->getSchemaInfo();

        $this->assertArrayHasKey('users', $schema);
        $this->assertArrayHasKey('highscores', $schema);
        $this->assertArrayHasKey('game_data', $schema);

        // Verify users table structure
        $users = $schema['users'];
        $this->assertArrayHasKey('row_count', $users);
        $this->assertArrayHasKey('columns', $users);
        $this->assertIsArray($users['columns']);
    }

    // ─── cleanupTestData ────────────────────────────────────────────────────

    public function testCleanupTestData(): void
    {
        $this->db->ensureUserProfile('user1');
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->unlockAchievement('user1', 'first_win');

        $result = $this->db->cleanupTestData('user1');

        $this->assertArrayHasKey('highscores', $result);
        $this->assertGreaterThan(0, $result['highscores']);
    }

    // ─── updateUserProfileStats ─────────────────────────────────────────────

    public function testUpdateUserProfileStats(): void
    {
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->saveHighscore('user1', 'classic', 2, 12, 30.0, 9200);
        $this->db->unlockAchievement('user1', 'first_win');
        $this->db->unlockAchievement('user1', 'speedrunner');

        $this->db->updateUserProfileStats('user1');

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(2, (int)$profile['levels_completed']);
        $this->assertSame(18700, (int)$profile['total_score']);
        $this->assertSame(2, (int)$profile['achievements_count']);
    }

    // ─── resetDatabase / close ──────────────────────────────────────────────

    public function testResetDatabaseClears(): void
    {
        // Add some data
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->setItem('user1', 'save', '{"level":5}');

        // Reset should clear most tables
        $result = $this->db->resetDatabase();
        $this->assertTrue($result);

        // Verify data is gone
        $score = $this->db->getUserHighScore('user1', 'classic', 1);
        $this->assertNull($score);
    }


    // ─── Edge cases and additional coverage ──────────────────────────────────

    public function testGetLeaderboardGlobalMode(): void
    {
        // Create multiple users with profiles and scores
        $this->db->ensureUserProfile('user1');
        $this->db->updateUserUsername('user1', 'alice');
        $this->db->ensureUserProfile('user2');
        $this->db->updateUserUsername('user2', 'bob');

        // Mock updating profile stats with manual INSERT
        $this->db->conn->query("UPDATE user_profiles SET total_score=100 WHERE user_id='user1'");
        $this->db->conn->query("UPDATE user_profiles SET total_score=200 WHERE user_id='user2'");

        $leaderboard = $this->db->getLeaderboard('global', 10);

        $this->assertCount(2, $leaderboard);
        $this->assertSame('user2', $leaderboard[0]['user_id']);  // Higher score first
    }

    public function testSetItemPartialUpdate(): void
    {
        // First set
        $this->db->setItem('user1', 'key1', 'value1');

        // Set another key for same user
        $this->db->setItem('user1', 'key2', 'value2');

        // Both should exist
        $this->assertSame('value1', $this->db->getItem('user1', 'key1'));
        $this->assertSame('value2', $this->db->getItem('user1', 'key2'));
    }

    public function testGetAllUserDataOrdered(): void
    {
        $this->db->setItem('user1', 'a', 'first');
        sleep(1);  // Ensure different timestamps
        $this->db->setItem('user1', 'b', 'second');

        $data = $this->db->getAllUserData('user1');

        $keys = array_keys($data);
        // Should be ordered by updated_at DESC, so 'b' should come first
        $this->assertSame('b', $keys[0]);
        $this->assertSame('a', $keys[1]);
    }

    public function testRemoveItemNonexistent(): void
    {
        $result = $this->db->removeItem('user1', 'nonexistent');
        // Should return success even if item doesn't exist
        $this->assertTrue($result);
    }

    public function testSaveHighscoreWithScore(): void
    {
        // Test all parameter combinations
        $result = $this->db->saveHighscore(
            'user1',
            'arcade_mode',
            1,
            moves: 0,
            time: 0.0,
            score: 12345
        );

        $this->assertTrue($result);

        $score = $this->db->getUserHighScore('user1', 'arcade_mode', 1);
        $this->assertSame(12345, $score);
    }

    public function testUpdateUserStatsPartial(): void
    {
        $this->db->ensureUserProfile('user1');

        // Update only some fields
        $result = $this->db->updateUserStats(
            'user1',
            maxCombo: 100,
            noResetStreak: null  // Not provided
        );

        $this->assertTrue($result);

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(100, (int)$profile['max_combo']);
    }

    public function testGetUserWinsEmpty(): void
    {
        $wins = $this->db->getUserWins('nonexistent_user', 50);

        $this->assertEmpty($wins);
    }
}
