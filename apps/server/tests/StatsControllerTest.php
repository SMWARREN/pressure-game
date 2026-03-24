<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\StatsController;
use Pressure\Database;

class StatsControllerTest extends TestCase
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

    public function testUpdateMissingUserId(): void
    {
        ob_start();
        try {
            (new StatsController($this->db))->update();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user_id', $response['error']);
    }

    public function testUpdateSuccessSkipped(): void
    {
        // update() requires php://input stream which is hard to mock in unit tests
        $this->markTestSkipped('StatsController->update() requires php://input stream.');
    }

    public function testGetMissingUserId(): void
    {
        $_GET = [];
        ob_start();
        try {
            (new StatsController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user_id', $response['error']);
    }

    public function testGetStatsNotFound(): void
    {
        $_GET = ['user_id' => 'nonexistent'];

        ob_start();
        try {
            (new StatsController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should return empty array if not found
        $this->assertIsArray($response);
    }

    public function testGetStatsExists(): void
    {
        // Create user and stats
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_stats (user_id, max_combo) VALUES ('user1', 42)");

        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new StatsController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('user_id', $response);
        $this->assertSame('user1', $response['user_id']);
        $this->assertSame(42, (int)$response['max_combo']);
    }
}
