<?php

namespace Pressure\Controllers;

use Pressure\Database;

class ProfileController
{
    private const ERROR_MISSING_USER_ID = 'Missing userId';

    public function __construct(private Database $db) {}

    /** GET /api/profile/{userId} */
    public function get(string $userId): never
    {
        if (empty($userId)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_ID]);
        }

        $this->db->ensureUserProfile($userId);
        $profile = $this->db->getUserProfile($userId);
        jsonResponse(200, $profile);
    }

    /** POST /api/profile/{userId} — update username */
    public function update(string $userId): never
    {
        if (empty($userId)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_ID]);
        }

        $body     = json_decode((string) file_get_contents('php://input'), true);
        $username = $body['username'] ?? null;

        if (empty($username)) {
            jsonResponse(400, ['error' => 'Missing username']);
        }

        if ($this->db->updateUserUsername($userId, $username)) {
            jsonResponse(200, ['success' => true]);
        }
        jsonResponse(500, ['error' => 'Failed to update profile']);
    }

    /** GET /api/profile/{userId}/wins */
    public function wins(string $userId): never
    {
        if (empty($userId)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_ID]);
        }

        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 50;
        jsonResponse(200, $this->db->getUserWins($userId, $limit));
    }

    /** POST /api/profile/{userId}/stats */
    public function updateStats(string $userId): never
    {
        if (empty($userId)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_ID]);
        }

        $body = json_decode((string) file_get_contents('php://input'), true);

        try {
            $this->db->updateUserStats(
                $userId,
                isset($body['maxCombo'])       ? (int) $body['maxCombo']       : null,
                isset($body['wallsSurvived'])   ? (int) $body['wallsSurvived']   : null,
                isset($body['noResetStreak'])   ? (int) $body['noResetStreak']   : null,
                isset($body['speedLevels'])     ? (int) $body['speedLevels']     : null,
                isset($body['perfectLevels'])   ? (int) $body['perfectLevels']   : null,
                isset($body['daysPlayed'])      ? (int) $body['daysPlayed']      : null
            );
            jsonResponse(200, ['success' => true]);
        } catch (\Exception $e) {
            jsonResponse(500, ['error' => 'Stats update error: ' . $e->getMessage()]);
        }
    }

    /** GET /api/profile/{userId}/full */
    public function getFull(string $userId): never
    {
        if (empty($userId)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_ID]);
        }

        $this->db->ensureUserProfile($userId);
        jsonResponse(200, [
            'profile'      => $this->db->getUserProfile($userId),
            'achievements' => $this->db->getUserAchievements($userId),
            'wins'         => $this->db->getUserWins($userId, 50),
        ]);
    }
}
