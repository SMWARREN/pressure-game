<?php

namespace Pressure\Controllers;

use Pressure\Database;

class HighscoreController
{
    public function __construct(private Database $db) {}

    /** POST /api/highscore/{userId}/{mode}/{levelId} */
    public function save(string $userId, string $mode, int $levelId): never
    {
        if (empty($userId) || empty($mode) || $levelId === 0) {
            jsonResponse(400, ['error' => 'Missing userId, mode, or levelId']);
        }

        $body  = json_decode((string) file_get_contents('php://input'), true);
        $moves = $body['moves'] ?? null;
        $time  = $body['time']  ?? null;
        $score = $body['score'] ?? null;

        if ($moves === null || $time === null) {
            jsonResponse(400, ['error' => 'Missing moves or time']);
        }

        try {
            if ($this->db->saveHighscore(
                $userId,
                $mode,
                $levelId,
                (int) $moves,
                (float) $time,
                $score !== null ? (int) $score : null
            )) {
                $this->db->updateUserProfileStats($userId);
                jsonResponse(200, ['success' => true]);
            }
            jsonResponse(500, ['error' => 'Failed to save highscore']);
        } catch (\Exception $e) {
            jsonResponse(500, ['error' => 'Highscore save error: ' . $e->getMessage()]);
        }
    }

    /** GET /api/highscore/{userId}/{mode}/{levelId} */
    public function get(string $userId, string $mode, int $levelId): never
    {
        if (empty($userId) || empty($mode) || $levelId === 0) {
            jsonResponse(400, ['error' => 'Missing userId, mode, or levelId']);
        }

        $score = $this->db->getUserHighScore($userId, $mode, $levelId);
        jsonResponse(200, ['score' => $score]);
    }
}
