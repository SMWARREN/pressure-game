<?php

namespace Pressure\Controllers;

use Pressure\Database;

class DataController
{
    private const ERROR_MISSING_USER_KEY = 'Missing userId or key';

    public function __construct(private Database $db) {}

    /** GET /api/data/{userId}/{key} */
    public function get(string $userId, string $key): never
    {
        if (empty($userId) || empty($key)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_KEY]);
        }

        $value = $this->db->getItem($userId, $key);

        if ($value === null) {
            jsonResponse(404, ['error' => 'Not found']);
        }

        jsonResponse(200, ['value' => $value]);
    }

    /** POST /api/data/{userId}/{key} */
    public function set(string $userId, string $key): never
    {
        if (empty($userId) || empty($key)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_KEY]);
        }

        $body  = json_decode((string) file_get_contents('php://input'), true);
        $value = $body['value'] ?? null;

        if ($value === null) {
            jsonResponse(400, ['error' => 'Missing value in request body']);
        }

        if ($this->db->setItem($userId, $key, $value)) {
            jsonResponse(200, ['success' => true]);
        }

        jsonResponse(500, ['error' => 'Failed to save']);
    }

    /** DELETE /api/data/{userId}/{key} */
    public function delete(string $userId, string $key): never
    {
        if (empty($userId) || empty($key)) {
            jsonResponse(400, ['error' => self::ERROR_MISSING_USER_KEY]);
        }

        if ($this->db->removeItem($userId, $key)) {
            jsonResponse(200, ['success' => true]);
        }

        jsonResponse(500, ['error' => 'Failed to delete']);
    }

    /** GET /api/user/{userId}/data */
    public function getAllForUser(string $userId): never
    {
        if (empty($userId)) {
            jsonResponse(400, ['error' => 'Missing userId']);
        }

        jsonResponse(200, $this->db->getAllUserData($userId));
    }
}
