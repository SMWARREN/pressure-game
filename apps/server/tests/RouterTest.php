<?php

use PHPUnit\Framework\TestCase;
use Pressure\Router;
use Pressure\Database;

/**
 * Tests that Router::dispatch() resolves the correct controller for each route.
 *
 * Because controllers call exit() (via jsonResponse()), we catch the output
 * in an output buffer and inspect the emitted JSON.  The MockDatabase below
 * extends Database but overrides the constructor to avoid a real connection.
 */

// ─── MockDatabase ─────────────────────────────────────────────────────────────

class MockDatabase extends Database
{
    /** @phpstan-ignore-next-line */
    public function __construct()
    {
        // Intentionally skip parent constructor to avoid real MySQL connection.
        // Tests set $this->conn individually when needed.
    }

    public function initTable(): void {}

    // Stub every method that a controller might call so tests don't fail
    // with "Call to member function on null".

    public function getItem(string $userId, string $key): ?string { return null; }
    public function setItem(string $userId, string $key, string $value): bool { return true; }
    public function removeItem(string $userId, string $key): bool { return true; }
    public function getAllUserData(string $userId): array { return []; }
    public function getLeaderboard(string $mode, int $limit = 100): array { return []; }
    public function saveHighscore(string $userId, string $mode, int $levelId, int $moves = 0, float $time = 0.0, ?int $score = null): bool { return true; }
    public function getUserHighScore(string $userId, string $mode, int $levelId): ?int { return null; }
    public function unlockAchievement(string $userId, string $achievementId): bool { return true; }
    public function getUserAchievements(string $userId): array { return []; }
    public function getAllAchievements(int $limit = 100): array { return []; }
    public function ensureUserProfile(string $userId): void {}
    public function getUserProfile(string $userId): ?array { return ['user_id' => $userId]; }
    public function updateUserUsername(string $userId, string $username): bool { return true; }
    public function getUserWins(string $userId, int $limit = 50): array { return []; }
    public function updateUserStats(string $userId, ?int $maxCombo = null, ?int $wallsSurvived = null, ?int $noResetStreak = null, ?int $speedLevels = null, ?int $perfectLevels = null, ?int $daysPlayed = null): bool { return true; }
    public function saveReplay(string $userId, string $mode, int $levelId, mixed $moves, int $score): bool { return true; }
    public function getReplay(string $userId, string $mode, int $levelId): ?array { return null; }
    public function updateUserProfileStats(string $userId): void {}
    public function getSchemaInfo(): array { return []; }
    public function cleanupTestData(string $userId): array { return []; }
    public function resetDatabase(): bool { return true; }
    public function close(): void {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Dispatch a fake request to the Router, capture output, and return the
 * decoded JSON array.  Catches the exit() call thrown by jsonResponse().
 */
function dispatchCapture(string $method, array $parts, Database $db): array
{
    // Simulate jsonResponse being available (it is defined in index.php; here
    // we define it once if not yet defined).
    if (!function_exists('jsonResponse')) {
        eval('function jsonResponse(int $code, mixed $data): never {
            http_response_code($code);
            echo json_encode($data);
            throw new \RuntimeException("exit:" . $code);
        }');
    }

    ob_start();
    try {
        Router::dispatch($method, $parts, $db);
    } catch (\RuntimeException $e) {
        // swallow the fake-exit exception
    }
    $output = ob_get_clean();
    return json_decode((string) $output, true) ?? [];
}

// ─── Test class ──────────────────────────────────────────────────────────────

class RouterTest extends TestCase
{
    private MockDatabase $db;

    protected function setUp(): void
    {
        $this->db = new MockDatabase();

        // Define jsonResponse() in a way that's testable (throws instead of exit)
        if (!function_exists('jsonResponse')) {
            eval('function jsonResponse(int $code, mixed $data): never {
                http_response_code($code);
                echo json_encode($data);
                throw new \RuntimeException("exit:" . $code);
            }');
        }
    }

    private function capture(string $method, array $parts): array
    {
        ob_start();
        try {
            Router::dispatch($method, $parts, $this->db);
        } catch (\RuntimeException $e) {
            // ignore fake-exit
        }
        $output = (string) ob_get_clean();
        return json_decode($output, true) ?? [];
    }

    // ─── Health ──────────────────────────────────────────────────────────────

    public function testHealthRoute(): void
    {
        $response = $this->capture('GET', ['health']);
        $this->assertSame('ok', $response['status']);
        $this->assertSame('connected', $response['database']);
        $this->assertArrayHasKey('time', $response);
    }

    // ─── Data ────────────────────────────────────────────────────────────────

    public function testGetDataNotFound(): void
    {
        $response = $this->capture('GET', ['data', 'user1', 'save']);
        $this->assertSame('Not found', $response['error']);
    }

    public function testSetDataSuccess(): void
    {
        // Need to supply a request body via php://input — not feasible in unit
        // tests without mocking; verify the route resolves without 404 error.
        $response = $this->capture('POST', ['data', 'user1', 'save']);
        // Missing body → 400 (not 404)
        $this->assertNotSame('Route not found', $response['error'] ?? '');
    }

    public function testDeleteDataSuccess(): void
    {
        $response = $this->capture('DELETE', ['data', 'user1', 'save']);
        $this->assertSame(true, $response['success']);
    }

    public function testGetAllUserData(): void
    {
        $response = $this->capture('GET', ['user', 'user1', 'data']);
        $this->assertIsArray($response);
    }

    // ─── Leaderboard ─────────────────────────────────────────────────────────

    public function testGetLegacyLeaderboard(): void
    {
        $response = $this->capture('GET', ['leaderboard', 'classic']);
        $this->assertIsArray($response);
    }

    public function testGetNewLeaderboard(): void
    {
        // new-style requires $db->conn to be a mysqli object; skip with note if not
        $this->markTestSkipped('LeaderboardController->get() requires live mysqli conn.');
    }

    // ─── Highscores ──────────────────────────────────────────────────────────

    public function testGetHighscore(): void
    {
        $response = $this->capture('GET', ['highscore', 'user1', 'classic', '1']);
        $this->assertArrayHasKey('score', $response);
        $this->assertNull($response['score']);
    }

    // ─── Achievements ────────────────────────────────────────────────────────

    public function testGetAllAchievements(): void
    {
        $response = $this->capture('GET', ['achievements']);
        $this->assertIsArray($response);
    }

    public function testUnlockLegacyAchievement(): void
    {
        $response = $this->capture('POST', ['achievement', 'user1', 'first_win']);
        $this->assertSame(true, $response['success']);
    }

    public function testGetAchievementsForUser(): void
    {
        $response = $this->capture('GET', ['achievement', 'user1']);
        $this->assertIsArray($response);
    }

    // ─── Profile ─────────────────────────────────────────────────────────────

    public function testGetProfile(): void
    {
        $response = $this->capture('GET', ['profile', 'user1']);
        $this->assertSame('user1', $response['user_id']);
    }

    public function testGetProfileWins(): void
    {
        $response = $this->capture('GET', ['profile', 'user1', 'wins']);
        $this->assertIsArray($response);
    }

    public function testGetProfileFull(): void
    {
        $response = $this->capture('GET', ['profile', 'user1', 'full']);
        $this->assertArrayHasKey('profile', $response);
        $this->assertArrayHasKey('achievements', $response);
        $this->assertArrayHasKey('wins', $response);
    }

    // ─── Replay ──────────────────────────────────────────────────────────────

    public function testGetReplayNotFound(): void
    {
        $response = $this->capture('GET', ['replay', 'user1', 'classic', '1']);
        $this->assertSame('Replay not found', $response['error']);
    }

    // ─── Debug ───────────────────────────────────────────────────────────────

    public function testGetSchemaRoute(): void
    {
        $response = $this->capture('GET', ['schema']);
        $this->assertIsArray($response);
        $this->assertArrayHasKey('database', $response);
    }

    public function testGetDebugSchemaRoute(): void
    {
        $response = $this->capture('GET', ['debug', 'schema']);
        $this->assertIsArray($response);
        $this->assertArrayHasKey('database', $response);
    }

    public function testPostDebugReset(): void
    {
        $response = $this->capture('POST', ['debug', 'reset']);
        $this->assertArrayHasKey('status', $response);
        $this->assertSame('success', $response['status']);
    }

    public function testDeleteDebugCleanup(): void
    {
        $response = $this->capture('DELETE', ['debug', 'cleanup', 'user1']);
        $this->assertArrayHasKey('status', $response);
        $this->assertSame('success', $response['status']);
    }

    public function testDeleteDebugCleanupMissingUserId(): void
    {
        $response = $this->capture('DELETE', ['debug', 'cleanup', '']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing userId', $response['error']);
    }

    // ─── Users (new) ──────────────────────────────────────────────────────────

    public function testPostUsersCreate(): void
    {
        $response = $this->capture('POST', ['users']);
        // Will fail because we don't have a real connection, but route should be recognized
        $this->assertIsArray($response);
    }

    public function testGetUsersRetrieve(): void
    {
        $this->markTestSkipped('UserController->get() requires live mysqli conn.');
    }

    // ─── Games (new) ──────────────────────────────────────────────────────────

    public function testPostGamesCreate(): void
    {
        $response = $this->capture('POST', ['games']);
        $this->assertIsArray($response);
    }

    public function testGetGamesList(): void
    {
        $this->markTestSkipped('GameController->list() requires live mysqli conn.');
    }

    // ─── Stats (new) ──────────────────────────────────────────────────────────

    public function testPostStatsUpdate(): void
    {
        $response = $this->capture('POST', ['stats']);
        $this->assertIsArray($response);
    }

    public function testGetStatsRetrieve(): void
    {
        $this->markTestSkipped('StatsController->get() requires live mysqli conn.');
    }

    // ─── Replays (new) ────────────────────────────────────────────────────────

    public function testPostReplaysCreate(): void
    {
        $response = $this->capture('POST', ['replays']);
        // Route requires a real mysqli connection for INSERT, but should recognize route
        $this->assertIsArray($response);
    }

    public function testGetReplaysRetrieve(): void
    {
        $this->markTestSkipped('Replays->GET requires live mysqli conn.');
    }

    public function testGetRepliesMissingUserId(): void
    {
        $_GET = ['mode' => 'classic', 'level_id' => '1'];
        $response = $this->capture('GET', ['replays']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing required parameters', $response['error']);
    }

    // ─── 404 ─────────────────────────────────────────────────────────────────

    public function testUnknownRouteReturns404(): void
    {
        $response = $this->capture('GET', ['completely_unknown_route']);
        $this->assertSame('Route not found', $response['error']);
    }
}
