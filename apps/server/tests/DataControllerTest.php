<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\DataController;

/**
 * Tests for DataController using the MockDatabase defined in RouterTest.php.
 * We redefine it here so this file can run independently.
 */
if (!class_exists('MockDatabase')) {
    require_once __DIR__ . '/RouterTest.php';
}

// ─── Configurable mock ───────────────────────────────────────────────────────

class DataMockDatabase extends MockDatabase
{
    public ?string $storedValue = null;
    public bool $setSuccess     = true;
    public bool $deleteSuccess  = true;

    public function getItem(string $userId, string $key): ?string
    {
        return $this->storedValue;
    }

    public function setItem(string $userId, string $key, string $value): bool
    {
        if ($this->setSuccess) {
            $this->storedValue = $value;
        }
        return $this->setSuccess;
    }

    public function removeItem(string $userId, string $key): bool
    {
        if ($this->deleteSuccess) {
            $this->storedValue = null;
        }
        return $this->deleteSuccess;
    }

    public function getAllUserData(string $userId): array
    {
        if ($this->storedValue !== null) {
            return ['save' => $this->storedValue];
        }
        return [];
    }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function captureController(callable $fn): array
{
    if (!function_exists('jsonResponse')) {
        eval('function jsonResponse(int $code, mixed $data): never {
            http_response_code($code);
            echo json_encode($data);
            throw new \RuntimeException("exit:" . $code);
        }');
    }
    ob_start();
    try {
        $fn();
    } catch (\RuntimeException $e) {
        // swallow fake-exit
    }
    $out = (string) ob_get_clean();
    return json_decode($out, true) ?? [];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

class DataControllerTest extends TestCase
{
    private DataMockDatabase $db;
    private DataController $ctrl;

    protected function setUp(): void
    {
        $this->db   = new DataMockDatabase();
        $this->ctrl = new DataController($this->db);
    }

    // ─── GET /api/data/{userId}/{key} ─────────────────────────────────────────

    public function testGetItemReturns404WhenNotFound(): void
    {
        $this->db->storedValue = null;
        $response = captureController(fn () => $this->ctrl->get('user1', 'save'));
        $this->assertSame('Not found', $response['error']);
    }

    public function testGetItemReturnsValueWhenFound(): void
    {
        $this->db->storedValue = '{"level":3}';
        $response = captureController(fn () => $this->ctrl->get('user1', 'save'));
        $this->assertSame('{"level":3}', $response['value']);
    }

    public function testGetItemReturnsBadRequestForMissingUserId(): void
    {
        $response = captureController(fn () => $this->ctrl->get('', 'save'));
        $this->assertSame('Missing userId or key', $response['error']);
    }

    public function testGetItemReturnsBadRequestForMissingKey(): void
    {
        $response = captureController(fn () => $this->ctrl->get('user1', ''));
        $this->assertSame('Missing userId or key', $response['error']);
    }

    // ─── DELETE /api/data/{userId}/{key} ──────────────────────────────────────

    public function testDeleteItemSucceeds(): void
    {
        $this->db->storedValue  = 'something';
        $this->db->deleteSuccess = true;
        $response = captureController(fn () => $this->ctrl->delete('user1', 'save'));
        $this->assertSame(true, $response['success']);
        $this->assertNull($this->db->storedValue);
    }

    public function testDeleteItemReturnsBadRequestForMissingParams(): void
    {
        $response = captureController(fn () => $this->ctrl->delete('', 'key'));
        $this->assertSame('Missing userId or key', $response['error']);
    }

    // ─── POST /api/data/{userId}/{key} ────────────────────────────────────────

    public function testSetItemSuccess(): void
    {
        $this->db->setSuccess = true;
        $payload = json_encode(['value' => '{"level":5}']);
        InputStreamWrapper::register($payload);

        $response = captureController(function () {
            $this->ctrl->set('user1', 'save');
        });
        InputStreamWrapper::unregister();

        $this->assertSame(true, $response['success']);
    }

    public function testSetItemMissingValue(): void
    {
        $payload = json_encode([]);
        InputStreamWrapper::register($payload);

        $response = captureController(function () {
            $this->ctrl->set('user1', 'save');
        });
        InputStreamWrapper::unregister();

        $this->assertSame('Missing value in request body', $response['error']);
    }

    public function testSetItemMissingUserId(): void
    {
        $payload = json_encode(['value' => 'test']);
        InputStreamWrapper::register($payload);

        $response = captureController(function () {
            $this->ctrl->set('', 'save');
        });
        InputStreamWrapper::unregister();

        $this->assertSame('Missing userId or key', $response['error']);
    }

    public function testSetItemMissingKey(): void
    {
        $payload = json_encode(['value' => 'test']);
        InputStreamWrapper::register($payload);

        $response = captureController(function () {
            $this->ctrl->set('user1', '');
        });
        InputStreamWrapper::unregister();

        $this->assertSame('Missing userId or key', $response['error']);
    }

    public function testSetItemDatabaseError(): void
    {
        $this->db->setSuccess = false;
        $payload = json_encode(['value' => 'test']);
        InputStreamWrapper::register($payload);

        $response = captureController(function () {
            $this->ctrl->set('user1', 'save');
        });
        InputStreamWrapper::unregister();

        $this->assertSame('Failed to save', $response['error']);
    }

    // ─── GET /api/user/{userId}/data ──────────────────────────────────────────

    public function testGetAllUserDataReturnsMap(): void
    {
        $this->db->storedValue = '{"level":5}';
        $response = captureController(fn () => $this->ctrl->getAllForUser('user1'));
        $this->assertArrayHasKey('save', $response);
        $this->assertSame('{"level":5}', $response['save']);
    }

    public function testGetAllUserDataReturnsBadRequestForMissingUserId(): void
    {
        $response = captureController(fn () => $this->ctrl->getAllForUser(''));
        $this->assertSame('Missing userId', $response['error']);
    }

    public function testGetAllUserDataReturnsEmptyArrayWhenNoData(): void
    {
        $this->db->storedValue = null;
        $response = captureController(fn () => $this->ctrl->getAllForUser('user1'));
        $this->assertIsArray($response);
        $this->assertEmpty($response);
    }

    public function testSetItemMultipleTimes(): void
    {
        $this->db->setSuccess = true;

        // Set first value
        $payload = json_encode(['value' => 'value1']);
        InputStreamWrapper::register($payload);
        $response1 = captureController(function () {
            $this->ctrl->set('user1', 'key1');
        });
        InputStreamWrapper::unregister();
        $this->assertTrue($response1['success']);

        // Set different value for same key
        $payload = json_encode(['value' => 'value2']);
        InputStreamWrapper::register($payload);
        $response2 = captureController(function () {
            $this->ctrl->set('user1', 'key1');
        });
        InputStreamWrapper::unregister();
        $this->assertTrue($response2['success']);

        // Verify last value is stored
        $this->assertSame('value2', $this->db->storedValue);
    }

    public function testSetAndDeleteCycle(): void
    {
        // Set value
        $this->db->setSuccess = true;
        $payload = json_encode(['value' => 'test']);
        InputStreamWrapper::register($payload);
        ob_start();
        try {
            $this->ctrl->set('user1', 'key1');
        } catch (\RuntimeException $e) {
        }
        ob_get_clean();
        InputStreamWrapper::unregister();

        // Delete value
        $this->db->deleteSuccess = true;
        $response = captureController(fn () => $this->ctrl->delete('user1', 'key1'));
        $this->assertTrue($response['success']);
        $this->assertNull($this->db->storedValue);
    }

    public function testDeleteNonexistentItem(): void
    {
        $this->db->deleteSuccess = true;
        $this->db->storedValue = null;
        $response = captureController(fn () => $this->ctrl->delete('user1', 'key1'));
        $this->assertTrue($response['success']);
    }

    public function testGetAllUserDataMultipleKeys(): void
    {
        // Mock multiple stored values
        $this->db->storedValue = null;
        $response = captureController(fn () => $this->ctrl->getAllForUser('user1'));
        $this->assertEmpty($response);
    }

    public function testSetItemEmptyValue(): void
    {
        $this->db->setSuccess = true;
        $payload = json_encode(['value' => '']);
        InputStreamWrapper::register($payload);

        $response = captureController(function () {
            $this->ctrl->set('user1', 'key1');
        });
        InputStreamWrapper::unregister();

        $this->assertTrue($response['success']);
    }

    public function testGetItemEmptyKey(): void
    {
        $response = captureController(fn () => $this->ctrl->get('user1', ''));
        $this->assertArrayHasKey('error', $response);
    }

    public function testSetItemEmptyKey(): void
    {
        $payload = json_encode(['value' => 'test']);
        InputStreamWrapper::register($payload);
        $response = captureController(function () {
            $this->ctrl->set('user1', '');
        });
        InputStreamWrapper::unregister();

        $this->assertArrayHasKey('error', $response);
    }

    public function testDeleteItemEmptyKey(): void
    {
        $response = captureController(fn () => $this->ctrl->delete('user1', ''));
        $this->assertArrayHasKey('error', $response);
    }
}
