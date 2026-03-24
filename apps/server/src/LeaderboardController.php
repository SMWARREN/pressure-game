<?php

namespace Pressure;

use Pressure\Database;

class LeaderboardController
{
    use ControllerHelper;

    public function __construct(private Database $db) {}

    /** GET /api/leaderboard/{mode} — legacy, reads from highscores/user_profiles */
    public function getLegacy(string $mode): never
    {
        if (empty($mode)) {
            jsonResponse(400, ['error' => 'Missing mode']);
        }

        $limit       = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
        $leaderboard = $this->db->getLeaderboard($mode, $limit);
        jsonResponse(200, $leaderboard);
    }

    /** GET /api/leaderboards/{mode} — new-style, reads from leaderboard_cache table */
    public function get(string $mode): never
    {
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;

        $stmt = $this->guardPrepare($this->db->conn->prepare(
            'SELECT user_id, username, score, `rank`
             FROM leaderboard_cache
             WHERE mode = ? ORDER BY `rank` ASC LIMIT ?'
        ));
        $stmt->bind_param('si', $mode, $limit);
        $stmt->execute();
        $result      = $stmt->get_result();
        $leaderboard = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        jsonResponse(200, $leaderboard);
    }
}
