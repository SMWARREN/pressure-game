<?php

use PHPUnit\Framework\TestCase;
use Pressure\Controllers\AchievementController;

class AchievementControllerTest extends TestCase
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

    public function testUnlockSuccess(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('user1', 'ach1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertIsArray($response);
    }

    public function testUnlockMissingParams(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('', '');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
    }

    public function testUnlockMissingUserId(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('', 'ach1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
    }

    public function testUnlockMissingAchievementId(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->unlock('user1', '');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
    }

    public function testUnlockFailure(): void
    {
        // Mock failure
        $dbMock = new class extends MockDatabase {
            public function unlockAchievement(string $userId, string $achievementId): bool {
                return false;
            }
        };

        ob_start();
        try {
            (new AchievementController($dbMock))->unlock('user1', 'ach1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Failed to unlock achievement', $response['error']);
    }

    public function testGetForUserSuccess(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->getForUser('user1');
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertIsArray($response);
    }

    public function testGetAllAchievements(): void
    {
        ob_start();
        try {
            (new AchievementController($this->db))->getAll();
        } catch (\RuntimeException $e) {
            // Expected
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);
        $this->assertIsArray($response);
    }

    public function testUnlockNewSuccess(): void
    {
        $this->markTestSkipped('unlockNew() requires live mysqli conn.');
    }

    public function testGetForUserNewSuccess(): void
    {
        $this->markTestSkipped('getForUserNew() requires live mysqli conn.');
    }
}
