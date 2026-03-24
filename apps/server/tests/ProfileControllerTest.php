<?php

require_once __DIR__ . '/InputStreamWrapper.php';

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
        $payload = json_encode(['username' => 'newname']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->update('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }

    public function testUpdateProfileMissingUserId(): void
    {
        $payload = json_encode(['username' => 'test']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->update('');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testUpdateProfileMissingUsername(): void
    {
        $payload = json_encode([]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->update('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing username', $response['error']);
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

    public function testGetProfileMissingUserIdReturnsError(): void
    {
        ob_start();
        try {
            (new ProfileController($this->db))->get('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing userId', $response['error']);
    }

    public function testUpdateProfileWithEmptyUsername(): void
    {
        $payload = json_encode(['username' => '']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->update('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing username', $response['error']);
    }

    public function testUpdateStatsMissingUserId(): void
    {
        $payload = json_encode(['maxCombo' => 50]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->updateStats('');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testUpdateStatsSuccess(): void
    {
        // Ensure user exists
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode([
            'maxCombo' => 50,
            'wallsSurvived' => 100,
            'noResetStreak' => 5,
            'speedLevels' => 2,
            'perfectLevels' => 1,
            'daysPlayed' => 10
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new ProfileController($this->db))->updateStats('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);

        // Verify stats were updated in user_profiles table
        $stmt = $this->db->conn->prepare('SELECT max_combo FROM user_profiles WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $userId = 'user1';
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        $this->assertSame(50, (int)$row['max_combo']);
    }
}
