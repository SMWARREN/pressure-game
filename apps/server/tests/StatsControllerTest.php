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

    public function testUpdateSuccess(): void
    {
        $payload = json_encode([
            'user_id' => 'user1',
            'max_combo' => 42,
            'total_score' => 5000,
            'total_levels_completed' => 3
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new StatsController($this->db))->update();
        } catch (\RuntimeException $e) {
            // Expected from jsonResponse
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('success', $response);
        $this->assertTrue($response['success']);

        // Verify stats were updated
        $stmt = $this->db->conn->prepare('SELECT max_combo, total_score FROM user_stats WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $userId = 'user1';
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        $this->assertNotNull($row);
        $this->assertSame(42, (int)$row['max_combo']);
        $this->assertSame(5000, (int)$row['total_score']);
    }

    public function testUpdateNoUpdates(): void
    {
        // Send user_id with no stat fields
        $payload = json_encode([
            'user_id' => 'user1'
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

        $this->assertArrayHasKey('success', $response);
        $this->assertSame('No updates', $response['message']);
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

    public function testUpdateWithMultipleFields(): void
    {
        $payload = json_encode([
            'user_id' => 'user1',
            'max_combo' => 50,
            'total_score' => 10000,
            'total_levels_completed' => 5
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

        // Verify all fields were updated
        $stmt = $this->db->conn->prepare('SELECT max_combo, total_score, total_levels_completed FROM user_stats WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $userId = 'user1';
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        $this->assertSame(50, (int)$row['max_combo']);
        $this->assertSame(10000, (int)$row['total_score']);
        $this->assertSame(5, (int)$row['total_levels_completed']);
    }

    public function testUpdateWithFloatField(): void
    {
        $payload = json_encode([
            'user_id' => 'user1',
            'total_hours_played' => 42.5
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

        // Verify float field was updated
        $stmt = $this->db->conn->prepare('SELECT total_hours_played FROM user_stats WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $userId = 'user1';
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        $this->assertSame(42.5, (float)$row['total_hours_played']);
    }

    public function testUpdateIgnoresUnknownFields(): void
    {
        $payload = json_encode([
            'user_id' => 'user1',
            'max_combo' => 50,
            'unknown_field' => 'should_be_ignored'
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

        // Should succeed and only update max_combo
        $this->assertTrue($response['success']);

        $stmt = $this->db->conn->prepare('SELECT max_combo FROM user_stats WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $userId = 'user1';
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        $this->assertSame(50, (int)$row['max_combo']);
    }
}
