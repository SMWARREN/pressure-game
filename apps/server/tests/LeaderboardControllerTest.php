<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\LeaderboardController;

class LeaderboardControllerTest extends TestCase
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

    public function testGetLegacySuccess(): void
    {
        $_GET = ['limit' => 50];
        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('classic');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertIsArray($response);
    }

    public function testGetLegacyMissingMode(): void
    {
        ob_start();
        try {
            (new LeaderboardController($this->db))->getLegacy('');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing mode', $response['error']);
    }

    public function testGetNewSuccess(): void
    {
        $_GET = ['limit' => 100];
        // Skip because get() requires a real mysqli connection
        $this->markTestSkipped('LeaderboardController->get() requires live mysqli conn.');
    }
}
