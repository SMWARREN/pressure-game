<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\GameController;
use Pressure\HighscoreController;
use Pressure\AchievementController;
use Pressure\Database;

/**
 * Edge case and boundary condition tests for controllers
 */
class EdgeCaseTest extends TestCase
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

    // Edge case: Very large scores
    public function testHighscoreWithLargeScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'moves' => 1,
            'time' => 1.0,
            'score' => 999999999
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    // Edge case: Very long times
    public function testHighscoreWithLongTime(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'moves' => 1,
            'time' => 9999.99,
            'score' => 100
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    // Edge case: High move counts
    public function testHighscoreWithHighMoves(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'moves' => 99999,
            'time' => 50.0,
            'score' => 100
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    // Edge case: Multiple achievement unlocks for same user quickly
    public function testRapidAchievementUnlocks(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            ob_start();
            try {
                (new AchievementController($this->db))->unlock('user1', 'ach' . $i);
            } catch (\RuntimeException $e) {
            }
            ob_get_clean();
        }

        // Verify all 10 were unlocked
        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('user1');
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertCount(10, $response);
    }

    // Edge case: Same game completion multiple times (should update)
    public function testGameCompletionOverwrite(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        for ($i = 1; $i <= 3; $i++) {
            $payload = json_encode([
                'user_id' => 'user1',
                'mode' => 'classic',
                'level_id' => 1,
                'score' => 1000 * $i
            ]);

            InputStreamWrapper::register($payload);

            ob_start();
            try {
                (new GameController($this->db))->create();
            } catch (\RuntimeException $e) {
            } finally {
                InputStreamWrapper::unregister();
            }
            ob_get_clean();
        }

        // Should only have 1 entry (with highest score)
        $_GET = ['user_id' => 'user1'];
        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertCount(1, $response);
        $this->assertSame(3000, (int)$response[0]['score']);
    }

    // Edge case: Empty query parameters
    public function testEmptyGetParameters(): void
    {
        $_GET = [];

        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should return error for missing user_id
        $this->assertArrayHasKey('error', $response);
    }

    // Edge case: Null values in JSON
    public function testJsonWithNullValues(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 1,
            'score' => null,
            'moves' => null,
            'elapsed_seconds' => null
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new GameController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should handle gracefully
        $this->assertIsArray($response);
    }

    // Edge case: Unicode characters in usernames/ids
    public function testUnicodeInUsername(): void
    {
        $payload = json_encode([
            'id' => 'user_🎮_1',
            'username' => 'Player_🌟_Name'
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new \Pressure\UserController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should handle or reject gracefully
        $this->assertIsArray($response);
    }

    // Edge case: Very long usernames
    public function testLongUsername(): void
    {
        $long_name = str_repeat('a', 255);

        $payload = json_encode([
            'id' => 'user1',
            'username' => $long_name
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new \Pressure\UserController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should handle or reject gracefully
        $this->assertIsArray($response);
    }

    // Edge case: Negative scores
    public function testNegativeScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 1,
            'score' => -100
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new GameController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should handle or allow
        $this->assertIsArray($response);
    }

    // Edge case: Float level IDs (should be cast to int)
    public function testFloatLevelId(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 3.7,
            'score' => 5000
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new GameController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should handle (cast to 3 or reject)
        $this->assertIsArray($response);
    }
}
