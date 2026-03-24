<?php

require_once __DIR__ . '/TestCase.php';

use Pressure\Database;
use Pressure\Controllers\ControllerHelper;

/**
 * Test private methods and error paths using Reflection
 */
class ReflectionTests extends TestCase
{
    /**
     * Test Database::guardPrepare() with false (prepare failure)
     */
    public function testDatabaseGuardPrepareWithFailure(): void
    {
        // Use reflection to call private guardPrepare method
        $reflection = new ReflectionClass(Database::class);
        $method = $reflection->getMethod('guardPrepare');
        $method->setAccessible(true);

        // Test with false (simulates prepare failure)
        try {
            $result = $method->invoke($this->db, false);
            $this->fail('Should throw AppException');
        } catch (\Pressure\AppException $e) {
            $this->assertStringContainsString('Prepare failed', $e->getMessage());
        }
    }

    /**
     * Test Database::guardPrepare() with valid stmt
     */
    public function testDatabaseGuardPrepareWithValidStmt(): void
    {
        $reflection = new ReflectionClass(Database::class);
        $method = $reflection->getMethod('guardPrepare');
        $method->setAccessible(true);

        // Create a valid statement
        $stmt = $this->db->conn->prepare('SELECT 1');
        $result = $method->invoke($this->db, $stmt);

        $this->assertInstanceOf(\mysqli_stmt::class, $result);
    }

    /**
     * Test guardPrepare in ControllerHelper trait with valid statement
     */
    public function testControllerHelperGuardPrepareSuccess(): void
    {
        // Create a test controller using the trait
        require_once __DIR__ . '/../src/controllers/StatsController.php';

        $controller = new \Pressure\Controllers\StatsController($this->db);

        // Use reflection to call the protected method
        $reflection = new ReflectionClass(get_class($controller));
        $method = $reflection->getMethod('guardPrepare');
        $method->setAccessible(true);

        // Test with valid statement
        $stmt = $this->db->conn->prepare('SELECT 1');
        $result = $method->invoke($controller, $stmt);

        $this->assertInstanceOf(\mysqli_stmt::class, $result);
    }

    /**
     * Test prepare with query that has NULL/empty result set
     */
    public function testPrepareWithEmptyResultSet(): void
    {
        // Valid SQL but returns empty
        $stmt = $this->db->conn->prepare("SELECT * FROM users WHERE id = ?");
        $this->assertInstanceOf(\mysqli_stmt::class, $stmt);

        $userId = 'nonexistent';
        $stmt->bind_param('s', $userId);
        $result = $stmt->execute();

        $this->assertTrue($result);
        $stmt->close();
    }

    /**
     * Test execute failure by violating unique constraints
     */
    public function testExecuteFailureUniqueConstraint(): void
    {
        // Insert a user
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('duplicate_test', 'test')");

        // Try to insert duplicate
        $stmt = $this->db->conn->prepare("INSERT INTO users (id, username) VALUES (?, ?)");
        $this->assertInstanceOf(\mysqli_stmt::class, $stmt);

        $id = 'duplicate_test';
        $name = 'test2';
        $stmt->bind_param('ss', $id, $name);

        // This should throw or return false
        try {
            $result = $stmt->execute();
            // If we get here, execute returned false
            $this->assertFalse($result);
        } catch (\Exception $e) {
            // Duplicate key exception is also acceptable
            $this->assertStringContainsString('Duplicate', $e->getMessage());
        }
        $stmt->close();
    }

    /**
     * Test reflection on Database private methods
     */
    public function testDatabasePrivateMethods(): void
    {
        $reflection = new ReflectionClass(Database::class);

        // Check that private methods exist
        $guardPrepareMethod = $reflection->getMethod('guardPrepare');
        $this->assertTrue($guardPrepareMethod->isPrivate());

        // Get all methods
        $methods = $reflection->getMethods(\ReflectionMethod::IS_PRIVATE);
        $this->assertGreaterThan(0, count($methods));
    }

    /**
     * Test reflection on protected properties
     */
    public function testDatabaseReflectionAccess(): void
    {
        $reflection = new ReflectionClass(Database::class);
        $properties = $reflection->getProperties();

        // Verify structure
        $propertyNames = array_map(fn($p) => $p->getName(), $properties);
        $this->assertContains('conn', $propertyNames);
    }

    /**
     * Test error constant access via reflection
     */
    public function testDatabaseErrorConstants(): void
    {
        $reflection = new ReflectionClass(Database::class);
        $constants = $reflection->getConstants();

        // Should have error constants
        $this->assertGreaterThan(0, count($constants));
        $this->assertArrayHasKey('PREPARE_FAILED', $constants);
    }
}
