<?php

namespace Pressure;

class Database
{
    private const INT_DEFAULT_ZERO = 'INT DEFAULT 0';
    private const PREPARE_FAILED = 'Prepare failed: ';
    public \mysqli $conn;

    public function __construct(string $host, int $port, string $user, string $pass, string $name)
    {
        try {
            $this->conn = new \mysqli($host, $user, $pass, $name, $port);

            if ($this->conn->connect_error) {
                throw new AppException('Database connection failed: ' . $this->conn->connect_error);
            }

            $this->conn->set_charset('utf8mb4');
            $this->initTable();
        } catch (\Exception $e) {
            http_response_code(500);
            die(json_encode(['error' => $e->getMessage()]));
        }
    }

    /**
     * Guard helper for prepare failures - throws exception if prepare fails
     */
    private function guardPrepare(\mysqli_stmt|false $stmt): \mysqli_stmt
    {
        if ($stmt === false) {
            throw new AppException(self::PREPARE_FAILED . $this->conn->error);
        }
        return $stmt;
    }

    // ─── Schema ───────────────────────────────────────────────────────────────

    private function addColumnIfNotExists(string $table, string $column, string $definition): void
    {
        $result = $this->conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        if ($result && $result->num_rows === 0) {
            $sql = "ALTER TABLE `$table` ADD COLUMN `$column` $definition";
            if (!$this->conn->query($sql)) {
                throw new AppException("Failed to add $column to $table: " . $this->conn->error);
            }
        }
    }

