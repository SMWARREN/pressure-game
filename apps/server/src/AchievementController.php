<?php

namespace Pressure;

use Pressure\Database;

class AchievementController
{
    use ControllerHelper;

    public function __construct(private Database $db) {}

    /** POST /api/achievement/{userId}/{achievementId} — legacy */
    public function unlock(string $userId, string $achievementId): never
    {
        if (empty($userId) || empty($achievementId)) {
            jsonResponse(400, ['error' => 'Missing userId or achievementId']);
        }

        if ($this->db->unlockAchievement($userId, $achievementId)) {
            jsonResponse(200, ['success' => true]);
        }
        jsonResponse(500, ['error' => 'Failed to unlock achievement']);
    }

    /** GET /api/achievement/{userId} — legacy */
    public function getForUser(string $userId): never
    {
        if (empty($userId)) {
            jsonResponse(400, ['error' => 'Missing userId']);
        }

        jsonResponse(200, $this->db->getUserAchievements($userId));
    }

    /** GET /api/achievements — global stats, no user_id */
    public function getAll(): never
    {
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
        jsonResponse(200, $this->db->getAllAchievements($limit));
    }

    /**
     * POST /api/achievements/{id}?user_id=... — new-style, inserts into user_achievements.
     * Uses $db->conn directly (mysqli) to keep PDO out of the codebase.
     */
    public function unlockNew(string $achievementId): never
    {
        $userId = $_GET['user_id'] ?? null;

        if (!$userId) {
            jsonResponse(400, ['error' => 'Missing user_id']);
        }

        $stmt = $this->guardPrepare($this->db->conn->prepare(
            'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
        ));
        $stmt->bind_param('ss', $userId, $achievementId);
        $stmt->execute();
        $stmt->close();

        jsonResponse(201, ['success' => true, 'message' => 'Achievement unlocked']);
    }

    /**
     * GET /api/achievements?user_id=... — new-style, reads from user_achievements.
     */
    public function getForUserNew(): never
    {
        $userId = $_GET['user_id'] ?? null;
        $limit  = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;

        if (!$userId) {
            jsonResponse(400, ['error' => 'Missing user_id']);
        }

        $stmt = $this->guardPrepare($this->db->conn->prepare(
            'SELECT * FROM user_achievements
             WHERE user_id = ? ORDER BY unlocked_at DESC LIMIT ?'
        ));
        $stmt->bind_param('si', $userId, $limit);
        $stmt->execute();
        $result       = $stmt->get_result();
        $achievements = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        jsonResponse(200, $achievements);
    }
}
