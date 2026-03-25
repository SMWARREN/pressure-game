<?php

namespace Pressure;

use Pressure\AchievementController;
use Pressure\DataController;
use Pressure\GameController;
use Pressure\HealthController;
use Pressure\HighscoreController;
use Pressure\LeaderboardController;
use Pressure\ProfileController;
use Pressure\StatsController;
use Pressure\UserController;

class Router
{
    /**
     * Guard against prepare failures — returns statement or calls jsonResponse with error
     */
    private static function guardPrepare(\mysqli_stmt|false $stmt, Database $db): \mysqli_stmt|false
    {
        if ($stmt === false) {
            jsonResponse(500, ['error' => 'Prepare failed: ' . $db->conn->error]);
        }
        return $stmt;
    }

    /**
     * Send a successful JSON response with the given data
     * This is called by dispatch() when a controller returns data
     */
    private static function respond(mixed $data, int $code = 200): never
    {
        Response::json($code, $data);
    }

    /**
     * Dispatch the request to the appropriate controller method.
     *
     * @param string   $method     HTTP method (GET, POST, DELETE, …)
     * @param string[] $parts      URL segments after /api/
     * @param Database $db
     */
    public static function dispatch(string $method, array $parts, Database $db): never
    {
        $n = count($parts);

        // ─── Health ──────────────────────────────────────────────────────────
        // GET /api/health
        if ($method === 'GET' && $n === 1 && $parts[0] === 'health') {
            self::respond((new HealthController($db))->get());
        }

        // ─── Key-Value Data ───────────────────────────────────────────────────
        // GET  /api/data/{userId}/{key}
        if ($method === 'GET' && $n === 3 && $parts[0] === 'data') {
            (new DataController($db))->get($parts[1], $parts[2]);
        }
        // POST /api/data/{userId}/{key}
        if ($method === 'POST' && $n === 3 && $parts[0] === 'data') {
            (new DataController($db))->set($parts[1], $parts[2]);
        }
        // DELETE /api/data/{userId}/{key}
        if ($method === 'DELETE' && $n === 3 && $parts[0] === 'data') {
            (new DataController($db))->delete($parts[1], $parts[2]);
        }
        // GET /api/user/{userId}/data
        if ($method === 'GET' && $n === 3 && $parts[0] === 'user' && $parts[2] === 'data') {
            (new DataController($db))->getAllForUser($parts[1]);
        }

        // ─── Leaderboards ─────────────────────────────────────────────────────
        // GET /api/leaderboard/{mode}  — legacy (highscores table)
        if ($method === 'GET' && $n === 2 && $parts[0] === 'leaderboard') {
            (new LeaderboardController($db))->getLegacy($parts[1]);
        }
        // GET /api/leaderboards/{mode} — new (leaderboard_cache table)
        if ($method === 'GET' && $n === 2 && $parts[0] === 'leaderboards') {
            (new LeaderboardController($db))->get($parts[1]);
        }

        // ─── Highscores ───────────────────────────────────────────────────────
        // POST /api/highscore/{userId}/{mode}/{levelId}
        if ($method === 'POST' && $n === 4 && $parts[0] === 'highscore') {
            (new HighscoreController($db))->save($parts[1], $parts[2], (int) $parts[3]);
        }
        // GET  /api/highscore/{userId}/{mode}/{levelId}
        if ($method === 'GET' && $n === 4 && $parts[0] === 'highscore') {
            (new HighscoreController($db))->get($parts[1], $parts[2], (int) $parts[3]);
        }

        // ─── Achievements (legacy /achievement/) ──────────────────────────────
        // POST /api/achievement/{userId}/{achievementId}
        if ($method === 'POST' && $n === 3 && $parts[0] === 'achievement') {
            (new AchievementController($db))->unlock($parts[1], $parts[2]);
        }
        // GET  /api/achievement/{userId}
        if ($method === 'GET' && $n === 2 && $parts[0] === 'achievement') {
            (new AchievementController($db))->getForUser($parts[1]);
        }

        // ─── Achievements (new /achievements/) ────────────────────────────────
        // GET /api/achievements  (no user_id → global stats)
        if ($method === 'GET' && $n === 1 && $parts[0] === 'achievements' && !isset($_GET['user_id'])) {
            (new AchievementController($db))->getAll();
        }
        // GET /api/achievements?user_id=...  (new-style, user_achievements table)
        if ($method === 'GET' && $n === 1 && $parts[0] === 'achievements' && isset($_GET['user_id'])) {
            (new AchievementController($db))->getForUserNew();
        }
        // POST /api/achievements/{id}?user_id=...
        if ($method === 'POST' && $n === 2 && $parts[0] === 'achievements') {
            (new AchievementController($db))->unlockNew($parts[1]);
        }

        // ─── Profiles ─────────────────────────────────────────────────────────
        // GET  /api/profile/{userId}
        if ($method === 'GET' && $n === 2 && $parts[0] === 'profile') {
            (new ProfileController($db))->get($parts[1]);
        }
        // POST /api/profile/{userId}
        if ($method === 'POST' && $n === 2 && $parts[0] === 'profile') {
            (new ProfileController($db))->update($parts[1]);
        }
        // GET  /api/profile/{userId}/wins
        if ($method === 'GET' && $n === 3 && $parts[0] === 'profile' && $parts[2] === 'wins') {
            (new ProfileController($db))->wins($parts[1]);
        }
        // POST /api/profile/{userId}/stats
        if ($method === 'POST' && $n === 3 && $parts[0] === 'profile' && $parts[2] === 'stats') {
            (new ProfileController($db))->updateStats($parts[1]);
        }
        // GET  /api/profile/{userId}/full
        if ($method === 'GET' && $n === 3 && $parts[0] === 'profile' && $parts[2] === 'full') {
            (new ProfileController($db))->getFull($parts[1]);
        }

        // ─── Debug ────────────────────────────────────────────────────────────
        // GET  /api/schema  (and legacy /api/debug/schema)
        if ($method === 'GET' && $n === 1 && $parts[0] === 'schema') {
            $dbConfig = Config::getDbConfig();
            $schema   = $db->getSchemaInfo();
            jsonResponse(200, ['database' => $dbConfig['name'], 'tables' => $schema]);
        }
        if ($method === 'GET' && $n === 2 && $parts[0] === 'debug' && $parts[1] === 'schema') {
            $dbConfig = Config::getDbConfig();
            $schema   = $db->getSchemaInfo();
            jsonResponse(200, ['database' => $dbConfig['name'], 'tables' => $schema]);
        }
        // POST /api/debug/reset
        if ($method === 'POST' && $n === 2 && $parts[0] === 'debug' && $parts[1] === 'reset') {
            $db->resetDatabase();
            jsonResponse(200, [
                'status'  => 'success',
                'message' => 'Database reset successfully. All tables dropped and recreated.',
            ]);
        }
        // DELETE /api/debug/cleanup/{userId}
        if ($method === 'DELETE' && $n === 3 && $parts[0] === 'debug' && $parts[1] === 'cleanup') {
            $userId = $parts[2];
            if (empty($userId)) {
                jsonResponse(400, ['error' => 'Missing userId']);
            }
            $deleted = $db->cleanupTestData($userId);
            jsonResponse(200, [
                'status'  => 'success',
                'message' => "Test data cleaned up for user: $userId",
                'user_id' => $userId,
                'deleted' => $deleted,
            ]);
        }

        // ─── Users (new) ──────────────────────────────────────────────────────
        // POST /api/users
        if ($method === 'POST' && $n === 1 && $parts[0] === 'users') {
            (new UserController($db))->create();
        }
        // GET  /api/users?id=...
        if ($method === 'GET' && $n === 1 && $parts[0] === 'users') {
            (new UserController($db))->get();
        }

        // ─── Games (new) ──────────────────────────────────────────────────────
        // POST /api/games
        if ($method === 'POST' && $n === 1 && $parts[0] === 'games') {
            (new GameController($db))->create();
        }
        // GET  /api/games?user_id=...
        if ($method === 'GET' && $n === 1 && $parts[0] === 'games') {
            (new GameController($db))->list();
        }

        // ─── Stats (new) ──────────────────────────────────────────────────────
        // POST /api/stats
        if ($method === 'POST' && $n === 1 && $parts[0] === 'stats') {
            (new StatsController($db))->update();
        }
        // GET  /api/stats?user_id=...
        if ($method === 'GET' && $n === 1 && $parts[0] === 'stats') {
            (new StatsController($db))->get();
        }

        // ─── Replays ──────────────────────────────────────────────────────────
        // POST /api/replay/{userId}/{mode}/{levelId}  (legacy)
        if ($method === 'POST' && $n === 4 && $parts[0] === 'replay') {
            $userId  = $parts[1];
            $mode    = $parts[2];
            $levelId = (int) $parts[3];

            if (empty($userId) || empty($mode) || $levelId === 0) {
                jsonResponse(400, ['error' => 'Missing userId, mode, or levelId']);
            }

            $body  = json_decode((string) file_get_contents('php://input'), true);
            $moves = $body['moves'] ?? null;
            $score = (int) ($body['score'] ?? 0);

            if ($moves === null) {
                jsonResponse(400, ['error' => 'Missing moves data']);
            }

            if ($db->saveReplay($userId, $mode, $levelId, $moves, $score)) {
                jsonResponse(200, ['success' => true]);
            }
            jsonResponse(500, ['error' => 'Failed to save replay']);
        }

        // GET /api/replay/{userId}/{mode}/{levelId}  (legacy)
        if ($method === 'GET' && $n === 4 && $parts[0] === 'replay') {
            $userId  = $parts[1];
            $mode    = $parts[2];
            $levelId = (int) $parts[3];

            if (empty($userId) || empty($mode) || $levelId === 0) {
                jsonResponse(400, ['error' => 'Missing userId, mode, or levelId']);
            }

            $replay = $db->getReplay($userId, $mode, $levelId);

            if ($replay) {
                jsonResponse(200, $replay);
            }
            jsonResponse(404, ['error' => 'Replay not found']);
        }

        // POST /api/replays  (new — body-based)
        if ($method === 'POST' && $n === 1 && $parts[0] === 'replays') {
            $data    = json_decode((string) file_get_contents('php://input'), true);
            $userId  = $data['user_id']  ?? null;
            $mode    = $data['mode']     ?? null;
            $levelId = $data['level_id'] ?? null;
            $moves   = $data['moves']    ?? [];
            $score   = $data['score']    ?? null;

            if (!$userId || !$mode || $levelId === null) {
                jsonResponse(400, ['error' => 'Missing required fields']);
            }

            $levelId   = (int) $levelId;
            $movesJson = json_encode($moves);
            $score     = $score !== null ? (int) $score : 0;

            $stmt = self::guardPrepare($db->conn->prepare(
                'INSERT INTO replays (user_id, mode, level_id, moves, score)
                 VALUES (?, ?, ?, ?, ?)'
            ), $db);
            $stmt->bind_param('ssisi', $userId, $mode, $levelId, $movesJson, $score);
            if (!$stmt->execute()) {
                jsonResponse(500, ['error' => 'Failed to save replay: ' . $stmt->error]);
            }
            $replayId = $db->conn->insert_id;
            $stmt->close();

            jsonResponse(201, ['success' => true, 'id' => $replayId]);
        }

        // GET /api/replays?user_id=...&mode=...&level_id=...  (new)
        if ($method === 'GET' && $n === 1 && $parts[0] === 'replays') {
            $userId  = $_GET['user_id']  ?? null;
            $mode    = $_GET['mode']     ?? null;
            $levelId = $_GET['level_id'] ?? null;

            if (!$userId || !$mode || $levelId === null) {
                jsonResponse(400, ['error' => 'Missing required parameters']);
            }

            $levelId = (int) $levelId;

            $stmt = self::guardPrepare($db->conn->prepare(
                'SELECT moves, score FROM replays
                 WHERE user_id = ? AND mode = ? AND level_id = ?
                 ORDER BY created_at DESC LIMIT 1'
            ), $db);
            $stmt->bind_param('ssi', $userId, $mode, $levelId);
            $stmt->execute();
            $result = $stmt->get_result();
            $replay = $result->fetch_assoc();
            $stmt->close();

            if ($replay) {
                $replay['moves'] = json_decode((string) $replay['moves'], true);
            }

            jsonResponse(200, $replay ?: null);
        }

        // ─── 404 ──────────────────────────────────────────────────────────────
        jsonResponse(404, [
            'error'  => 'Route not found',
            'method' => $method,
            'parts'  => $parts,
        ]);
    }
}
