<?php

namespace Pressure;

use Pressure\Database;

class StatsController
{
    use ControllerHelper;

    public function __construct(private Database $db) {}

    /** POST /api/stats — upsert user_stats row */
    public function update(): never
    {
        $data   = json_decode((string) file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            jsonResponse(400, ['error' => 'Missing user_id']);
        }

        // Ensure parent rows exist
        $stmt = $this->guardPrepare($this->db->conn->prepare('INSERT IGNORE INTO users (id) VALUES (?)'));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $stmt->close();

        $stmt = $this->guardPrepare($this->db->conn->prepare('INSERT IGNORE INTO user_stats (user_id) VALUES (?)'));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $stmt->close();

        $allowedFields = [
            'total_levels_completed',
            'total_score',
            'max_combo',
            'total_walls_survived',
            'no_reset_streak',
            'speed_levels',
            'perfect_levels',
            'total_hours_played',
        ];

        $updates = [];
        $params  = [];
        $types   = '';

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "`$field` = ?";
                $params[]  = $data[$field];
                // total_hours_played is FLOAT, everything else is INT
                $types .= ($field === 'total_hours_played') ? 'd' : 'i';
            }
        }

        if (empty($updates)) {
            jsonResponse(200, ['success' => true, 'message' => 'No updates']);
        }

        $params[] = $userId;
        $types   .= 's';
        $sql      = 'UPDATE user_stats SET ' . implode(', ', $updates) . ' WHERE user_id = ?';

        $stmt = $this->guardPrepare($this->db->conn->prepare($sql));
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $stmt->close();

        jsonResponse(200, ['success' => true, 'message' => 'Stats updated']);
    }

    /** GET /api/stats?user_id=... */
    public function get(): never
    {
        $userId = $_GET['user_id'] ?? null;

        if (!$userId) {
            jsonResponse(400, ['error' => 'Missing user_id']);
        }

        $stmt = $this->guardPrepare($this->db->conn->prepare('SELECT * FROM user_stats WHERE user_id = ?'));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats  = $result->fetch_assoc();
        $stmt->close();

        jsonResponse(200, $stats ?: []);
    }
}
