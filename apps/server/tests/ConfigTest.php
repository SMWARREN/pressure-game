<?php

use PHPUnit\Framework\TestCase;
use Pressure\Config;

class ConfigTest extends TestCase
{
    private string $tempEnvFile;

    protected function setUp(): void
    {
        // Create a temporary .env file for testing
        $this->tempEnvFile = tempnam(sys_get_temp_dir(), 'test_env_');
    }

    protected function tearDown(): void
    {
        // Clean up temp file
        if (file_exists($this->tempEnvFile)) {
            unlink($this->tempEnvFile);
        }
    }

    public function testLoadEnvLoadsFromFile(): void
    {
        $content = "TEST_KEY=test_value\n";
        file_put_contents($this->tempEnvFile, $content);

        Config::loadEnv($this->tempEnvFile);
        $result = Config::get('TEST_KEY');

        $this->assertSame('test_value', $result);
    }

    public function testLoadEnvWithNonExistentFile(): void
    {
        // Should not throw, just load empty env
        Config::loadEnv('/nonexistent/path/.env');
        $result = Config::get('NONEXISTENT_KEY', 'default');

        $this->assertSame('default', $result);
    }

    public function testGetReturnsEnvironmentVariable(): void
    {
        // Set a system environment variable
        putenv('TEST_SYS_VAR=system_value');

        $result = Config::get('TEST_SYS_VAR');

        $this->assertSame('system_value', $result);

        // Clean up
        putenv('TEST_SYS_VAR');
    }

    public function testGetReturnsDefault(): void
    {
        $result = Config::get('NONEXISTENT_KEY_XYZ', 'my_default');

        $this->assertSame('my_default', $result);
    }

    public function testGetDbConfig(): void
    {
        $config = Config::getDbConfig();

        $this->assertIsArray($config);
        $this->assertArrayHasKey('host', $config);
        $this->assertArrayHasKey('port', $config);
        $this->assertArrayHasKey('user', $config);
        $this->assertArrayHasKey('pass', $config);
        $this->assertArrayHasKey('name', $config);

        // Verify types
        $this->assertIsString($config['host']);
        $this->assertIsInt($config['port']);
        $this->assertIsString($config['user']);
        $this->assertIsString($config['pass']);
        $this->assertIsString($config['name']);
    }

    public function testGetDbConfigUsesDefaults(): void
    {
        $config = Config::getDbConfig();

        // Should have default values if env vars not set
        $this->assertSame('localhost', $config['host']);
        $this->assertSame(3306, $config['port']);
    }

    public function testGetLevels(): void
    {
        $levels = Config::getLevels();

        $this->assertIsArray($levels);
        $this->assertCount(10, $levels);

        // Check that levels are mapped correctly
        $this->assertSame('easy', $levels[1]);
        $this->assertSame('easy', $levels[2]);
        $this->assertSame('easy', $levels[3]);
        $this->assertSame('medium', $levels[4]);
        $this->assertSame('hard', $levels[10]);
    }

    public function testGetScoreMultipliers(): void
    {
        $multipliers = Config::getScoreMultipliers();

        $this->assertIsArray($multipliers);
        $this->assertArrayHasKey('classic', $multipliers);
        $this->assertArrayHasKey('blitz', $multipliers);
        $this->assertArrayHasKey('zen', $multipliers);

        // Check classic multipliers
        $this->assertSame(1.0, $multipliers['classic']['easy']);
        $this->assertSame(1.5, $multipliers['classic']['medium']);
        $this->assertSame(2.0, $multipliers['classic']['hard']);

        // Check blitz multipliers (should be double classic)
        $this->assertSame(2.0, $multipliers['blitz']['easy']);
        $this->assertSame(3.0, $multipliers['blitz']['medium']);
        $this->assertSame(4.0, $multipliers['blitz']['hard']);
    }
}
