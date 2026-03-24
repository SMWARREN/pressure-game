<?php

use PHPUnit\Framework\TestCase;
use Pressure\HealthController;
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
    }

    public function testGetHealthCheck(): void
    {
        $response = (new HealthController($this->db))->get();

        $this->assertIsArray($response);
        $this->assertArrayHasKey('status', $response);
        $this->assertSame('ok', $response['status']);
        $this->assertArrayHasKey('time', $response);
        $this->assertArrayHasKey('database', $response);
        $this->assertSame('connected', $response['database']);
    }
}
