<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\AchievementController;
use Pressure\Database;

class AchievementControllerComprehensiveTest extends TestCase
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
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        ob_start();
        try {
            (new AchievementController($this->db))->unlock('user1', 'achievement1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    public function testUnlockMissingUserId(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('', 'achievement1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetForUserSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('user1', 'ach1')");

        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testGetForUserEmpty(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('nonexistent');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testGetAllSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('u1')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u1', 'ach1')");

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

    public function testGetAllEmpty(): void
    {
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

    public function testGetAllWithLimit(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u$i', 'p$i')");
            $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('u$i')");
            $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u$i', 'ach$i')");
        }

        $_GET = ['limit' => '5'];

        ob_start();
        try {
            (new AchievementController($this->db))->getAll();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertLessThanOrEqual(5, count($response));
    }

    public function testUnlockNewSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('achievement1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    public function testUnlockNewMissingUserId(): void
    {
        $_GET = [];

        ob_start();
        try {
            (new AchievementController($this->db))->unlockNew('achievement1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetForUserNewSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_achievements (user_id, achievement_id) VALUES ('user1', 'ach1')");

        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new AchievementController($this->db))->getForUserNew();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
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
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        for ($i = 1; $i <= 10; $i++) {
            $this->db->conn->query("INSERT INTO user_achievements (user_id, achievement_id) VALUES ('user1', 'ach$i')");
        }

        $_GET = ['user_id' => 'user1', 'limit' => '5'];

        ob_start();
        try {
            (new AchievementController($this->db))->getForUserNew();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertLessThanOrEqual(5, count($response));
    }
}