    public function initTable(): void
    {
        // ─── NEW RELATIONAL SCHEMA (v2) ──────────────────────────────────────

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(64) PRIMARY KEY,
                username VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create users table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS game_completions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                mode VARCHAR(50) NOT NULL,
                level_id INT NOT NULL,
                score INT,
                moves INT,
                elapsed_seconds FLOAT,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_level (user_id, mode, level_id),
                INDEX idx_user (user_id),
                INDEX idx_mode (mode),
                INDEX idx_score (score DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create game_completions table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS user_achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                achievement_id VARCHAR(100) NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_achievement (user_id, achievement_id),
                INDEX idx_user (user_id),
                INDEX idx_achievement (achievement_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create user_achievements table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id VARCHAR(64) PRIMARY KEY,
                total_levels_completed INT DEFAULT 0,
                total_score INT DEFAULT 0,
                max_combo INT DEFAULT 0,
                total_walls_survived INT DEFAULT 0,
                no_reset_streak INT DEFAULT 0,
                speed_levels INT DEFAULT 0,
                perfect_levels INT DEFAULT 0,
                total_hours_played FLOAT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create user_stats table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS replays (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                mode VARCHAR(50) NOT NULL,
                level_id INT NOT NULL,
                moves_json JSON NOT NULL,
                score INT,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_mode_level (user_id, mode, level_id),
                INDEX idx_recorded (recorded_at DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create replays table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS leaderboard_cache (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mode VARCHAR(50) NOT NULL,
                user_id VARCHAR(64) NOT NULL,
                username VARCHAR(255),
                score INT,
                `rank` INT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_mode_user (mode, user_id),
                INDEX idx_mode_rank (mode, `rank`),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create leaderboard_cache table: ' . $this->conn->error);

        // ─── LEGACY TABLES ───────────────────────────────────────────────────

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS highscores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                mode VARCHAR(50) NOT NULL,
                level_id INT NOT NULL,
                score INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_score (user_id, mode, level_id),
                INDEX idx_mode_score (mode, score DESC),
                INDEX idx_user (user_id),
                INDEX idx_level (mode, level_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create highscores table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS game_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                data_key VARCHAR(255) NOT NULL,
                data_value LONGTEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_key (user_id, data_key),
                INDEX idx_user_id (user_id),
                INDEX idx_updated_at (updated_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create game_data table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100),
                total_score INT DEFAULT 0,
                total_moves INT DEFAULT 0,
                achievements_count INT DEFAULT 0,
                levels_completed INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_total_score (total_score DESC),
                INDEX idx_total_moves (total_moves ASC),
                INDEX idx_achievements (achievements_count DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create user_profiles table: ' . $this->conn->error);

        $this->conn->query("
            CREATE TABLE IF NOT EXISTS achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                achievement_id VARCHAR(100) NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_achievement (user_id, achievement_id),
                INDEX idx_user (user_id),
                INDEX idx_achievement (achievement_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ") || throw new AppException('Failed to create achievements table: ' . $this->conn->error);

        // Migrations — add columns that may be missing from older installs
        $this->addColumnIfNotExists('highscores', 'best_moves', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('highscores', 'best_time', 'FLOAT DEFAULT 0');
        $this->addColumnIfNotExists('user_profiles', 'total_moves', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('user_profiles', 'max_combo', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('user_profiles', 'total_walls_survived', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('user_profiles', 'no_reset_streak', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('user_profiles', 'speed_levels', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('user_profiles', 'perfect_levels', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('user_profiles', 'total_days_played', self::INT_DEFAULT_ZERO);
        $this->addColumnIfNotExists('replays', 'moves_json', 'JSON');
        $this->addColumnIfNotExists('replays', 'recorded_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }

    // ─── Key-Value Store ─────────────────────────────────────────────────────

    public function getItem(string $userId, string $key): ?string
    {
        $stmt = $this->guardPrepare($this->conn->prepare('SELECT data_value FROM game_data WHERE user_id = ? AND data_key = ?'));
        $stmt->bind_param('ss', $userId, $key);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        if ($result->num_rows === 0) {
            return null;
        }

        return $result->fetch_assoc()['data_value'];
    }

    public function setItem(string $userId, string $key, string $value): bool
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'INSERT INTO game_data (user_id, data_key, data_value)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             data_value = VALUES(data_value),
             updated_at = CURRENT_TIMESTAMP'
        ));
        $stmt->bind_param('sss', $userId, $key, $value);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }

    public function removeItem(string $userId, string $key): bool
    {
        $stmt = $this->guardPrepare($this->conn->prepare('DELETE FROM game_data WHERE user_id = ? AND data_key = ?'));
        $stmt->bind_param('ss', $userId, $key);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }

    public function getAllUserData(string $userId): array
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT data_key, data_value FROM game_data WHERE user_id = ? ORDER BY updated_at DESC'
        ));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[$row['data_key']] = $row['data_value'];
        }
        return $data;
    }

    // ─── Highscores ──────────────────────────────────────────────────────────

    public function saveHighscore(
        string $userId,
        string $mode,
        int $levelId,
        int $moves = 0,
        float $time = 0.0,
        ?int $score = null
    ): bool {
        $this->ensureUserProfile($userId);

        $arcadeModes = [
            'candy', 'shoppingSpree', 'gemBlast', 'laserRelay', 'fuseBox',
            'outbreak', 'gravityDrop', 'mirrorForge', 'quantumChain',
            'memoryMatch', 'voltageRush',
        ];

        if ($score !== null && $score > 0) {
            $finalScore = $score;
        } elseif (in_array($mode, $arcadeModes, true)) {
            $finalScore = 0;
        } else {
            $finalScore = ScoreCalculator::calculate($mode, $moves, $time, $levelId);
        }

        $sql = 'INSERT INTO highscores (user_id, mode, level_id, score, best_moves, best_time)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                score      = GREATEST(score, VALUES(score)),
                best_moves = IF(VALUES(score) >= score, VALUES(best_moves), best_moves),
                best_time  = IF(VALUES(score) >= score, VALUES(best_time),  best_time)';

        $stmt = $this->guardPrepare($this->conn->prepare($sql));
        $stmt->bind_param('ssiiid', $userId, $mode, $levelId, $finalScore, $moves, $time);
        $success = $stmt->execute();
        if (!$success) {
            throw new AppException('Execute failed: ' . $this->conn->error);
        }
        $stmt->close();
        return $success;
    }

    public function getUserHighScore(string $userId, string $mode, int $levelId): ?int
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT score FROM highscores WHERE user_id = ? AND mode = ? AND level_id = ?'
        ));
        $stmt->bind_param('ssi', $userId, $mode, $levelId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        if ($result->num_rows === 0) {
            return null;
        }
        return (int) $result->fetch_assoc()['score'];
    }

    public function getLeaderboard(string $mode, int $limit = 100): array
    {
        if ($mode === 'global') {
            $stmt = $this->guardPrepare($this->conn->prepare(
                'SELECT user_id, username, total_score, total_moves, achievements_count,
                        levels_completed, created_at
                 FROM user_profiles
                 WHERE total_score > 0
                 ORDER BY total_score DESC, total_moves ASC
                 LIMIT ?'
            ));
            $stmt->bind_param('i', $limit);
        } else {
            $stmt = $this->guardPrepare($this->conn->prepare(
                'SELECT h.user_id,
                        MAX(h.score) as score,
                        MAX(h.created_at) as created_at,
                        COALESCE(up.username, h.user_id) as username,
                        COALESCE(up.total_score, 0) as total_score
                 FROM highscores h
                 LEFT JOIN user_profiles up ON h.user_id = up.user_id
                 WHERE h.mode = ?
                 GROUP BY h.user_id
                 ORDER BY score DESC
                 LIMIT ?'
            ));
            $stmt->bind_param('si', $mode, $limit);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        $leaderboard = [];
        $rank = 1;
        while ($row = $result->fetch_assoc()) {
            $leaderboard[] = array_merge($row, ['rank' => $rank++]);
        }
        return $leaderboard;
    }

    public function updateUserProfileStats(string $userId): void
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT COUNT(DISTINCT level_id) as levels_completed, SUM(score) as total_score
             FROM highscores WHERE user_id = ?'
        ));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $stats = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $levelsCompleted = (int) ($stats['levels_completed'] ?? 0);
        $totalScore      = (int) ($stats['total_score'] ?? 0);

        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT SUM(best_moves) as total_moves FROM highscores WHERE user_id = ?'
        ));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $moveStats = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $totalMoves = (int) ($moveStats['total_moves'] ?? 0);

        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT COUNT(*) as achievement_count FROM achievements WHERE user_id = ?'
        ));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $achStats = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $achievementsCount = (int) ($achStats['achievement_count'] ?? 0);

        $stmt = $this->guardPrepare($this->conn->prepare(
            'UPDATE user_profiles
             SET total_score = ?, total_moves = ?, levels_completed = ?,
                 achievements_count = ?, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?'
        ));
        $stmt->bind_param('iiiis', $totalScore, $totalMoves, $levelsCompleted, $achievementsCount, $userId);
        $stmt->execute();
        $stmt->close();
    }

    // ─── Achievements ────────────────────────────────────────────────────────

    public function unlockAchievement(string $userId, string $achievementId): bool
    {
        // Ensure user exists in users table (required for foreign key)
        $this->ensureUser($userId);

        $stmt = $this->guardPrepare($this->conn->prepare(
            'INSERT IGNORE INTO achievements (user_id, achievement_id) VALUES (?, ?)'
        ));
        $stmt->bind_param('ss', $userId, $achievementId);
        $success = $stmt->execute();
        $stmt->close();

        if ($success) {
            $this->updateUserProfileStats($userId);
        }
        return $success;
    }

    public function getUserAchievements(string $userId): array
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC'
        ));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        // Load definitions from JSON file if present
        $defs = [];
        $jsonPath = __DIR__ . '/../achievements.json';
        if (file_exists($jsonPath)) {
            $decoded = json_decode((string) file_get_contents($jsonPath), true);
            if (isset($decoded['achievements']) && is_array($decoded['achievements'])) {
                foreach ($decoded['achievements'] as $def) {
                    $defs[$def['id']] = $def;
                }
            }
        }

        $achievements = [];
        while ($row = $result->fetch_assoc()) {
            $id  = $row['achievement_id'];
            $def = $defs[$id] ?? null;
            $entry = [
                'id'         => $id,
                'name'       => $def['name'] ?? $id,
                'icon'       => $def['icon'] ?? '🏆',
                'unlockedAt' => $row['unlocked_at'],
            ];
            if ($def) {
                $entry['description'] = $def['description'] ?? '';
                $entry['points']      = $def['points'] ?? 0;
            }
            $achievements[] = $entry;
        }
        return $achievements;
    }

