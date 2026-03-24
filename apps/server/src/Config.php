<?php

namespace Pressure;

class Config
{
    /** @var array<string, string> */
    private static array $env = [];

    public static function loadEnv(string $path): void
    {
        if (file_exists($path)) {
            self::$env = parse_ini_file($path, false) ?: [];
        }
    }

    public static function get(string $key, string $default = ''): string
    {
        // .env file first, then system environment, then default
        if (isset(self::$env[$key])) {
            return (string) self::$env[$key];
        }
        $sysVal = getenv($key);
        if ($sysVal !== false) {
            return (string) $sysVal;
        }
        return $default;
    }

    /**
     * @return array{host: string, port: int, user: string, pass: string, name: string}
     */
    public static function getDbConfig(): array
    {
        return [
            'host' => self::get('MYSQL_HOST', 'localhost'),
            'port' => (int) self::get('MYSQL_PORT', '3306'),
            'user' => self::get('MYSQL_USER', 'saintsea_pressure'),
            'pass' => self::get('MYSQL_PASSWORD', 'pressurepressure'),
            'name' => self::get('MYSQL_DATABASE', 'saintsea_pressure-engine'),
        ];
    }

    /**
     * Level difficulty map.
     *
     * @return array<int, string>
     */
    public static function getLevels(): array
    {
        return [
            1 => 'easy', 2 => 'easy', 3 => 'easy',
            4 => 'medium', 5 => 'medium', 6 => 'medium', 7 => 'medium',
            8 => 'hard', 9 => 'hard', 10 => 'hard',
        ];
    }

    /**
     * Score multipliers keyed by mode → difficulty.
     *
     * @return array<string, array<string, float>>
     */
    public static function getScoreMultipliers(): array
    {
        return [
            'classic' => ['easy' => 1.0, 'medium' => 1.5, 'hard' => 2.0],
            'blitz'   => ['easy' => 2.0, 'medium' => 3.0, 'hard' => 4.0],
            'zen'     => ['easy' => 0.5, 'medium' => 1.0, 'hard' => 2.0],
        ];
    }
}
