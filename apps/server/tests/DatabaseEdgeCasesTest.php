<?php

use PHPUnit\Framework\TestCase;
use Pressure\Database;

class DatabaseEdgeCasesTest extends TestCase
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

    // ─── Highscore Edge Cases ───────────────────────────────────────────

    public function testSaveHighscoreWithoutScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $success = $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, null);

        $this->assertTrue($success);

        // Verify it was saved
        $score = $this->db->getUserHighScore('user1', 'classic', 1);
        $this->assertNotNull($score);
    }

    public function testSaveHighscoreZeroScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $success = $this->db->saveHighscore('user1', 'candy', 1, 5, 15.0, 0);

        $this->assertTrue($success);
    }

    public function testSaveHighscoreArcadeMode(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        // Arcade modes have special score handling
        $success = $this->db->saveHighscore('user1', 'gemBlast', 1, 20, 30.0, null);

        $this->assertTrue($success);
    }

    public function testGetLeaderboardGlobalMode(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1'), ('u2', 'p2')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id, total_score) VALUES ('u1', 5000), ('u2', 7000)");

        $leaderboard = $this->db->getLeaderboard('global');

        $this->assertIsArray($leaderboard);
    }

    public function testGetLeaderboardEmptyMode(): void
    {
        $leaderboard = $this->db->getLeaderboard('nonexistent');

        $this->assertIsArray($leaderboard);
        $this->assertEmpty($leaderboard);
    }

    // ─── User Profile Edge Cases ────────────────────────────────────────

    public function testEnsureUserProfileIdempotent(): void
    {
        // Call twice
        $this->db->ensureUserProfile('user1');
        $this->db->ensureUserProfile('user1');

        // Should only have one profile
        $profile = $this->db->getUserProfile('user1');
        $this->assertNotNull($profile);
    }

    public function testGetUserProfileNonexistent(): void
    {
        $profile = $this->db->getUserProfile('nonexistent');

        $this->assertNull($profile);
    }

    public function testUpdateUserUsernameCreatesProfile(): void
    {
        // User doesn't exist yet
        $success = $this->db->updateUserUsername('newuser', 'newname');

        $this->assertTrue($success);

        // Should now exist
        $profile = $this->db->getUserProfile('newuser');
        $this->assertNotNull($profile);
        $this->assertSame('newname', $profile['username']);
    }

    public function testGetUserWinsEmpty(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $wins = $this->db->getUserWins('user1');

        $this->assertIsArray($wins);
        $this->assertEmpty($wins);
    }

    public function testGetUserWinsZeroScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 0)");

        // Wins are score > 0, so 0 score shouldn't show
        $wins = $this->db->getUserWins('user1');

        $this->assertEmpty($wins);
    }

    public function testGetUserWinsWithLimit(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        // Add multiple wins
        for ($i = 1; $i <= 10; $i++) {
            $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', $i, 1000)");
        }

        // Get with limit
        $wins = $this->db->getUserWins('user1', 5);

        $this->assertLessThanOrEqual(5, count($wins));
    }

    public function testUpdateUserProfileStatsExecution(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 1000)");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', 2, 1100)");

        $this->db->updateUserProfileStats('user1');

        // Stats should be updated
        $profile = $this->db->getUserProfile('user1');
        $this->assertGreaterThan(0, $profile['total_score']);
        $this->assertGreaterThan(0, $profile['levels_completed']);
    }

    // ─── Achievement Edge Cases ─────────────────────────────────────────

    public function testUnlockAchievementIdempotent(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        // Unlock twice
        $result1 = $this->db->unlockAchievement('user1', 'achievement1');
        $result2 = $this->db->unlockAchievement('user1', 'achievement1');

        // Both should succeed (idempotent)
        $this->assertTrue($result1);
        $this->assertTrue($result2);
    }

    public function testGetUserAchievementsEmpty(): void
    {
        $achievements = $this->db->getUserAchievements('user1');

        $this->assertIsArray($achievements);
        $this->assertEmpty($achievements);
    }

    public function testGetAllAchievementsEmpty(): void
    {
        $achievements = $this->db->getAllAchievements();

        $this->assertIsArray($achievements);
        $this->assertEmpty($achievements);
    }

    public function testGetAllAchievementsWithHighLimit(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('u1')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u1', 'a1')");

        $achievements = $this->db->getAllAchievements(1000);

        $this->assertIsArray($achievements);
    }

    // ─── Data Store Edge Cases ──────────────────────────────────────────

    public function testSetItemEmptyValue(): void
    {
        $success = $this->db->setItem('user1', 'key', '');

        $this->assertTrue($success);

        // Should retrieve empty string
        $value = $this->db->getItem('user1', 'key');
        $this->assertSame('', $value);
    }

    public function testSetItemSpecialCharacters(): void
    {
        $specialValue = '{"json": true, "emoji": "🎮"}';
        $success = $this->db->setItem('user1', 'special', $specialValue);

        $this->assertTrue($success);

        $value = $this->db->getItem('user1', 'special');
        $this->assertSame($specialValue, $value);
    }

    public function testRemoveItemNonexistent(): void
    {
        // Should succeed even if key doesn't exist (idempotent)
        $success = $this->db->removeItem('user1', 'nonexistent');

        $this->assertTrue($success);
    }

    public function testGetAllUserDataOrdered(): void
    {
        // Add items with different timestamps
        $this->db->setItem('user1', 'item1', 'value1');
        sleep(1);
        $this->db->setItem('user1', 'item2', 'value2');

        $data = $this->db->getAllUserData('user1');

        $this->assertIsArray($data);
        $this->assertCount(2, $data);
    }

    // ─── Replay Edge Cases ───────────────────────────────────────────────

    public function testGetReplayEmptyMoves(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $this->db->saveReplay('user1', 'classic', 1, [], 0);

        $replay = $this->db->getReplay('user1', 'classic', 1);

        $this->assertNotNull($replay);
        $this->assertSame([], $replay['moves']);
    }

    public function testSaveReplayComplexJson(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $complexMoves = [
            ['direction' => 'up', 'index' => 0],
            ['direction' => 'right', 'index' => 1],
            ['direction' => 'down', 'index' => 2]
        ];

        $success = $this->db->saveReplay('user1', 'classic', 1, $complexMoves, 5000);

        $this->assertTrue($success);

        $replay = $this->db->getReplay('user1', 'classic', 1);
        $this->assertIsArray($replay['moves']);
        $this->assertCount(3, $replay['moves']);
    }
}
