<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\HighscoreController;
use Pressure\Database;

class HighscoreControllerTest extends TestCase
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

    public function testSaveHighscoreSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'moves' => 10,
            'time' => 25.5,
            'score' => 5000
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    public function testSaveHighscoreMissingFields(): void
    {
        $payload = json_encode(['moves' => 10]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testSaveHighscoreMissingUserId(): void
    {
        $payload = json_encode(['moves' => 10, 'time' => 25.5]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testSaveHighscoreMissingMode(): void
    {
        $payload = json_encode(['moves' => 10, 'time' => 25.5]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', '', 1);
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testSaveHighscoreZeroLevelId(): void
    {
        $payload = json_encode(['moves' => 10, 'time' => 25.5]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 0);
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetHighscoreSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO highscores (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 5000)");

        ob_start();
        try {
            (new HighscoreController($this->db))->get('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('score', $response);
        $this->assertSame(5000, $response['score']);
    }

    public function testGetHighscoreMissingUserId(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->get('', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetHighscoreNonexistent(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->get('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertNull($response['score']);
    }
}
