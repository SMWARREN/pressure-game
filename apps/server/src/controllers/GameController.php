<?php

namespace Pressure\Controllers;

use Pressure\Database;

class GameController
{
    use ControllerHelper;

    public function __construct(private Database $db) {}

    /** POST /api/games — record game completion */
    public function create(): never
    {
        $data    = json_decode((string) file_get_contents('php://input'), true);
        $userId  = $data['user_id']         ?? null;
        $mode    = $data['mode']            ?? null;
        $levelId = $data['level_id']        ?? null;
        $score   = $data['score']           ?? null;
        $moves   = $data['moves']           ?? null;
        $time    = $data['elapsed_seconds'] ?? null;

        if (!$userId || !$mode || $levelId === null) {
            jsonResponse(400, ['error' => 'Missing required fields']);
        }

        $levelId = (int) $levelId;
        $score   = $score !== null ? (int) $score   : null;
        $moves   = $moves !== null ? (int) $moves   : null;
        $time    = $time  !== null ? (float) $time  : null;

        $stmt = $this->guardPrepare($this->db->conn->prepare(
            'INSERT INTO game_completions (user_id, mode, level_id, score, moves, elapsed_seconds)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score))'
        ));
        $stmt->bind_param('ssiiid', $userId, $mode, $levelId, $score, $moves, $time);
        $stmt->execute();
        $stmt->close();

        jsonResponse(201, ['success' => true, 'message' => 'Game recorded']);
    }

    /** GET /api/games?user_id=...&mode=...&limit=... — list games for user */
    public function list(): never
    {
        $userId = $_GET['user_id'] ?? null;
        $mode   = $_GET['mode']    ?? null;
        $limit  = (int) ($_GET['limit'] ?? 100);

        if (!$userId) {
            jsonResponse(400, ['error' => 'Missing user_id']);
        }

        $sql   = 'SELECT * FROM game_completions WHERE user_id = ?';
        $types = 's';
        $params = [$userId];

        if ($mode) {
            $sql    .= ' AND mode = ?';
            $types  .= 's';
            $params[] = $mode;
        }

        $sql .= ' ORDER BY completed_at DESC LIMIT ' . $limit;

        $stmt = $this->guardPrepare($this->db->conn->prepare($sql));
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $games  = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        jsonResponse(200, $games);
    }
}
