<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\Database;
use Pressure\Router;

class RouterErrorHandlingTest extends TestCase
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

    public function testRouterDispatchHealthCheck(): void
    {
        ob_start();
        try {
            Router::dispatch('GET', ['health'], $this->db);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('status', $response);
        $this->assertSame('ok', $response['status']);
    }

    public function testRouterDispatchNotFound(): void
    {
        ob_start();
        try {
            Router::dispatch('GET', ['nonexistent'], $this->db);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testRouterDispatchReplayInsertSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 1,
            'moves' => [['direction' => 'up']],
            'score' => 5000
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            Router::dispatch('POST', ['replays'], $this->db);
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    public function testRouterDispatchReplayGetSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->saveReplay('user1', 'classic', 1, [['direction' => 'up']], 5000);

        $_GET = ['user_id' => 'user1', 'mode' => 'classic', 'level_id' => '1'];

        ob_start();
        try {
            Router::dispatch('GET', ['replays'], $this->db);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response['moves']);
    }
}
