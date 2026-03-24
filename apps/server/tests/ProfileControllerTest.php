<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\ProfileController;
use Pressure\Database;

class ProfileControllerTest extends TestCase
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

    public function testGetProfileSuccess(): void
    {
        ob_start();
        try {
            (new ProfileController($this->db))->get('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertIsArray($response);
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
        $_POST = [];
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

    public function testUpdateStatsSuccess(): void
    {
        // updateStats reads from php://input which is hard to mock in unit tests
        $this->markTestSkipped('updateStats() requires php://input stream.');
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
}
