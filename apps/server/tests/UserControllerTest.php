<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\UserController;
use Pressure\Database;

class UserControllerTest extends TestCase
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

    public function testCreateMissingUserId(): void
    {
        $payload = json_encode(['username' => 'testuser']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user ID', $response['error']);
    }

    public function testCreateSuccess(): void
    {
        $payload = json_encode([
            'id' => 'newuser',
            'username' => 'newname'
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('id', $response);
        $this->assertSame('newuser', $response['id']);
        $this->assertSame('newname', $response['username']);
    }

    public function testCreateIdempotent(): void
    {
        // Create user once
        $payload = json_encode([
            'id' => 'user1',
            'username' => 'alice'
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // Create same user again (INSERT IGNORE should succeed)
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('id', $response);
        $this->assertSame('user1', $response['id']);
    }

    public function testGetMissingUserId(): void
    {
        $_GET = [];
        ob_start();
        try {
            (new UserController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user ID', $response['error']);
    }

    public function testGetUserNotFound(): void
    {
        $_GET = ['id' => 'nonexistent'];
        ob_start();
        try {
            (new UserController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('User not found', $response['error']);
    }

    public function testGetUserExists(): void
    {
        // Create user directly
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'alice')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $_GET = ['id' => 'user1'];

        ob_start();
        try {
            (new UserController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('user', $response);
        $this->assertArrayHasKey('stats', $response);
        $this->assertSame('user1', $response['user']['id']);
        $this->assertSame('alice', $response['user']['username']);
    }

    public function testGetUserWithoutStats(): void
    {
        // Create user without stats
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user2', 'bob')");

        $_GET = ['id' => 'user2'];

        ob_start();
        try {
            (new UserController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('user', $response);
        $this->assertArrayHasKey('stats', $response);
        $this->assertIsArray($response['stats']);  // Should be empty array
    }

    public function testCreateWithUsername(): void
    {
        $payload = json_encode([
            'id' => 'user1',
            'username' => 'alice'
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertSame('alice', $response['username']);

        // Verify user was created in database
        $stmt = $this->db->conn->prepare('SELECT username FROM users WHERE id = ?');
        $stmt->bind_param('s', $userId);
        $userId = 'user1';
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        $this->assertNotNull($row);
        $this->assertSame('alice', $row['username']);
    }

    public function testCreateMissingUsername(): void
    {
        $payload = json_encode(['id' => 'user1']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('id', $response);
        $this->assertSame('user1', $response['id']);
    }

    public function testGetMultipleUsers(): void
    {
        // Create multiple users
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'alice')");
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user2', 'bob')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user2')");

        // Get first user
        $_GET = ['id' => 'user1'];
        ob_start();
        try {
            (new UserController($this->db))->get();
        } catch (\RuntimeException $e) {
        }
        $output1 = ob_get_clean();
        $response1 = json_decode((string) $output1, true);

        // Get second user
        $_GET = ['id' => 'user2'];
        ob_start();
        try {
            (new UserController($this->db))->get();
        } catch (\RuntimeException $e) {
        }
        $output2 = ob_get_clean();
        $response2 = json_decode((string) $output2, true);

        $this->assertSame('user1', $response1['user']['id']);
        $this->assertSame('user2', $response2['user']['id']);
        $this->assertNotEquals($response1['user']['id'], $response2['user']['id']);
    }

    public function testCreateMultipleUsers(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            $payload = json_encode([
                'id' => 'user' . $i,
                'username' => 'user' . $i
            ]);
            InputStreamWrapper::register($payload);

            ob_start();
            try {
                (new UserController($this->db))->create();
            } catch (\RuntimeException $e) {
            } finally {
                InputStreamWrapper::unregister();
            }
            ob_get_clean();
        }

        // Verify all three users exist
        for ($i = 1; $i <= 3; $i++) {
            $_GET = ['id' => 'user' . $i];
            ob_start();
            try {
                (new UserController($this->db))->get();
            } catch (\RuntimeException $e) {
            }
            $output = ob_get_clean();
            $response = json_decode((string) $output, true);

            $this->assertArrayHasKey('user', $response);
            $this->assertSame('user' . $i, $response['user']['id']);
        }
    }

    public function testCreateAndUpdateUsername(): void
    {
        // Create user with initial username
        $payload = json_encode([
            'id' => 'user1',
            'username' => 'oldname'
        ]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // Get user and verify username
        $_GET = ['id' => 'user1'];
        ob_start();
        try {
            (new UserController($this->db))->get();
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertSame('oldname', $response['user']['username']);
    }
}
