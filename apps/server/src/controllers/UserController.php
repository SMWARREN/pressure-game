<?php

namespace Pressure\Controllers;

use Pressure\Database;

class UserController
{
    public function __construct(private Database $db) {}

    /** POST /api/users — create or get user (inserts into `users` table) */
    public function create(): never
    {
        $data     = json_decode((string) file_get_contents('php://input'), true);
        $userId   = $data['id']       ?? null;
        $username = $data['username'] ?? null;

        if (!$userId) {
            jsonResponse(400, ['error' => 'Missing user ID']);
        }

        $stmt = $this->db->conn->prepare('INSERT IGNORE INTO users (id, username) VALUES (?, ?)');
        if (!$stmt) {
            jsonResponse(500, ['error' => 'Prepare failed: ' . $this->db->conn->error]);
        }
        $stmt->bind_param('ss', $userId, $username);
        $stmt->execute();
        $stmt->close();

        $stmt = $this->db->conn->prepare('SELECT id, username, created_at FROM users WHERE id = ?');
        if (!$stmt) {
            jsonResponse(500, ['error' => 'Prepare failed: ' . $this->db->conn->error]);
        }
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user   = $result->fetch_assoc();
        $stmt->close();

        jsonResponse(201, $user);
    }

    /** GET /api/users?id=... — get user with stats */
    public function get(): never
    {
        $userId = $_GET['id'] ?? null;

        if (!$userId) {
            jsonResponse(400, ['error' => 'Missing user ID']);
        }

        $stmt = $this->db->conn->prepare('SELECT id, username, created_at FROM users WHERE id = ?');
        if (!$stmt) {
            jsonResponse(500, ['error' => 'Prepare failed: ' . $this->db->conn->error]);
        }
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user   = $result->fetch_assoc();
        $stmt->close();

        if (!$user) {
            jsonResponse(404, ['error' => 'User not found']);
        }

        $stmt = $this->db->conn->prepare('SELECT * FROM user_stats WHERE user_id = ?');
        if (!$stmt) {
            jsonResponse(500, ['error' => 'Prepare failed: ' . $this->db->conn->error]);
        }
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats  = $result->fetch_assoc();
        $stmt->close();

        jsonResponse(200, ['user' => $user, 'stats' => $stats ?: []]);
    }
}
