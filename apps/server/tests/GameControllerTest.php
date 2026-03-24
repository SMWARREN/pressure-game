<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\GameController;
use Pressure\Database;

class GameControllerTest extends TestCase
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

    public function testListGamesMissingUserId(): void
    {
        $_GET = [];
        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user_id', $response['error']);
    }

    public function testListGamesEmpty(): void
    {
        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testListGamesWithResults(): void
    {
        // Create some game completions
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query(
            "INSERT INTO game_completions (user_id, mode, level_id, score, moves, elapsed_seconds)
             VALUES ('user1', 'classic', 1, 9500, 10, 25.5)"
        );
        $this->db->conn->query(
            "INSERT INTO game_completions (user_id, mode, level_id, score, moves, elapsed_seconds)
             VALUES ('user1', 'classic', 2, 8500, 15, 30.0)"
        );

        $_GET = ['user_id' => 'user1'];

        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(2, $response);
        $this->assertSame('user1', $response[0]['user_id']);
        $this->assertSame('classic', $response[0]['mode']);
    }

    public function testListGamesWithMode(): void
    {
        // Create game completions with different modes
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query(
            "INSERT INTO game_completions (user_id, mode, level_id, score)
             VALUES ('user1', 'classic', 1, 9500)"
        );
        $this->db->conn->query(
            "INSERT INTO game_completions (user_id, mode, level_id, score)
             VALUES ('user1', 'blitz', 1, 8000)"
        );

        $_GET = ['user_id' => 'user1', 'mode' => 'classic'];

        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(1, $response);
        $this->assertSame('classic', $response[0]['mode']);
    }

    public function testListGamesWithLimit(): void
    {
        // Create multiple games
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        for ($i = 1; $i <= 10; $i++) {
            $this->db->conn->query(
                "INSERT INTO game_completions (user_id, mode, level_id, score)
                 VALUES ('user1', 'classic', $i, " . (9500 - $i * 100) . ")"
            );
        }

        $_GET = ['user_id' => 'user1', 'limit' => 3];

        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(3, $response);
    }

    public function testCreateSuccess(): void
    {
        // Create user first (foreign key requirement)
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 1,
            'score' => 9500,
            'moves' => 10,
            'elapsed_seconds' => 25.5
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new GameController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected from jsonResponse
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('success', $response);
        $this->assertTrue($response['success']);

        // Verify the game was recorded in the database
        $stmt = $this->db->conn->prepare('SELECT score FROM game_completions WHERE user_id = ? AND level_id = ?');
        $stmt->bind_param('si', $userId, $levelId);
        $userId = 'user1';
        $levelId = 1;
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        $this->assertNotNull($row);
        $this->assertSame(9500, (int)$row['score']);
    }

    public function testCreateMissingFields(): void
    {
        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic'
            // missing level_id
        ]);

        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new GameController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing required fields', $response['error']);
    }
}
