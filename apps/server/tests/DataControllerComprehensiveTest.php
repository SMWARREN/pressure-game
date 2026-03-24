<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\DataController;
use Pressure\Database;

class DataControllerComprehensiveTest extends TestCase
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

    public function testSetItemSuccess(): void
    {
        $payload = json_encode(['value' => 'test_data']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new DataController($this->db))->set('user1', 'key1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);

        // Verify it was saved
        $value = $this->db->getItem('user1', 'key1');
        $this->assertSame('test_data', $value);
    }

    public function testGetItemNotFound(): void
    {
        ob_start();
        try {
            (new DataController($this->db))->get('user1', 'nonexistent');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Not found', $response['error']);
    }

    public function testGetItemSuccess(): void
    {
        // First set a value
        $this->db->setItem('user1', 'mykey', 'myvalue');

        ob_start();
        try {
            (new DataController($this->db))->get('user1', 'mykey');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('value', $response);
        $this->assertSame('myvalue', $response['value']);
    }

    public function testDeleteItemSuccess(): void
    {
        $this->db->setItem('user1', 'delkey', 'delvalue');

        ob_start();
        try {
            (new DataController($this->db))->delete('user1', 'delkey');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);

        // Verify it was deleted
        $value = $this->db->getItem('user1', 'delkey');
        $this->assertNull($value);
    }

    public function testGetAllForUserEmpty(): void
    {
        ob_start();
        try {
            (new DataController($this->db))->getAllForUser('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testGetAllForUserMultipleItems(): void
    {
        $this->db->setItem('user1', 'key1', 'value1');
        $this->db->setItem('user1', 'key2', 'value2');
        $this->db->setItem('user1', 'key3', 'value3');

        ob_start();
        try {
            (new DataController($this->db))->getAllForUser('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertCount(3, $response);
        $this->assertArrayHasKey('key1', $response);
        $this->assertArrayHasKey('key2', $response);
        $this->assertArrayHasKey('key3', $response);
    }

    public function testSetAndUpdateItem(): void
    {
        // Set initial value
        $payload1 = json_encode(['value' => 'original']);
        InputStreamWrapper::register($payload1);
        ob_start();
        try {
            (new DataController($this->db))->set('user1', 'key1');
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // Update with new value
        $payload2 = json_encode(['value' => 'updated']);
        InputStreamWrapper::register($payload2);
        ob_start();
        try {
            (new DataController($this->db))->set('user1', 'key1');
        } catch (\RuntimeException $e) {
        } finally {
            InputStreamWrapper::unregister();
        }
        ob_get_clean();

        // Verify updated value
        $value = $this->db->getItem('user1', 'key1');
        $this->assertSame('updated', $value);
    }

    public function testSetWithEmptyValue(): void
    {
        $payload = json_encode(['value' => null]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new DataController($this->db))->set('user1', 'key1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing value in request body', $response['error']);
    }

    public function testDeleteNonexistentItem(): void
    {
        ob_start();
        try {
            (new DataController($this->db))->delete('user1', 'nonexistent');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        // Should succeed even if key doesn't exist (idempotent)
        $this->assertTrue($response['success']);
    }

    public function testSetItemEmptyKey(): void
    {
        $payload = json_encode(['value' => 'somevalue']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new DataController($this->db))->set('user1', '');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetItemEmptyKey(): void
    {
        ob_start();
        try {
            (new DataController($this->db))->get('user1', '');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testDeleteItemEmptyKey(): void
    {
        ob_start();
        try {
            (new DataController($this->db))->delete('user1', '');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetAllForUserEmptyKey(): void
    {
        ob_start();
        try {
            (new DataController($this->db))->getAllForUser('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
    }

    public function testSetItemWithMissingValue(): void
    {
        $payload = json_encode(['other_field' => 'not_value']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new DataController($this->db))->set('user1', 'key1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing value in request body', $response['error']);
    }

    public function testMultipleUsersData(): void
    {
        // Set data for different users
        $this->db->setItem('user1', 'key1', 'user1_value');
        $this->db->setItem('user2', 'key1', 'user2_value');

        // Get data for user1
        ob_start();
        try {
            (new DataController($this->db))->get('user1', 'key1');
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertSame('user1_value', $response['value']);

        // Get data for user2
        ob_start();
        try {
            (new DataController($this->db))->get('user2', 'key1');
        } catch (\RuntimeException $e) {
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertSame('user2_value', $response['value']);
    }

    public function testSetLargValue(): void
    {
        $largeValue = str_repeat('x', 1000);
        $payload = json_encode(['value' => $largeValue]);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new DataController($this->db))->set('user1', 'largekey');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);

        // Verify large value was saved
        $value = $this->db->getItem('user1', 'largekey');
        $this->assertSame($largeValue, $value);
    }
}
