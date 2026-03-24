<?php

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

    public function testSaveSuccessSkipped(): void
    {
        // save() requires php://input stream which is hard to mock in unit tests
        $this->markTestSkipped('HighscoreController->save() requires php://input stream.');
    }
}
