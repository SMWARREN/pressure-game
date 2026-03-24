<?php

use PHPUnit\Framework\TestCase;
use Pressure\Database;

class AdditionalDatabaseTest extends TestCase
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

        // Clear tables
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 0");
        foreach (['game_completions', 'user_achievements', 'user_stats', 'replays', 'leaderboard_cache', 'highscores', 'game_data', 'user_profiles', 'achievements', 'users'] as $table) {
            $this->db->conn->query("TRUNCATE TABLE `$table`");
        }
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 1");
    }

    // ─── Replay Tests ───────────────────────────────────────────────────

    public function testSaveReplayWithArrayMoves(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $moves = ['up', 'right', 'down', 'left'];
        $success = $this->db->saveReplay('user1', 'classic', 1, $moves, 5000);

        $this->assertTrue($success);
    }

    public function testSaveReplayWithJsonString(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $movesJson = json_encode(['up', 'right', 'down']);
        $success = $this->db->saveReplay('user1', 'blitz', 2, $movesJson, 4000);

        $this->assertTrue($success);
    }

    public function testGetReplayDecodesJson(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $moves = ['left', 'up', 'right'];
        $this->db->saveReplay('user1', 'zen', 3, $moves, 3000);

        $replay = $this->db->getReplay('user1', 'zen', 3);

        $this->assertNotNull($replay);
        $this->assertIsArray($replay['moves']);
        $this->assertSame($moves, $replay['moves']);
    }

    public function testGetReplayNotFound(): void
    {
        $replay = $this->db->getReplay('user1', 'classic', 1);

        $this->assertNull($replay);
    }

    public function testSaveReplayUpdatesMostRecent(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        // Save first replay
        $this->db->saveReplay('user1', 'classic', 1, ['up', 'right'], 1000);
        $first = $this->db->getReplay('user1', 'classic', 1);

        // Save second replay (same level)
        $this->db->saveReplay('user1', 'classic', 1, ['down', 'left'], 2000);
        $second = $this->db->getReplay('user1', 'classic', 1);

        // Should return a replay for this level
        $this->assertNotNull($second);
        $this->assertIsArray($second['moves']);
    }

    // ─── Schema Info Tests ───────────────────────────────────────────────

    public function testGetSchemaInfo(): void
    {
        $schema = $this->db->getSchemaInfo();

        $this->assertIsArray($schema);
        $this->assertNotEmpty($schema);

        // Should have users table
        $this->assertArrayHasKey('users', $schema);
        $this->assertArrayHasKey('row_count', $schema['users']);
        $this->assertArrayHasKey('columns', $schema['users']);
    }

    public function testGetSchemaInfoWithData(): void
    {
        // Add some data
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1')");
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u2', 'p2')");

        $schema = $this->db->getSchemaInfo();

        // Users table should show 2 rows
        $this->assertSame(2, $schema['users']['row_count']);
    }

    public function testGetSchemaInfoColumnsStructure(): void
    {
        $schema = $this->db->getSchemaInfo();

        // Check users table columns
        $columns = $schema['users']['columns'];
        $columnNames = array_column($columns, 'name');

        $this->assertContains('id', $columnNames);
        $this->assertContains('username', $columnNames);
        $this->assertContains('created_at', $columnNames);
    }

    // ─── Cleanup Tests ──────────────────────────────────────────────────

    public function testCleanupTestData(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 5000)");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('user1', 'ach1')");

        $deleted = $this->db->cleanupTestData('user1');

        $this->assertIsArray($deleted);
        $this->assertArrayHasKey('highscores', $deleted);
        $this->assertArrayHasKey('achievements', $deleted);
        $this->assertGreaterThan(0, $deleted['highscores']);
        $this->assertGreaterThan(0, $deleted['achievements']);
    }

    public function testCleanupTestDataWithoutUser(): void
    {
        $this->expectException(\Pressure\AppException::class);
        $this->db->cleanupTestData('');
    }

    public function testCleanupTestDataNonexistentUser(): void
    {
        $deleted = $this->db->cleanupTestData('nonexistent');

        // Should return array with all 0 counts
        $this->assertIsArray($deleted);
        $this->assertSame(0, $deleted['highscores']);
        $this->assertSame(0, $deleted['achievements']);
    }

    // ─── UpdateUserStats Edge Cases ───────────────────────────────────

    public function testUpdateUserStatsWithAllFields(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $success = $this->db->updateUserStats(
            'user1',
            maxCombo: 100,
            wallsSurvived: 50,
            noResetStreak: 25,
            speedLevels: 5,
            perfectLevels: 3,
            daysPlayed: 10
        );

        $this->assertTrue($success);

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(100, $profile['max_combo']);
        $this->assertSame(50, $profile['total_walls_survived']);
    }

    public function testUpdateUserStatsWithSingleField(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $success = $this->db->updateUserStats('user1', maxCombo: 75);

        $this->assertTrue($success);

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(75, $profile['max_combo']);
    }

    public function testUpdateUserStatsWithNoFields(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        // All parameters null
        $success = $this->db->updateUserStats('user1');

        $this->assertTrue($success);
    }

    public function testUpdateUserStatsGreatestValue(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        // Set initial value
        $this->db->updateUserStats('user1', maxCombo: 100);

        // Try to update with lower value
        $this->db->updateUserStats('user1', maxCombo: 50);

        // Should keep the greatest value (100)
        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(100, $profile['max_combo']);
    }

    public function testResetDatabase(): void
    {
        // Add data
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 5000)");

        // Reset
        $success = $this->db->resetDatabase();
        $this->assertTrue($success);

        // Data should be gone from affected tables
        $result = $this->db->conn->query("SELECT COUNT(*) as cnt FROM highscores");
        $row = $result->fetch_assoc();
        $this->assertSame(0, (int)$row['cnt']);
    }

    public function testMultipleReplayModes(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        // Save replays for different modes
        $this->db->saveReplay('user1', 'classic', 1, ['move1'], 1000);
        $this->db->saveReplay('user1', 'blitz', 1, ['move2'], 2000);
        $this->db->saveReplay('user1', 'zen', 1, ['move3'], 3000);

        // Get each one
        $classic = $this->db->getReplay('user1', 'classic', 1);
        $blitz = $this->db->getReplay('user1', 'blitz', 1);
        $zen = $this->db->getReplay('user1', 'zen', 1);

        $this->assertSame(1000, $classic['score']);
        $this->assertSame(2000, $blitz['score']);
        $this->assertSame(3000, $zen['score']);
    }
}
