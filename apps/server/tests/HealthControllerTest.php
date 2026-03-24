<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\HealthController;
use Pressure\Database;

class HealthControllerTest extends TestCase
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

        if (!function_exists('jsonResponse')) {
            eval('function jsonResponse(int $code, mixed $data): never {
                http_response_code($code);
                echo json_encode($data);
                throw new \RuntimeException("exit:". $code);
            }');
        }
    }

    public function testGetHealthCheck(): void
    {
        ob_start();
        try {
            (new HealthController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('status', $response);
        $this->assertSame('ok', $response['status']);
        $this->assertArrayHasKey('time', $response);
        $this->assertArrayHasKey('database', $response);
        $this->assertSame('connected', $response['database']);
    }
}
