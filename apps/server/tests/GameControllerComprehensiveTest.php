<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\GameController;
use Pressure\Database;

class GameControllerComprehensiveTest extends TestCase
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

    public function testCreateGameSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 1,
            'score' => 5000,
            'moves' => 10,
            'elapsed_seconds' => 25.5
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

        $this->assertTrue($response['success']);
    }

    public function testCreateGameWithoutScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'blitz',
            'level_id' => 2,
            'moves' => 5,
            'elapsed_seconds' => 15.0
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

        $this->assertTrue($response['success']);
    }

    public function testCreateGameMissingUserId(): void
    {
        $payload = json_encode([
            'mode' => 'classic',
            'level_id' => 1
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
    }

    public function testCreateGameMissingMode(): void
    {
        $payload = json_encode([
            'user_id' => 'user1',
            'level_id' => 1
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
    }

    public function testListGamesSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO game_completions (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 5000)");

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
        $this->assertCount(1, $response);
    }

    public function testListGamesWithMode(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO game_completions (user_id, mode, level_id, score) VALUES ('user1', 'classic', 1, 5000)");
        $this->db->conn->query("INSERT INTO game_completions (user_id, mode, level_id, score) VALUES ('user1', 'blitz', 2, 4000)");

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
        // Should only have classic mode
        foreach ($response as $game) {
            $this->assertSame('classic', $game['mode']);
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
    }

    public function testListGamesWithLimit(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");

        // Add multiple games
        for ($i = 1; $i <= 10; $i++) {
            $this->db->conn->query("INSERT INTO game_completions (user_id, mode, level_id, score) VALUES ('user1', 'classic', $i, 5000)");
        }

        $_GET = ['user_id' => 'user1', 'limit' => '5'];

        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertLessThanOrEqual(5, count($response));
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

    public function testCreateGameUpdatesBestScore(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        // Save first game with lower score
        $payload1 = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 1,
            'score' => 1000,
            'moves' => 20,
            'elapsed_seconds' => 30.0
        ]);
        InputStreamWrapper::register($payload1);
        ob_start();
        try {
            (new GameController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // Save second game with higher score
        $payload2 = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'level_id' => 1,
            'score' => 2000,
            'moves' => 15,
            'elapsed_seconds' => 25.0
        ]);
        InputStreamWrapper::register($payload2);
        ob_start();
        try {
            (new GameController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // List games for user
        $_GET = ['user_id' => 'user1'];
        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $games = json_decode((string) $output, true);

        // Should have highest score recorded
        $this->assertCount(1, $games);
        $this->assertSame(2000, $games[0]['score']);
    }

    public function testCreateGameDifferentModes(): void
    {
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");

        $modes = ['classic', 'blitz', 'zen'];
        foreach ($modes as $mode) {
            $payload = json_encode([
                'user_id' => 'user1',
                'mode' => $mode,
                'level_id' => 1,
                'score' => 5000,
                'moves' => 10,
                'elapsed_seconds' => 25.0
            ]);
            InputStreamWrapper::register($payload);
            ob_start();
            try {
                (new GameController($this->db))->create();
            } catch (\RuntimeException $e) {
            } finally {
                InputStreamWrapper::unregister();
            }
            ob_get_clean();
        }

        // Verify all modes are recorded
        $_GET = ['user_id' => 'user1'];
        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $games = json_decode((string) $output, true);

        $this->assertCount(3, $games);
        $recordedModes = array_unique(array_column($games, 'mode'));
        $this->assertCount(3, $recordedModes);
    }
}
