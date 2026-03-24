<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\LeaderboardController;
use Pressure\Database;

class LeaderboardControllerComprehensiveTest extends TestCase
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

    public function testGetLegacySuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1'), ('u2', 'p2')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id, username) VALUES ('u1', 'p1'), ('u2', 'p2')");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('u1', 'classic', 1, 5000), ('u2', 'classic', 1, 7000)");

        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testGetLegacyEmptyMode(): void
    {
        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('nonexistent');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testGetLegacyWithLimit(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id, username) VALUES ('u1', 'p1')");
        for ($i = 1; $i <= 10; $i++) {
            $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('u1', 'classic', $i, 1000)");
        }

        $_GET = ['limit' => '5'];

        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertLessThanOrEqual(5, count($response));
    }

    public function testGetNewSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id, username) VALUES ('u1', 'p1')");
        $this->db->conn->query("INSERT INTO leaderboard_cache (user_id, username, mode, score, `rank`) VALUES ('u1', 'p1', 'classic', 5000, 1)");

        ob_start();
        try {
            (new LeaderboardController($this->db))->get('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testGetNewEmpty(): void
    {
        ob_start();
        try {
            (new LeaderboardController($this->db))->get('nonexistent');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testGetNewWithLimit(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $userId = "u$i";
            $username = "p$i";
            $this->db->conn->query("INSERT INTO users (id, username) VALUES ('$userId', '$username')");
            $this->db->conn->query("INSERT INTO user_profiles (user_id, username) VALUES ('$userId', '$username')");
            $this->db->conn->query("INSERT INTO leaderboard_cache (user_id, username, mode, score, `rank`) VALUES ('$userId', '$username', 'classic', 1000, $i)");
        }

        $_GET = ['limit' => '3'];

        ob_start();
        try {
            (new LeaderboardController($this->db))->get('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertLessThanOrEqual(3, count($response));
    }
}
