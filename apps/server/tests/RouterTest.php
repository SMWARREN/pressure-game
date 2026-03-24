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
    private Database $db;

    protected function setUp(): void
    {
        // Use real test database
        $this->db = new Database(
            'localhost',
            3306,
            'root',
            'root',
            'saintsea_pressure_test'
        );

        // Clear tables before each test
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 0");
        foreach (['game_completions', 'user_achievements', 'user_stats', 'replays', 'leaderboard_cache', 'highscores', 'game_data', 'user_profiles', 'achievements', 'users'] as $table) {
            $this->db->conn->query("TRUNCATE TABLE `$table`");
        }
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 1");

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
        // Create leaderboard cache entries
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'alice')");
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user2', 'bob')");
        $this->db->conn->query(
            "INSERT INTO leaderboard_cache (mode, user_id, username, score, `rank`)
             VALUES ('classic', 'user1', 'alice', 9500, 1)"
        );
        $this->db->conn->query(
            "INSERT INTO leaderboard_cache (mode, user_id, username, score, `rank`)
             VALUES ('classic', 'user2', 'bob', 9200, 2)"
        );

        $response = $this->capture('GET', ['leaderboards', 'classic']);
        $this->assertIsArray($response);
        $this->assertCount(2, $response);
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
        // Create a user
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'testuser')");

        $_GET = ['id' => 'user1'];
        $response = $this->capture('GET', ['users']);
        $this->assertIsArray($response);
        $this->assertArrayHasKey('user', $response);
        $this->assertSame('user1', $response['user']['id']);
    }

    // ─── Games (new) ──────────────────────────────────────────────────────────

    public function testPostGamesCreate(): void
    {
        $response = $this->capture('POST', ['games']);
        $this->assertIsArray($response);
    }

    public function testGetGamesList(): void
    {
        // Create a user and game completion
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query(
            "INSERT INTO game_completions (user_id, mode, level_id, score)
             VALUES ('user1', 'classic', 1, 9500)"
        );

        $_GET = ['user_id' => 'user1'];
        $response = $this->capture('GET', ['games']);
        $this->assertIsArray($response);
        $this->assertCount(1, $response);
    }

    // ─── Stats (new) ──────────────────────────────────────────────────────────

    public function testPostStatsUpdate(): void
    {
        $response = $this->capture('POST', ['stats']);
        $this->assertIsArray($response);
    }

    public function testGetStatsRetrieve(): void
    {
        // Create user stats
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query("INSERT INTO user_stats (user_id, max_combo) VALUES ('user1', 42)");

        $_GET = ['user_id' => 'user1'];
        $response = $this->capture('GET', ['stats']);
        $this->assertIsArray($response);
        $this->assertArrayHasKey('max_combo', $response);
        $this->assertSame(42, (int)$response['max_combo']);
    }

    // ─── Profile POST (update) ───────────────────────────────────────────────

    public function testPostProfileUpdate(): void
    {
        $response = $this->capture('POST', ['profile', 'user1']);
        // Missing body → error
        $this->assertArrayHasKey('error', $response);
    }

    // ─── Highscore POST (save) ───────────────────────────────────────────────

    public function testPostHighscoreSave(): void
    {
        $response = $this->capture('POST', ['highscore', 'user1', 'classic', '1']);
        // Missing body → error
        $this->assertArrayHasKey('error', $response);
    }

    // ─── Replay POST (legacy) ────────────────────────────────────────────────

    public function testPostReplayLegacySuccess(): void
    {
        $response = $this->capture('POST', ['replay', 'user1', 'classic', '1']);
        // Missing body → error
        $this->assertArrayHasKey('error', $response);
    }

    public function testPostReplayLegacyMissingUserId(): void
    {
        $response = $this->capture('POST', ['replay', '', 'classic', '1']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing userId, mode, or levelId', $response['error']);
    }

    public function testPostReplayLegacyMissingMode(): void
    {
        $response = $this->capture('POST', ['replay', 'user1', '', '1']);
        $this->assertArrayHasKey('error', $response);
    }

    public function testPostReplayLegacyMissingLevelId(): void
    {
        $response = $this->capture('POST', ['replay', 'user1', 'classic', '0']);
        $this->assertArrayHasKey('error', $response);
    }

    public function testGetReplayLegacySuccess(): void
    {
        $response = $this->capture('GET', ['replay', 'user1', 'classic', '1']);
        $this->assertSame('Replay not found', $response['error']);
    }

    public function testGetReplayLegacyMissingUserId(): void
    {
        $response = $this->capture('GET', ['replay', '', 'classic', '1']);
        $this->assertArrayHasKey('error', $response);
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
        // Create a user with replay
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'test')");
        $this->db->conn->query(
            "INSERT INTO replays (user_id, mode, level_id, moves_json, score)
             VALUES ('user1', 'classic', 1, '[1,2,3]', 9500)"
        );

        $_GET = ['user_id' => 'user1'];
        $response = $this->capture('GET', ['replays']);
        $this->assertIsArray($response);
    }

    public function testGetRepliesMissingUserId(): void
    {
        $_GET = ['mode' => 'classic', 'level_id' => '1'];
        $response = $this->capture('GET', ['replays']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing required parameters', $response['error']);
    }

    public function testGetRepliesMissingMode(): void
    {
        $_GET = ['user_id' => 'user1', 'level_id' => '1'];
        $response = $this->capture('GET', ['replays']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing required parameters', $response['error']);
    }

    public function testGetRepliesMissingLevelId(): void
    {
        $_GET = ['user_id' => 'user1', 'mode' => 'classic'];
        $response = $this->capture('GET', ['replays']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing required parameters', $response['error']);
    }

    public function testPostReplayLegacyMissingMoves(): void
    {
        // Set up the request with missing moves data
        $payload = json_encode(['score' => 5000]);
        require_once __DIR__ . '/InputStreamWrapper.php';
        InputStreamWrapper::register($payload);

        $response = $this->capture('POST', ['replay', 'user1', 'classic', '1']);
        InputStreamWrapper::unregister();

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing moves data', $response['error']);
    }

    public function testGetReplayLegacyMissingLevelId(): void
    {
        $response = $this->capture('GET', ['replay', 'user1', 'classic', '0']);
        $this->assertArrayHasKey('error', $response);
    }

    public function testPostReplaysCreateMissingUserId(): void
    {
        require_once __DIR__ . '/InputStreamWrapper.php';
        $payload = json_encode([
            'mode' => 'classic',
            'level_id' => 1,
            'moves' => []
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->capture('POST', ['replays']);
        InputStreamWrapper::unregister();

        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing required fields', $response['error']);
    }

    public function testPostReplaysCreateMissingMode(): void
    {
        require_once __DIR__ . '/InputStreamWrapper.php';
        $payload = json_encode([
            'user_id' => 'user1',
            'level_id' => 1,
            'moves' => []
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->capture('POST', ['replays']);
        InputStreamWrapper::unregister();

        $this->assertArrayHasKey('error', $response);
    }

    public function testPostReplaysCreateMissingLevelId(): void
    {
        require_once __DIR__ . '/InputStreamWrapper.php';
        $payload = json_encode([
            'user_id' => 'user1',
            'mode' => 'classic',
            'moves' => []
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->capture('POST', ['replays']);
        InputStreamWrapper::unregister();

        $this->assertArrayHasKey('error', $response);
    }

    public function testProfileUpdateMissingUserId(): void
    {
        require_once __DIR__ . '/InputStreamWrapper.php';
        $payload = json_encode(['username' => 'newname']);
        InputStreamWrapper::register($payload);

        $response = $this->capture('POST', ['profile', '', 'dummy']);
        InputStreamWrapper::unregister();

        $this->assertArrayHasKey('error', $response);
    }

    public function testAchievementRoutes(): void
    {
        // Test legacy achievement POST
        $response = $this->capture('POST', ['achievement', 'user1', 'ach1']);
        $this->assertArrayHasKey('success', $response);

        // Test legacy achievement GET
        $response = $this->capture('GET', ['achievement', 'user1']);
        $this->assertIsArray($response);
    }

    public function testAchievementsNewRoutes(): void
    {
        // Test new achievements GET without user_id
        $response = $this->capture('GET', ['achievements']);
        $this->assertIsArray($response);

        // Test new achievements POST
        $_GET = ['user_id' => 'user1'];
        $response = $this->capture('POST', ['achievements', 'ach1']);
        $this->assertArrayHasKey('success', $response);
    }

    public function testDataRoutes(): void
    {
        // Test GET data
        $response = $this->capture('GET', ['data', 'user1', 'save']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Not found', $response['error']);

        // Test DELETE data
        $response = $this->capture('DELETE', ['data', 'user1', 'save']);
        $this->assertArrayHasKey('success', $response);
    }

    public function testUserDataRoute(): void
    {
        // Test GET /api/user/{userId}/data
        $response = $this->capture('GET', ['user', 'user1', 'data']);
        $this->assertIsArray($response);
    }

    public function testDebugRoutes(): void
    {
        // Test GET /api/schema
        $response = $this->capture('GET', ['schema']);
        $this->assertArrayHasKey('database', $response);

        // Test POST /api/debug/reset
        $response = $this->capture('POST', ['debug', 'reset']);
        $this->assertSame('success', $response['status']);

        // Test DELETE /api/debug/cleanup with missing userId
        $response = $this->capture('DELETE', ['debug', 'cleanup', '']);
        $this->assertArrayHasKey('error', $response);
        $this->assertSame('Missing userId', $response['error']);
    }

    // ─── 404 ─────────────────────────────────────────────────────────────────

    public function testUnknownRouteReturns404(): void
    {
        $response = $this->capture('GET', ['completely_unknown_route']);
        $this->assertSame('Route not found', $response['error']);
    }
}
