<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\StatsController;

if (!class_exists('MockDatabase')) {
    require_once __DIR__ . '/RouterTest.php';
}

class StatsControllerTest extends TestCase
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

    public function testUpdateMissingUserId(): void
    {
        ob_start();
        try {
            (new StatsController($this->db))->update();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user_id', $response['error']);
    }

    public function testUpdateSuccess(): void
    {
        $this->markTestSkipped('StatsController->update() requires live mysqli conn.');
    }

    public function testGetMissingUserId(): void
    {
        $_GET = [];
        ob_start();
        try {
            (new StatsController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user_id', $response['error']);
    }

    public function testGetSuccess(): void
    {
        $_GET = ['user_id' => 'user1'];
        $this->markTestSkipped('StatsController->get() requires live mysqli conn.');
    }
}
