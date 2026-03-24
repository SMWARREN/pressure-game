<?php

use PHPUnit\Framework\TestCase;
use Pressure\AchievementController;
use Pressure\Database;

class AchievementControllerTest extends TestCase
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

        if (!function_exists('jsonResponse')) {
            eval('function jsonResponse(int $code, mixed $data): never {
                http_response_code($code);
                echo json_encode($data);
                throw new \RuntimeException("exit:". $code);
            }');
        }
    }

    public function testUnlockSuccess(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('user1', 'ach1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('success', $response);
    }

    public function testUnlockMissingParams(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('', '');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testUnlockMissingUserId(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('', 'ach1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testUnlockMissingAchievementId(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('user1', '');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetForUserSuccess(): void
    {
        $this->db->unlockAchievement('user1', 'ach1');
        $this->db->unlockAchievement('user1', 'ach2');

        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(2, $response);

        // Verify both achievements are present (order may vary)
        $ids = array_column($response, 'id');
        $this->assertContains('ach1', $ids);
        $this->assertContains('ach2', $ids);
    }

    public function testGetForUserNoAchievements(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testGetForUserMissingUserId(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetAllAchievements(): void
    {
        $this->db->unlockAchievement('user1', 'ach1');
        $this->db->unlockAchievement('user2', 'ach1');
        $this->db->unlockAchievement('user1', 'ach2');

        ob_start();
        try {
            (new AchievementController($this->db))->getAll();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testGetAllAchievementsWithLimit(): void
    {
        $_GET = ['limit' => '1'];
        $this->db->unlockAchievement('user1', 'ach1');
        $this->db->unlockAchievement('user1', 'ach2');

        ob_start();
        try {
            (new AchievementController($this->db))->getAll();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(1, $response);
    }

    public function testUnlockNewSuccess(): void
    {
        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('ach1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('success', $response);
    }

    public function testUnlockNewMissingUserId(): void
    {
        $_GET = [];

        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('ach1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetForUserNewSuccess(): void
    {
        $_GET = ['user_id' => 'user1'];
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_achievements (user_id, achievement_id) VALUES ('user1', 'ach1')");
        $this->db->conn->query("INSERT INTO user_achievements (user_id, achievement_id) VALUES ('user1', 'ach2')");

        ob_start();
        try {
            (new AchievementController($this->db))->getForUserNew();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(2, $response);
    }

    public function testGetForUserNewMissingUserId(): void
    {
        $_GET = [];

        ob_start();
        try {
            (new AchievementController($this->db))->getForUserNew();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetForUserNewWithLimit(): void
    {
        $_GET = ['user_id' => 'user1', 'limit' => '1'];
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_achievements (user_id, achievement_id) VALUES ('user1', 'ach1')");
        $this->db->conn->query("INSERT INTO user_achievements (user_id, achievement_id) VALUES ('user1', 'ach2')");

        ob_start();
        try {
            (new AchievementController($this->db))->getForUserNew();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(1, $response);
    }

    public function testUnlockMultipleAchievements(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('user1', 'first_win');
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        ob_start();
        try {
            (new AchievementController($this->db))->unlock('user1', 'speed_demon');
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        $_GET = [];
        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('user1');
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertCount(2, $response);
    }

    public function testUnlockNewMultipleUsers(): void
    {
        $_GET = ['user_id' => 'user1'];
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('first_win');
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        $_GET = ['user_id' => 'user2'];
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user2')");
        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('first_win');
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        // Both users should have the achievement
        $_GET = ['user_id' => 'user1'];
        ob_start();
        try {
            (new AchievementController($this->db))->getForUserNew();
        } catch (\RuntimeException $e) {
        }
        $user1_achievements = json_decode((string) ob_get_clean(), true);

        $this->assertCount(1, $user1_achievements);
    }

    public function testUnlockIdempotency(): void
    {
        // Unlock same achievement twice
        $userId = 'user1';
        $achievementId = 'power_user';

        ob_start();
        try {
            (new AchievementController($this->db))->unlock($userId, $achievementId);
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        ob_start();
        try {
            (new AchievementController($this->db))->unlock($userId, $achievementId);
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        // Should only have one copy
        $_GET = [];
        ob_start();
        try {
            (new AchievementController($this->db))->getForUser($userId);
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertCount(1, $response);
    }

    public function testGetAllAchievementsNoLimit(): void
    {
        // Unlock multiple achievements
        $this->db->unlockAchievement('user1', 'ach1');
        $this->db->unlockAchievement('user1', 'ach2');
        $this->db->unlockAchievement('user2', 'ach1');

        $_GET = [];

        ob_start();
        try {
            (new AchievementController($this->db))->getAll();
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testUnlockNewMissingAchievementId(): void
    {
        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('');
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should handle gracefully
        $this->assertIsArray($response);
    }

    public function testUnlockNewIdempotency(): void
    {
        $_GET = ['user_id' => 'user1'];
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");

        // Unlock same achievement twice
        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('ach1');
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('ach1');
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();

        // Should only have one copy
        $_GET = ['user_id' => 'user1'];
        ob_start();
        try {
            (new AchievementController($this->db))->getForUserNew();
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertCount(1, $response);
    }

    public function testGetForUserMultipleAchievements(): void
    {
        // Create multiple achievements for user
        $this->db->unlockAchievement('user1', 'ach1');
        $this->db->unlockAchievement('user1', 'ach2');
        $this->db->unlockAchievement('user1', 'ach3');

        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('user1');
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertCount(3, $response);
        foreach ($response as $ach) {
            $this->assertArrayHasKey('id', $ach);
        }
    }
}
