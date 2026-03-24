<?php

require_once __DIR__ . '/InputStreamWrapper.php';

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

    public function testUpdateStatsSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode([
            'user_id' => 'user1',
            'total_levels_completed' => 5,
            'total_score' => 5000,
            'max_combo' => 10
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new StatsController($this->db))->update();
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
        $payload = json_encode(['total_score' => 5000]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new StatsController($this->db))->update();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testUpdateStatsNoUpdates(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode(['user_id' => 'user1']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new StatsController($this->db))->update();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
        $this->assertStringContainsString('No updates', $response['message']);
    }

    public function testUpdateStatsAllFields(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode([
            'user_id' => 'user1',
            'total_levels_completed' => 10,
            'total_score' => 10000,
            'max_combo' => 20,
            'total_walls_survived' => 5,
            'no_reset_streak' => 3,
            'speed_levels' => 2,
            'perfect_levels' => 1,
            'total_hours_played' => 5.5
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new StatsController($this->db))->update();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);

        // Verify data was saved
        $userId = 'user1';
        $stmt = $this->db->conn->prepare('SELECT * FROM user_stats WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats = $result->fetch_assoc();

        $this->assertSame(10, (int) $stats['total_levels_completed']);
        $this->assertSame(20, (int) $stats['max_combo']);
        $this->assertSame(5.5, (float) $stats['total_hours_played']);
    }

    public function testGetStatsSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id, total_score) VALUES ('user1', 5000)");

        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new StatsController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('user_id', $response);
        $this->assertSame(5000, (int) $response['total_score']);
    }

    public function testGetStatsMissingUserId(): void
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
    }

    public function testGetStatsNonexistent(): void
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

        $this->assertEmpty($response);
    }
}
