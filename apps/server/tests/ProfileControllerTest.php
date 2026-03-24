<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\ProfileController;
use Pressure\Database;

class ProfileControllerTest extends TestCase
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

    public function testGetProfileSuccess(): void
    {
        $this->db->ensureUserProfile('user1');
        $this->db->updateUserUsername('user1', 'alice');

        ob_start();
        try {
            (new ProfileController($this->db))->get('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('user_id', $response);
        $this->assertSame('user1', $response['user_id']);
    }

    public function testGetProfileMissingUserId(): void
    {
        ob_start();
        try {
            (new ProfileController($this->db))->get('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('error', $response);
    }

    public function testUpdateProfileSuccess(): void
    {
        $_POST = ['username' => 'newname'];

        ob_start();
        try {
            (new ProfileController($this->db))->update('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testUpdateProfileMissingUserId(): void
    {
        $_POST = ['username' => 'test'];

        ob_start();
        try {
            (new ProfileController($this->db))->update('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testWinsSuccess(): void
    {
        $_GET = [];
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);

        ob_start();
        try {
            (new ProfileController($this->db))->wins('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testGetFullProfile(): void
    {
        $this->db->ensureUserProfile('user1');

        ob_start();
        try {
            (new ProfileController($this->db))->getFull('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testGetFullProfileMissingUserId(): void
    {
        ob_start();
        try {
            (new ProfileController($this->db))->getFull('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetFullProfileHasAllFields(): void
    {
        $this->db->ensureUserProfile('user1');

        ob_start();
        try {
            (new ProfileController($this->db))->getFull('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('profile', $response);
        $this->assertArrayHasKey('achievements', $response);
        $this->assertArrayHasKey('wins', $response);
    }

    public function testWinsMissingUserId(): void
    {
        $_GET = [];
        ob_start();
        try {
            (new ProfileController($this->db))->wins('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testWinsWithLimit(): void
    {
        $_GET = ['limit' => '10'];
        $this->db->saveHighscore('user1', 'classic', 1, 10, 25.5, 9500);

        ob_start();
        try {
            (new ProfileController($this->db))->wins('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
    }

    public function testUpdateStatsMissingUserId(): void
    {
        ob_start();
        try {
            (new ProfileController($this->db))->updateStats('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }
}
