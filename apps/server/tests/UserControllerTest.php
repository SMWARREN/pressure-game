<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\UserController;

if (!class_exists('MockDatabase')) {
    require_once __DIR__ . '/RouterTest.php';
}

class UserControllerTest extends TestCase
{
    private MockDatabase $db;

    protected function setUp(): void
    {
        $this->db = new MockDatabase();

        if (!function_exists('jsonResponse')) {
            eval('function jsonResponse(int $code, mixed $data): never {
                http_response_code($code);
                echo json_encode($data);
                throw new \RuntimeException("exit:" . $code);
            }');
        }
    }

    public function testCreateMissingUserId(): void
    {
        ob_start();
        try {
            (new UserController($this->db))->create();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user ID', $response['error']);
    }

    public function testCreateSuccess(): void
    {
        $this->markTestSkipped('UserController->create() requires live mysqli conn.');
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

    public function testGetSuccess(): void
    {
        $_GET = ['id' => 'user1'];
        $this->markTestSkipped('UserController->get() requires live mysqli conn.');
    }

    public function testGetUserNotFound(): void
    {
        $_GET = ['id' => 'nonexistent'];
        $this->markTestSkipped('UserController->get() requires live mysqli conn.');
    }
}
