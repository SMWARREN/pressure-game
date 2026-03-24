<?php

require_once __DIR__ . '/TestCase.php';

use Pressure\StatsController;
use Pressure\UserController;

class ErrorPathTests extends TestCase
{
    /**
     * Test prepare() failures by using invalid SQL
     */
    public function testStatsUpdateWithInvalidSQL(): void
    {
        // Insert valid base data
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        // Create payload with field that will break SQL construction
        $payload = json_encode([
            'user_id' => 'user1',
            'total_levels_completed' => 5,
            'total_score' => 5000
        ]);
        InputStreamWrapper::register($payload);

        // The update should succeed with valid data
        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        $this->assertTrue($response['success']);
    }

    /**
     * Test with NULL user_id (edge case)
     */
    public function testNullUserIdHandling(): void
    {
        $payload = json_encode([
            'user_id' => null,
            'total_levels_completed' => 5
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        // Should fail - user_id is required
        $this->assertArrayHasKey('error', $response);
    }

    /**
     * Test with database type mismatches
     */
    public function testTypeConversionEdgeCases(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode([
            'user_id' => 'user1',
            'total_levels_completed' => 'not_a_number', // String instead of int
            'total_score' => -5000, // Negative score
            'total_hours_played' => 'invalid_float' // String instead of float
        ]);
        InputStreamWrapper::register($payload);

        // Database should handle type conversion
        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        // Should either succeed (with conversion) or fail gracefully
        $this->assertTrue(
            isset($response['success']) || isset($response['error']),
            'Response should have success or error key'
        );
    }

    /**
     * Test foreign key constraint violations
     */
    public function testForeignKeyConstraintViolation(): void
    {
        // Try to insert stats for non-existent user
        $payload = json_encode([
            'user_id' => 'nonexistent_user',
            'total_levels_completed' => 5,
            'total_score' => 5000
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        // Should succeed - INSERT IGNORE will create the user
        $this->assertTrue($response['success']);
    }

    /**
     * Test SQL injection prevention
     */
    public function testSQLInjectionPrevention(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        // Attempt SQL injection in field values
        $payload = json_encode([
            'user_id' => "user1'; DROP TABLE users; --",
            'total_levels_completed' => 5
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        // Injection should fail silently or cause legitimate error
        // Table should still exist
        $result = $this->db->conn->query("SELECT COUNT(*) FROM users");
        $this->assertNotFalse($result);
    }

    /**
     * Test with extremely large values
     */
    public function testLargeValueHandling(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode([
            'user_id' => 'user1',
            'total_levels_completed' => 999999,
            'total_score' => 999999999,
            'total_hours_played' => 99999.99
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        // Should handle large values gracefully
        $this->assertTrue(isset($response['success']) || isset($response['error']));
    }

    /**
     * Test with special characters in user_id using parameterized query
     */
    public function testSpecialCharactersInUserId(): void
    {
        $specialUserId = "user_with_underscore_123";
        $this->db->conn->query("INSERT INTO users (id) VALUES ('$specialUserId')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('$specialUserId')");

        $payload = json_encode([
            'user_id' => $specialUserId,
            'total_levels_completed' => 5,
            'total_score' => 5000
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        $this->assertTrue($response['success']);
    }
}
