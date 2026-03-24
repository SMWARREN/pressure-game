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

    public function testGetMissingUserId(): void
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

    public function testGetMissingMode(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->get('user1', '', 1);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetMissingLevelId(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->get('user1', 'classic', 0);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetScoreNotFound(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->get('user1', 'classic', 999);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('score', $response);
        $this->assertNull($response['score']);
    }

    public function testGetScoreExists(): void
    {
        // Create highscore
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);

        ob_start();
        try {
            (new HighscoreController($this->db))->get('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('score', $response);
        $this->assertSame(9500, $response['score']);
    }

    public function testSaveMissingUserId(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->save('', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testSaveMissingMode(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', '', 1);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testSaveMissingLevelId(): void
    {
        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 0);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testSaveSuccess(): void
    {
        // Create user first (foreign key requirement)
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'moves' => 10,
            'time' => 25.5,
            'score' => 9500
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'classic', 1);
        } catch (\RuntimeException $e) {
            // Expected from jsonResponse
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('success', $response);
        $this->assertTrue($response['success']);

        // Verify highscore was saved
        $score = $this->db->getUserHighScore('user1', 'classic', 1);
        $this->assertSame(9500, $score);
    }

    public function testSaveMissingData(): void
    {
        $payload = json_encode([
            'moves' => 10
            // missing time
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

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing moves or time', $response['error']);
    }

    public function testSaveWithoutScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'moves' => 10,
            'time' => 25.5
            // score is optional
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

    public function testSaveMultipleTimes(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        // Save first highscore
        $payload = json_encode([
            'moves' => 15,
            'time' => 30.0,
            'score' => 8000
        ]);

        InputStreamWrapper::register($payload);
        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'blitz', 2);
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // Save better highscore
        $payload = json_encode([
            'moves' => 12,
            'time' => 25.0,
            'score' => 9000
        ]);

        InputStreamWrapper::register($payload);
        ob_start();
        try {
            (new HighscoreController($this->db))->save('user1', 'blitz', 2);
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // Verify best score is kept
        $score = $this->db->getUserHighScore('user1', 'blitz', 2);
        $this->assertSame(9000, $score);
    }

    public function testGetWithValidParams(): void
    {
        $this->db->saveHighscore('user1', 'zen', 5, 5, 15.5, 5500);

        ob_start();
        try {
            (new HighscoreController($this->db))->get('user1', 'zen', 5);
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('score', $response);
        $this->assertSame(5500, $response['score']);
    }
}
