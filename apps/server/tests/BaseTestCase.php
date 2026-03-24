<?php

require_once __DIR__ . '/InputStreamWrapper.php';

use PHPUnit\Framework\TestCase;
use Pressure\Config;
use Pressure\Database;

/**
 * Base test case with common setup for database tests.
 * Uses environment variables via Config class for database credentials.
 */
abstract class BaseTestCase extends TestCase
{
    protected Database $db;

    protected function setUp(): void
    {
        // Get DB config from environment (via .env.test)
        $cfg = Config::getDbConfig();

        $this->db = new Database(
            $cfg['host'],
            $cfg['port'],
            $cfg['user'],
            $cfg['pass'],
            $cfg['name']
        );

        // Clear tables before each test
        $this->clearDatabase();

        // Define jsonResponse function for testing
        if (!function_exists('jsonResponse')) {
            eval('function jsonResponse(int $code, mixed $data): never {
                http_response_code($code);
                echo json_encode($data);
                throw new \RuntimeException("exit:". $code);
            }');
        }
    }

    protected function clearDatabase(): void
    {
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 0");
        foreach ([
            'game_completions', 'user_achievements', 'user_stats',
            'replays', 'leaderboard_cache', 'highscores', 'game_data',
            'user_profiles', 'achievements', 'users'
        ] as $table) {
            $this->db->conn->query("TRUNCATE TABLE `$table`");
        }
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 1");
    }
}
