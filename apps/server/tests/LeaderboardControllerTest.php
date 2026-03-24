<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\LeaderboardController;
use Pressure\Database;

class LeaderboardControllerTest extends TestCase
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

    public function testGetLegacyMissingMode(): void
    {
        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing mode', $response['error']);
    }

    public function testGetLegacyEmpty(): void
    {
        $_GET = [];

        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testGetLegacyWithScores(): void
    {
        // Create highscores
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);
        $this->db->saveHighscore('user2', 'classic', 1, 12, 30.0, 9200);

        $_GET = [];

        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(2, $response);
        $this->assertArrayHasKey('rank', $response[0]);
    }

    public function testGetLegacyWithLimit(): void
    {
        // Create multiple highscores
        for ($i = 1; $i <= 5; $i++) {
            $this->db->saveHighscore('user' . $i, 'classic', 1, 10, 25.0, 9500 - ($i * 100));
        }

        $_GET = ['limit' => 2];

        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(2, $response);
    }

    public function testGetNewEmpty(): void
    {
        $_GET = [];

        ob_start();
        try {
            (new LeaderboardController($this->db))->get('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testGetNewWithData(): void
    {
        // Create users first (required by foreign key)
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'alice')");
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user2', 'bob')");

        // Create leaderboard cache entries
        $this->db->conn->query(
            "INSERT INTO leaderboard_cache (mode, user_id, username, score, `rank`)
             VALUES ('classic', 'user1', 'alice', 9500, 1)"
        );
        $this->db->conn->query(
            "INSERT INTO leaderboard_cache (mode, user_id, username, score, `rank`)
             VALUES ('classic', 'user2', 'bob', 9200, 2)"
        );

        $_GET = [];

        ob_start();
        try {
            (new LeaderboardController($this->db))->get('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(2, $response);
        $this->assertSame('user1', $response[0]['user_id']);
        $this->assertSame(1, (int)$response[0]['rank']);
    }

    public function testGetNewWithLimit(): void
    {
        // Create users first (required by foreign key)
        for ($i = 1; $i <= 5; $i++) {
            $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user$i', 'user$i')");
        }

        // Create multiple leaderboard entries
        for ($i = 1; $i <= 5; $i++) {
            $this->db->conn->query(
                "INSERT INTO leaderboard_cache (mode, user_id, username, score, `rank`)
                 VALUES ('classic', 'user$i', 'user$i', " . (9500 - $i * 100) . ", $i)"
            );
        }

        $_GET = ['limit' => 3];

        ob_start();
        try {
            (new LeaderboardController($this->db))->get('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(3, $response);
    }
}
