<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\HealthController;
use Pressure\Database;
use Pressure\Response;

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

        // Enable test mode for Response class
        Response::reset();
        Response::setTestMode(true);
    }

    protected function tearDown(): void
    {
        Response::reset();
    }

    public function testGetHealthCheck(): void
    {
        try {
            (new HealthController($this->db))->get();
        } catch (\RuntimeException $e) {
            // Expected - Response::json() throws
        }

        $output = Response::getTestOutput();
        $response = json_decode((string) $output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('status', $response);
        $this->assertSame('ok', $response['status']);
        $this->assertArrayHasKey('time', $response);
        $this->assertArrayHasKey('database', $response);
        $this->assertSame('connected', $response['database']);
    }
}
