<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase as PHPUnitTestCase;
use Pressure\Database;

abstract class TestCase extends PHPUnitTestCase
{
    protected Database $db;

    protected function setUp(): void
    {
        $this->db = new Database(
            'localhost',
            3306,
            'root',
            'root',
            'saintsea_pressure_test'
        );

        $this->clearDatabase();
        $this->setupJsonResponse();
    }

    protected function clearDatabase(): void
    {
        $tables = [
            'game_completions',
            'user_achievements',
            'user_stats',
            'replays',
            'leaderboard_cache',
            'highscores',
            'game_data',
            'user_profiles',
            'achievements',
            'users'
        ];

        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 0");
        foreach ($tables as $table) {
            $this->db->conn->query("TRUNCATE TABLE `$table`");
        }
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 1");
    }

    protected function setupJsonResponse(): void
    {
        if (!function_exists('jsonResponse')) {
            eval('function jsonResponse(int $code, mixed $data): never {
                http_response_code($code);
                echo json_encode($data);
                throw new \RuntimeException("exit:". $code);
            }');
        }
    }

    protected function callController(callable $controller): mixed
    {
        ob_start();
        try {
            $controller();
        } catch (\RuntimeException $e) {
            // Expected - jsonResponse throws
        }
        $output = ob_get_clean();
        return json_decode((string) $output, true);
    }
}