    public function getAllAchievements(int $limit = 100): array
    {
        $result = $this->conn->query(
            'SELECT achievement_id, COUNT(*) as count FROM achievements
             GROUP BY achievement_id
             ORDER BY count DESC
             LIMIT ' . $limit
        );
        if (!$result) {
            throw new AppException('Query failed: ' . $this->conn->error);
        }
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    // ─── User Profiles ───────────────────────────────────────────────────────

    /**
     * Ensure user exists in users table (required for foreign key constraints)
     */
    public function ensureUser(string $userId): void
    {
        $stmt = $this->guardPrepare($this->conn->prepare('INSERT IGNORE INTO users (id) VALUES (?)'));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $stmt->close();
    }

    public function ensureUserProfile(string $userId): void
    {
        // Ensure user exists first (required for foreign key)
        $this->ensureUser($userId);

        $stmt = $this->guardPrepare($this->conn->prepare('INSERT IGNORE INTO user_profiles (user_id) VALUES (?)'));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $stmt->close();
    }

    public function getUserProfile(string $userId): ?array
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT user_id, username, total_score, total_moves, achievements_count,
                    levels_completed, max_combo, total_walls_survived, no_reset_streak,
                    speed_levels, perfect_levels, total_days_played, created_at
             FROM user_profiles WHERE user_id = ?'
        ));
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        if ($result->num_rows === 0) {
            return null;
        }
        return $result->fetch_assoc();
    }

    public function updateUserUsername(string $userId, string $username): bool
    {
        $this->ensureUserProfile($userId);
        $stmt = $this->guardPrepare($this->conn->prepare(
            'UPDATE user_profiles SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ));
        $stmt->bind_param('ss', $username, $userId);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }

    public function getUserWins(string $userId, int $limit = 50): array
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT h.user_id, h.mode, h.level_id, h.score, h.created_at,
                    COALESCE(up.username, h.user_id) as username
             FROM highscores h
             LEFT JOIN user_profiles up ON h.user_id = up.user_id
             WHERE h.user_id = ? AND h.score > 0
             ORDER BY h.created_at DESC
             LIMIT ?'
        ));
        $stmt->bind_param('si', $userId, $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        $wins = [];
        while ($row = $result->fetch_assoc()) {
            $wins[] = $row;
        }
        return $wins;
    }

    public function updateUserStats(
        string $userId,
        ?int $maxCombo = null,
        ?int $wallsSurvived = null,
        ?int $noResetStreak = null,
        ?int $speedLevels = null,
        ?int $perfectLevels = null,
        ?int $daysPlayed = null
    ): bool {
        $this->ensureUserProfile($userId);

        $fields = [
            'max_combo'            => $maxCombo,
            'total_walls_survived' => $wallsSurvived,
            'no_reset_streak'      => $noResetStreak,
            'speed_levels'         => $speedLevels,
            'perfect_levels'       => $perfectLevels,
            'total_days_played'    => $daysPlayed,
        ];

        foreach ($fields as $col => $val) {
            if ($val !== null) {
                $stmt = $this->guardPrepare($this->conn->prepare(
                    "UPDATE user_profiles
                     SET `$col` = GREATEST(IFNULL(`$col`, 0), ?), updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = ?"
                ));
                $stmt->bind_param('is', $val, $userId);
                $stmt->execute();
                $stmt->close();
            }
        }
        return true;
    }

    // ─── Replays ─────────────────────────────────────────────────────────────

    public function saveReplay(string $userId, string $mode, int $levelId, mixed $moves, int $score): bool
    {
        // Ensure user exists in users table (required for foreign key)
        $this->ensureUser($userId);

        $movesJson = is_string($moves) ? $moves : json_encode($moves);
        $stmt = $this->guardPrepare($this->conn->prepare(
            'INSERT INTO replays (user_id, mode, level_id, moves_json, score)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             moves_json = VALUES(moves_json),
             score = VALUES(score),
             recorded_at = CURRENT_TIMESTAMP'
        ));
        $stmt->bind_param('ssisi', $userId, $mode, $levelId, $movesJson, $score);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }

    public function getReplay(string $userId, string $mode, int $levelId): ?array
    {
        $stmt = $this->guardPrepare($this->conn->prepare(
            'SELECT user_id, mode, level_id, moves_json as moves, score, recorded_at
             FROM replays
             WHERE user_id = ? AND mode = ? AND level_id = ?
             ORDER BY recorded_at DESC LIMIT 1'
        ));
        $stmt->bind_param('ssi', $userId, $mode, $levelId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        $row = $result->fetch_assoc();
        if ($row) {
            $row['moves'] = json_decode((string) $row['moves'], true);
        }
        return $row ?: null;
    }

    // ─── Debug ───────────────────────────────────────────────────────────────

    public function getSchemaInfo(): array
    {
        $tables = [];
        $result = $this->conn->query('SHOW TABLES');
        if (!$result) {
            throw new AppException('Failed to list tables: ' . $this->conn->error);
        }
        while ($row = $result->fetch_row()) {
            $tableName = $row[0];
            $columns   = [];
            $colResult = $this->conn->query("SHOW COLUMNS FROM `$tableName`");
            if ($colResult) {
                while ($col = $colResult->fetch_assoc()) {
                    $columns[] = [
                        'name'    => $col['Field'],
                        'type'    => $col['Type'],
                        'null'    => $col['Null'],
                        'key'     => $col['Key'],
                        'default' => $col['Default'],
                        'extra'   => $col['Extra'],
                    ];
                }
            }
            $countResult = $this->conn->query("SELECT COUNT(*) as cnt FROM `$tableName`");
            $rowCount    = (int) $countResult->fetch_assoc()['cnt'];
            $tables[$tableName] = ['row_count' => $rowCount, 'columns' => $columns];
        }
        return $tables;
    }

    public function cleanupTestData(string $userId): array
    {
        if (empty($userId)) {
            throw new AppException('userId is required for cleanup');
        }

        $deleted = [
            'highscores'    => 0,
            'replays'       => 0,
            'user_profiles' => 0,
            'achievements'  => 0,
            'game_data'     => 0,
        ];

        foreach (['highscores', 'replays', 'achievements', 'game_data', 'user_profiles'] as $table) {
            $stmt = $this->conn->prepare("DELETE FROM `$table` WHERE user_id = ?");
            if ($stmt) {
                $stmt->bind_param('s', $userId);
                $stmt->execute();
                $deleted[$table] = $this->conn->affected_rows;
                $stmt->close();
            }
        }
        return $deleted;
    }

    public function resetDatabase(): bool
    {
        foreach (['highscores', 'game_data', 'user_profiles', 'replays', 'achievements'] as $table) {
            $this->conn->query("DROP TABLE IF EXISTS `$table`");
        }
        $this->initTable();
        return true;
    }

}
