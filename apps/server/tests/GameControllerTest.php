<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\GameController;

if (!class_exists('MockDatabase')) {
    require_once __DIR__ . '/RouterTest.php';
}

class GameControllerTest extends TestCase
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

    public function testListGamesMissingUserId(): void
    {
        $_GET = [];
        ob_start();
        try {
            (new GameController($this->db))->list();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing user_id', $response['error']);
    }

    public function testListGamesSuccess(): void
    {
        $_GET = ['user_id' => 'user1', 'limit' => 50];
        $this->markTestSkipped('GameController->list() requires live mysqli conn.');
    }

    public function testListGamesWithMode(): void
    {
        $_GET = ['user_id' => 'user1', 'mode' => 'classic', 'limit' => 50];
        $this->markTestSkipped('GameController->list() requires live mysqli conn.');
    }
}
