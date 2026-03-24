<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\ProfileController;
use Pressure\Database;

class ProfileControllerTest extends TestCase
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

    public function testGetProfileSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'testuser')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id, username) VALUES ('user1', 'testuser')");

        ob_start();
        try {
            (new ProfileController($this->db))->get('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('user_id', $response);
        $this->assertSame('testuser', $response['username']);
    }

    public function testGetProfileMissingUserId(): void
    {
        ob_start();
        try {
            (new ProfileController($this->db))->get('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testUpdateProfileSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'oldname')");

        $payload = json_encode(['username' => 'newname']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->update('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    public function testUpdateProfileMissingUserId(): void
    {
        $payload = json_encode(['username' => 'newname']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->update('');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testUpdateProfileMissingUsername(): void
    {
        $payload = json_encode([]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->update('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testWinsSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 1000)");

        $_GET = [];

        ob_start();
        try {
            (new ProfileController($this->db))->wins('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testWinsMissingUserId(): void
    {
        $_GET = [];

        ob_start();
        try {
            (new ProfileController($this->db))->wins('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testWinsWithLimit(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        for ($i = 1; $i <= 10; $i++) {
            $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', $i, 1000)");
        }

        $_GET = ['limit' => '5'];

        ob_start();
        try {
            (new ProfileController($this->db))->wins('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertLessThanOrEqual(5, count($response));
    }

    public function testUpdateStatsSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'maxCombo' => 50,
            'wallsSurvived' => 10,
            'noResetStreak' => 5,
            'speedLevels' => 3,
            'perfectLevels' => 2,
            'daysPlayed' => 7
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->updateStats('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    public function testUpdateStatsMissingUserId(): void
    {
        $payload = json_encode(['maxCombo' => 50]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->updateStats('');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetFullSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        ob_start();
        try {
            (new ProfileController($this->db))->getFull('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('profile', $response);
        $this->assertArrayHasKey('achievements', $response);
        $this->assertArrayHasKey('wins', $response);
    }

    public function testGetFullMissingUserId(): void
    {
        ob_start();
        try {
            (new ProfileController($this->db))->getFull('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }
}
