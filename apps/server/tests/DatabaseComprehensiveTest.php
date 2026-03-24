<?php

use PHPUnit\Framework\TestCase;
use Pressure\Database;

/**
 * Comprehensive Database tests focusing on untested code paths
 */
class DatabaseComprehensiveTest extends TestCase
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

        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 0");
        foreach (['game_completions', 'user_achievements', 'user_stats', 'replays', 'leaderboard_cache', 'highscores', 'game_data', 'user_profiles', 'achievements', 'users'] as $table) {
            $this->db->conn->query("TRUNCATE TABLE `$table`");
        }
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 1");
    }

    public function testGetItemMultipleKeys(): void
    {
        $this->db->setItem('user1', 'key1', 'value1');
        $this->db->setItem('user1', 'key2', 'value2');
        $this->db->setItem('user1', 'key3', 'value3');

        $this->assertSame('value1', $this->db->getItem('user1', 'key1'));
        $this->assertSame('value2', $this->db->getItem('user1', 'key2'));
        $this->assertSame('value3', $this->db->getItem('user1', 'key3'));
    }

    public function testRemoveItemAndRetrieve(): void
    {
        $this->db->setItem('user1', 'key', 'value');
        $this->assertTrue($this->db->removeItem('user1', 'key'));
        $this->assertNull($this->db->getItem('user1', 'key'));
    }

    public function testGetAllUserDataWithMultipleItems(): void
    {
        $this->db->setItem('user1', 'key1', 'val1');
        $this->db->setItem('user1', 'key2', 'val2');
        $this->db->setItem('user1', 'key3', 'val3');

        $data = $this->db->getAllUserData('user1');
        $this->assertCount(3, $data);
    }

    public function testReplayWithComplexData(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $moves = array_fill(0, 50, ['x' => 1, 'y' => 2, 'rotation' => 'cw']);
        $this->assertTrue($this->db->saveReplay('user1', 'classic', 1, $moves, 9500));

        $replay = $this->db->getReplay('user1', 'classic', 1);
        $this->assertNotNull($replay);
        $this->assertSame(9500, (int)$replay['score']);
    }

    public function testHighscoreComparisons(): void
    {
        // Test that saveHighscore keeps the best score
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 5000);
        $score1 = $this->db->getUserHighScore('user1', 'classic', 1);

        $this->db->saveHighscore('user1', 'classic', 1, 8, 20.0, 9000);
        $score2 = $this->db->getUserHighScore('user1', 'classic', 1);

        $this->assertSame(5000, $score1);
        $this->assertSame(9000, $score2); // Higher score kept
    }

    public function testLeaderboardLimitAndOrdering(): void
    {
        // Add 20 highscores
        for ($i = 1; $i <= 20; $i++) {
            $this->db->saveHighscore('user' . $i, 'classic', 1, 10, 25.5, 10000 - ($i * 100));
        }

        // Get leaderboard with limit
        $leaderboard = $this->db->getLeaderboard('classic', 5);
        $this->assertCount(5, $leaderboard);

        // Verify descending order
        for ($i = 0; $i < 4; $i++) {
            $this->assertGreaterThanOrEqual($leaderboard[$i + 1]['score'], $leaderboard[$i]['score']);
        }
    }

    public function testAchievementUnlockAndRetrieval(): void
    {
        // Create and unlock achievements
        for ($i = 1; $i <= 5; $i++) {
            $this->assertTrue($this->db->unlockAchievement('user1', 'ach' . $i));
        }

        // Retrieve user achievements
        $achievements = $this->db->getUserAchievements('user1');
        $this->assertCount(5, $achievements);

        // Get all achievements
        $allAchs = $this->db->getAllAchievements(10);
        $this->assertIsArray($allAchs);
    }

    public function testUserProfileOperations(): void
    {
        // Ensure profile exists
        $this->db->ensureUserProfile('user1');

        // Get profile
        $profile = $this->db->getUserProfile('user1');
        $this->assertNotNull($profile);
        $this->assertSame('user1', $profile['user_id']);

        // Update username
        $this->assertTrue($this->db->updateUserUsername('user1', 'newname'));

        // Verify update
        $profile = $this->db->getUserProfile('user1');
        $this->assertSame('newname', $profile['username']);
    }

    public function testUserWinsWithLimit(): void
    {
        // Create multiple wins
        for ($i = 1; $i <= 10; $i++) {
            $this->db->saveHighscore('user1', 'classic', $i, 10, 25.5, 10000 - ($i * 100));
        }

        // Get wins with different limits
        $wins5 = $this->db->getUserWins('user1', 5);
        $wins10 = $this->db->getUserWins('user1', 10);
        $wins20 = $this->db->getUserWins('user1', 20);

        $this->assertLessThanOrEqual(5, count($wins5));
        $this->assertLessThanOrEqual(10, count($wins10));
        $this->assertLessThanOrEqual(20, count($wins20));
    }

    public function testUpdateUserStats(): void
    {
        $this->db->ensureUserProfile('user1');

        $this->assertTrue($this->db->updateUserStats(
            'user1',
            maxCombo: 50,
            wallsSurvived: 100,
            noResetStreak: 5,
            speedLevels: 2,
            perfectLevels: 1,
            daysPlayed: 10
        ));

        $profile = $this->db->getUserProfile('user1');
        $this->assertSame(50, (int)$profile['max_combo']);
    }

    public function testCleanupTestData(): void
    {
        // Create data for user
        $this->db->ensureUserProfile('user1');
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->unlockAchievement('user1', 'ach1');

        // Cleanup
        $result = $this->db->cleanupTestData('user1');
        $this->assertIsArray($result);
    }

    public function testResetDatabase(): void
    {
        // Add some data
        $this->db->ensureUserProfile('user1');
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);

        // Reset should succeed
        $this->assertTrue($this->db->resetDatabase());

        // Verify empty
        $this->assertEmpty($this->db->getUserAchievements('user1'));
    }
}
