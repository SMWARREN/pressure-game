<?php
/**
 * PRESSURE GAME - PHP Backend Server with MySQL
 *
 * This is a PHP/MySQL server that stores game data.
 *
 * Installation:
 *   1. Place this file in your web server root or a subdirectory
 *   2. Create .env file with MySQL credentials
 *   3. Access via: http://your-domain/api.php
 *   4. Frontend VITE_API_URL=http://your-domain/api.php
 *
 * Requirements:
 *   - PHP 7.4+
 *   - MySQL 5.7+
 *   - mysqli extension enabled
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Load environment variables from .env file
$env = [];
if (file_exists('.env')) {
  // Parse .env file without sections (false parameter)
  $env = parse_ini_file('.env', false) ?: [];
}

// Helper function to get env value from .env or system env
function getEnvVar($key, $default = null) {
  global $env;
  // Try .env file first, then system environment, then default
  return $env[$key] ?? getenv($key) ?: $default;
}

// Database Configuration
$DB_HOST = getEnvVar('MYSQL_HOST', 'localhost');
$DB_PORT = (int)getEnvVar('MYSQL_PORT', 3306);
$DB_USER = getEnvVar('MYSQL_USER', 'saintsea_pressure');
$DB_PASS = getEnvVar('MYSQL_PASSWORD', 'pressurepressure');
$DB_NAME = getEnvVar('MYSQL_DATABASE', 'saintsea_pressure-engine');

// ─── LEVEL CONFIGURATION & SCORING ─────────────────────────────────────

// Define all levels with their difficulty types
$LEVELS = [
  1 => 'easy', 2 => 'easy', 3 => 'easy',
  4 => 'medium', 5 => 'medium', 6 => 'medium', 7 => 'medium',
  8 => 'hard', 9 => 'hard', 10 => 'hard'
];

// Mode-specific score multipliers by difficulty
$SCORE_MULTIPLIERS = [
  'classic' => ['easy' => 1.0, 'medium' => 1.5, 'hard' => 2.0],
  'blitz' => ['easy' => 2.0, 'medium' => 3.0, 'hard' => 4.0],
  'zen' => ['easy' => 0.5, 'medium' => 1.0, 'hard' => 2.0],
];

// Calculate score based on mode, moves, time, and level difficulty
function calculateScore($mode, $moves, $time, $levelId) {
  global $LEVELS, $SCORE_MULTIPLIERS;

  $difficulty = $LEVELS[$levelId] ?? 'medium';
  $multiplier = $SCORE_MULTIPLIERS[$mode][$difficulty] ?? 1.0;

  $baseScore = match($mode) {
    'classic' => 10000 - ($moves + $time),
    'blitz' => 10000 - $time,
    'zen' => 10000 - $moves,
    default => 1000
  };

  $finalScore = max(0, (int)($baseScore * $multiplier));
  error_log("calculateScore: mode=$mode, moves=$moves, time=$time, levelId=$levelId, difficulty=$difficulty, multiplier=$multiplier, baseScore=$baseScore, finalScore=$finalScore");

  return $finalScore;
}

// Database Connection
class Database {
  private $conn;

  public function __construct($host, $port, $user, $pass, $db) {
    try {
      $this->conn = new mysqli($host, $user, $pass, $db, $port);

      if ($this->conn->connect_error) {
        throw new Exception('Database connection failed: ' . $this->conn->connect_error);
      }

      $this->conn->set_charset('utf8mb4');
      $this->initTable();
    } catch (Exception $e) {
      http_response_code(500);
      die(json_encode(['error' => $e->getMessage()]));
    }
  }

  private function addColumnIfNotExists($table, $column, $definition) {
    $result = $this->conn->query("SHOW COLUMNS FROM $table LIKE '$column'");
    if ($result && $result->num_rows === 0) {
      $sql = "ALTER TABLE $table ADD COLUMN $column $definition";
      if (!$this->conn->query($sql)) {
        throw new Exception("Failed to add $column to $table: " . $this->conn->error);
      }
    }
  }

  private function initTable() {
    // Ensure highscores table exists first
    $sql = "
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
    ";
    if (!$this->conn->query($sql)) {
      throw new Exception('Failed to create highscores table: ' . $this->conn->error);
    }

    // Game data persistence table
    $sql = "
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
    ";

    if (!$this->conn->query($sql)) {
      throw new Exception('Failed to create game_data table: ' . $this->conn->error);
    }

    // User profiles table
    $sql = "
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
    ";

    if (!$this->conn->query($sql)) {
      throw new Exception('Failed to create user_profiles table: ' . $this->conn->error);
    }

    // Highscores table already created above in addColumnIfNotExists section

    // Achievements table
    $sql = "
      CREATE TABLE IF NOT EXISTS replays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        mode VARCHAR(50) NOT NULL,
        level_id INT NOT NULL,
        moves LONGTEXT NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_replay (user_id, mode, level_id),
        INDEX idx_mode (mode),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    if (!$this->conn->query($sql)) {
      throw new Exception('Failed to create replays table: ' . $this->conn->error);
    }

    $sql = "
      CREATE TABLE IF NOT EXISTS achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        achievement_id VARCHAR(100) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_achievement (user_id, achievement_id),
        INDEX idx_user (user_id),
        INDEX idx_achievement (achievement_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";

    if (!$this->conn->query($sql)) {
      throw new Exception('Failed to create achievements table: ' . $this->conn->error);
    }

    // Add missing columns to highscores table (migrations)
    $this->addColumnIfNotExists('highscores', 'best_moves', 'INT DEFAULT 0');
    $this->addColumnIfNotExists('highscores', 'best_time', 'FLOAT DEFAULT 0');

    // Add missing columns to user_profiles table (migrations)
    $this->addColumnIfNotExists('user_profiles', 'total_moves', 'INT DEFAULT 0');
    $this->addColumnIfNotExists('user_profiles', 'max_combo', 'INT DEFAULT 0');
    $this->addColumnIfNotExists('user_profiles', 'total_walls_survived', 'INT DEFAULT 0');
    $this->addColumnIfNotExists('user_profiles', 'no_reset_streak', 'INT DEFAULT 0');
    $this->addColumnIfNotExists('user_profiles', 'speed_levels', 'INT DEFAULT 0');
    $this->addColumnIfNotExists('user_profiles', 'perfect_levels', 'INT DEFAULT 0');
    $this->addColumnIfNotExists('user_profiles', 'total_days_played', 'INT DEFAULT 0');
  }

  public function getItem($userId, $key) {
    $stmt = $this->conn->prepare('SELECT data_value FROM game_data WHERE user_id = ? AND data_key = ?');
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ss', $userId, $key);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
      return null;
    }

    $row = $result->fetch_assoc();
    return $row['data_value'];
  }

  public function setItem($userId, $key, $value) {
    $stmt = $this->conn->prepare(
      'INSERT INTO game_data (user_id, data_key, data_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       data_value = VALUES(data_value),
       updated_at = CURRENT_TIMESTAMP'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('sss', $userId, $key, $value);
    $success = $stmt->execute();
    $stmt->close();

    return $success;
  }

  public function removeItem($userId, $key) {
    $stmt = $this->conn->prepare('DELETE FROM game_data WHERE user_id = ? AND data_key = ?');
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ss', $userId, $key);
    $success = $stmt->execute();
    $stmt->close();

    return $success;
  }

  public function getAllUserData($userId) {
    $stmt = $this->conn->prepare(
      'SELECT data_key, data_value FROM game_data WHERE user_id = ? ORDER BY updated_at DESC'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

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

  // ─── Highscores ──────────────────────────────────────────────────────

  public function saveHighscore($userId, $mode, $levelId, $moves = null, $time = null) {
    error_log("saveHighscore called: userId=$userId, mode=$mode, levelId=$levelId, moves=$moves, time=$time");

    // Ensure user profile exists first
    $this->ensureUserProfile($userId);

    // Convert and validate inputs
    $bestMoves = $moves !== null ? intval($moves) : 0;
    $bestTime = $time !== null ? floatval($time) : 0.0;

    // Calculate score based on mode and level difficulty
    $score = calculateScore($mode, $bestMoves, $bestTime, $levelId);

    error_log("Converted values: bestMoves=$bestMoves, bestTime=$bestTime, calculatedScore=$score");

    $sql = 'INSERT INTO highscores (user_id, mode, level_id, score, best_moves, best_time)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            score = VALUES(score),
            best_moves = VALUES(best_moves),
            best_time = VALUES(best_time)';

    error_log("SQL: $sql");

    $stmt = $this->conn->prepare($sql);

    if (!$stmt) {
      error_log("Prepare failed: " . $this->conn->error);
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    error_log("Prepare succeeded, binding params");

    $stmt->bind_param('ssiiid', $userId, $mode, $levelId, $score, $bestMoves, $bestTime);

    error_log("Bind succeeded, executing");

    $success = $stmt->execute();

    if (!$success) {
      error_log("Execute failed: " . $this->conn->error);
      throw new Exception('Execute failed: ' . $this->conn->error);
    }

    error_log("Execute succeeded");

    $stmt->close();

    return $success;
  }

  /**
   * Update user profile with aggregated stats from highscores and achievements
   */
  public function updateUserProfileStats($userId) {
    // Count total levels completed (each unique mode/level completion counts as 1)
    $stmt = $this->conn->prepare(
      'SELECT COUNT(DISTINCT level_id) as levels_completed, SUM(score) as total_score
       FROM highscores WHERE user_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    $stmt->close();

    error_log("updateUserProfileStats for $userId: raw stats = " . json_encode($stats));
    $levelsCompleted = intval($stats['levels_completed'] ?? 0);
    $totalScore = intval($stats['total_score'] ?? 0);
    error_log("updateUserProfileStats: levels=$levelsCompleted, score=$totalScore");

    // If query returned nothing or zeros, something is wrong - log the highscores for this user
    if ($totalScore === 0) {
      $checkStmt = $this->conn->prepare('SELECT COUNT(*) as count, SUM(score) as total FROM highscores WHERE user_id = ?');
      $checkStmt->bind_param('s', $userId);
      $checkStmt->execute();
      $checkResult = $checkStmt->get_result();
      $checkStats = $checkResult->fetch_assoc();
      $checkStmt->close();
      error_log("DEBUG: Highscores for $userId: " . json_encode($checkStats));
    }

    // Calculate total moves from best_moves in highscores
    $stmt = $this->conn->prepare(
      'SELECT SUM(best_moves) as total_moves FROM highscores WHERE user_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $moveStats = $result->fetch_assoc();
    $stmt->close();

    $totalMoves = intval($moveStats['total_moves'] ?? 0);

    // Count achievements
    $stmt = $this->conn->prepare(
      'SELECT COUNT(*) as achievement_count FROM achievements WHERE user_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $achStats = $result->fetch_assoc();
    $stmt->close();

    $achievementsCount = intval($achStats['achievement_count'] ?? 0);

    // Update user profile
    $stmt = $this->conn->prepare(
      'UPDATE user_profiles
       SET total_score = ?, total_moves = ?, levels_completed = ?, achievements_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('iiiis', $totalScore, $totalMoves, $levelsCompleted, $achievementsCount, $userId);
    $stmt->execute();
    $stmt->close();
  }

  public function getLeaderboard($mode, $limit = 100) {
    // If mode is 'global', return global leaderboard sorted by total_score DESC, then total_moves ASC
    if ($mode === 'global') {
      $stmt = $this->conn->prepare(
        'SELECT user_id, username, total_score, total_moves, achievements_count, levels_completed, created_at
         FROM user_profiles
         WHERE total_score > 0
         ORDER BY total_score DESC, total_moves ASC
         LIMIT ?'
      );
      if (!$stmt) {
        throw new Exception('Prepare failed: ' . $this->conn->error);
      }

      $stmt->bind_param('i', $limit);
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

    // Otherwise, return mode-specific leaderboard (one entry per user, their best score in this mode)
    $stmt = $this->conn->prepare(
      'SELECT h.user_id, MAX(h.score) as score, MAX(h.created_at) as created_at, COALESCE(up.username, h.user_id) as username, COALESCE(up.total_score, 0) as total_score
       FROM highscores h
       LEFT JOIN user_profiles up ON h.user_id = up.user_id
       WHERE h.mode = ?
       GROUP BY h.user_id
       ORDER BY score DESC
       LIMIT ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('si', $mode, $limit);
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

  public function getUserHighScore($userId, $mode, $levelId) {
    $stmt = $this->conn->prepare(
      'SELECT score FROM highscores WHERE user_id = ? AND mode = ? AND level_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ssi', $userId, $mode, $levelId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
      return null;
    }

    $row = $result->fetch_assoc();
    return intval($row['score']);
  }

  // ─── Achievements ────────────────────────────────────────────────────

  public function unlockAchievement($userId, $achievementId) {
    $stmt = $this->conn->prepare(
      'INSERT IGNORE INTO achievements (user_id, achievement_id) VALUES (?, ?)'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ss', $userId, $achievementId);
    $success = $stmt->execute();
    $stmt->close();

    // Update user profile stats after unlocking achievement
    if ($success) {
      $this->updateUserProfileStats($userId);
    }

    return $success;
  }

  public function getUserAchievements($userId) {
    $stmt = $this->conn->prepare(
      'SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    // Load achievement definitions from JSON file
    $achievementDefs = [];
    if (file_exists(__DIR__ . '/achievements.json')) {
      $defsJson = file_get_contents(__DIR__ . '/achievements.json');
      $defsData = json_decode($defsJson, true);
      if (isset($defsData['achievements'])) {
        foreach ($defsData['achievements'] as $def) {
          $achievementDefs[$def['id']] = $def;
        }
      }
    }

    $achievements = [];
    while ($row = $result->fetch_assoc()) {
      $achId = $row['achievement_id'];
      $achDef = $achievementDefs[$achId] ?? null;

      // Merge achievement definition with unlocked data
      $achievement = [
        'id' => $achId,
        'name' => $achDef['name'] ?? $achId,
        'icon' => $achDef['icon'] ?? '🏆',
        'unlockedAt' => $row['unlocked_at'],
      ];

      if ($achDef) {
        $achievement['description'] = $achDef['description'] ?? '';
        $achievement['points'] = $achDef['points'] ?? 0;
      }

      $achievements[] = $achievement;
    }

    return $achievements;
  }

  public function getAllAchievements($limit = 100) {
    $result = $this->conn->query(
      'SELECT achievement_id, COUNT(*) as count FROM achievements
       GROUP BY achievement_id
       ORDER BY count DESC
       LIMIT ' . intval($limit)
    );

    if (!$result) {
      throw new Exception('Query failed: ' . $this->conn->error);
    }

    $achievements = [];
    while ($row = $result->fetch_assoc()) {
      $achievements[] = $row;
    }

    return $achievements;
  }

  // ─── User Profiles ───────────────────────────────────────────────────

  public function ensureUserProfile($userId) {
    $stmt = $this->conn->prepare(
      'INSERT IGNORE INTO user_profiles (user_id) VALUES (?)'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $stmt->close();
  }

  public function getUserProfile($userId) {
    $stmt = $this->conn->prepare(
      'SELECT user_id, username, total_score, total_moves, achievements_count, levels_completed, max_combo, total_walls_survived, no_reset_streak, speed_levels, perfect_levels, total_days_played, created_at FROM user_profiles WHERE user_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
      return null;
    }

    return $result->fetch_assoc();
  }

  public function updateUserUsername($userId, $username) {
    // Ensure profile exists first
    $this->ensureUserProfile($userId);

    $stmt = $this->conn->prepare(
      'UPDATE user_profiles SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ss', $username, $userId);
    $success = $stmt->execute();
    $stmt->close();

    return $success;
  }

  public function getUserWins($userId, $limit = 50) {
    $stmt = $this->conn->prepare(
      'SELECT h.user_id, h.mode, h.level_id, h.score, h.created_at,
              COALESCE(up.username, h.user_id) as username
       FROM highscores h
       LEFT JOIN user_profiles up ON h.user_id = up.user_id
       WHERE h.user_id = ? AND h.score > 0
       ORDER BY h.created_at DESC
       LIMIT ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

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

  public function saveReplay($userId, $mode, $levelId, $moves, $score) {
    $movesJson = is_string($moves) ? $moves : json_encode($moves);
    $stmt = $this->conn->prepare(
      'INSERT INTO replays (user_id, mode, level_id, moves, score)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       moves = VALUES(moves),
       score = VALUES(score),
       updated_at = CURRENT_TIMESTAMP'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ssiss', $userId, $mode, $levelId, $movesJson, $score);
    $success = $stmt->execute();
    $stmt->close();

    return $success;
  }

  public function updateUserStats($userId, $maxCombo = null, $wallsSurvived = null, $noResetStreak = null, $speedLevels = null, $perfectLevels = null, $daysPlayed = null) {
    // Ensure profile exists
    $this->ensureUserProfile($userId);

    // Update each stat individually to avoid dynamic bind_param issues
    if ($maxCombo !== null) {
      $stmt = $this->conn->prepare('UPDATE user_profiles SET max_combo = GREATEST(IFNULL(max_combo, 0), ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
      $stmt->bind_param('is', $maxCombo, $userId);
      $stmt->execute();
      $stmt->close();
    }

    if ($wallsSurvived !== null) {
      $stmt = $this->conn->prepare('UPDATE user_profiles SET total_walls_survived = GREATEST(IFNULL(total_walls_survived, 0), ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
      $stmt->bind_param('is', $wallsSurvived, $userId);
      $stmt->execute();
      $stmt->close();
    }

    if ($noResetStreak !== null) {
      $stmt = $this->conn->prepare('UPDATE user_profiles SET no_reset_streak = GREATEST(IFNULL(no_reset_streak, 0), ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
      $stmt->bind_param('is', $noResetStreak, $userId);
      $stmt->execute();
      $stmt->close();
    }

    if ($speedLevels !== null) {
      $stmt = $this->conn->prepare('UPDATE user_profiles SET speed_levels = GREATEST(IFNULL(speed_levels, 0), ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
      $stmt->bind_param('is', $speedLevels, $userId);
      $stmt->execute();
      $stmt->close();
    }

    if ($perfectLevels !== null) {
      $stmt = $this->conn->prepare('UPDATE user_profiles SET perfect_levels = GREATEST(IFNULL(perfect_levels, 0), ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
      $stmt->bind_param('is', $perfectLevels, $userId);
      $stmt->execute();
      $stmt->close();
    }

    if ($daysPlayed !== null) {
      $stmt = $this->conn->prepare('UPDATE user_profiles SET total_days_played = GREATEST(IFNULL(total_days_played, 0), ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
      $stmt->bind_param('is', $daysPlayed, $userId);
      $stmt->execute();
      $stmt->close();
    }

    return true;
  }

  public function getReplay($userId, $mode, $levelId) {
    $stmt = $this->conn->prepare(
      'SELECT user_id, mode, level_id, moves, score, created_at
       FROM replays
       WHERE user_id = ? AND mode = ? AND level_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ssi', $userId, $mode, $levelId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $row = $result->fetch_assoc();
    if ($row) {
      $row['moves'] = json_decode($row['moves'], true);
    }

    return $row;
  }

  // ─── Debug Endpoints ──────────────────────────────────────────────

  public function getSchemaInfo() {
    $tables = [];

    // Get all tables
    $result = $this->conn->query("SHOW TABLES");
    if (!$result) {
      throw new Exception('Failed to list tables: ' . $this->conn->error);
    }

    while ($row = $result->fetch_row()) {
      $tableName = $row[0];
      $columns = [];

      // Get all columns for this table
      $colResult = $this->conn->query("SHOW COLUMNS FROM `$tableName`");
      if ($colResult) {
        while ($colRow = $colResult->fetch_assoc()) {
          $columns[] = [
            'name' => $colRow['Field'],
            'type' => $colRow['Type'],
            'null' => $colRow['Null'],
            'key' => $colRow['Key'],
            'default' => $colRow['Default'],
            'extra' => $colRow['Extra'],
          ];
        }
      }

      // Get row count
      $countResult = $this->conn->query("SELECT COUNT(*) as cnt FROM `$tableName`");
      $countRow = $countResult->fetch_assoc();
      $rowCount = intval($countRow['cnt']);

      $tables[$tableName] = [
        'row_count' => $rowCount,
        'columns' => $columns,
      ];
    }

    return $tables;
  }

  public function cleanupTestData($userId) {
    if (empty($userId)) {
      throw new Exception('userId is required for cleanup');
    }

    $deleted = [
      'highscores' => 0,
      'replays' => 0,
      'user_profiles' => 0,
      'achievements' => 0,
      'game_data' => 0,
    ];

    // Delete test data for specific user only
    $stmt = $this->conn->prepare('DELETE FROM highscores WHERE user_id = ?');
    if ($stmt) {
      $stmt->bind_param('s', $userId);
      $stmt->execute();
      $deleted['highscores'] = $this->conn->affected_rows;
      $stmt->close();
    }

    $stmt = $this->conn->prepare('DELETE FROM replays WHERE user_id = ?');
    if ($stmt) {
      $stmt->bind_param('s', $userId);
      $stmt->execute();
      $deleted['replays'] = $this->conn->affected_rows;
      $stmt->close();
    }

    $stmt = $this->conn->prepare('DELETE FROM achievements WHERE user_id = ?');
    if ($stmt) {
      $stmt->bind_param('s', $userId);
      $stmt->execute();
      $deleted['achievements'] = $this->conn->affected_rows;
      $stmt->close();
    }

    $stmt = $this->conn->prepare('DELETE FROM game_data WHERE user_id = ?');
    if ($stmt) {
      $stmt->bind_param('s', $userId);
      $stmt->execute();
      $deleted['game_data'] = $this->conn->affected_rows;
      $stmt->close();
    }

    $stmt = $this->conn->prepare('DELETE FROM user_profiles WHERE user_id = ?');
    if ($stmt) {
      $stmt->bind_param('s', $userId);
      $stmt->execute();
      $deleted['user_profiles'] = $this->conn->affected_rows;
      $stmt->close();
    }

    return $deleted;
  }

  public function close() {
    $this->conn->close();
  }
}

// Initialize database
try {
  $db = new Database($DB_HOST, $DB_PORT, $DB_USER, $DB_PASS, $DB_NAME);
} catch (Exception $e) {
  http_response_code(500);
  die(json_encode(['error' => 'Database initialization failed: ' . $e->getMessage()]));
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove leading/trailing slashes and split
$pathParts = array_filter(explode('/', trim($path, '/')));
$pathParts = array_values($pathParts); // Re-index after filter

// Find 'api' segment and extract route
$apiIndex = array_search('api', $pathParts);

if ($apiIndex === false) {
  // Health check at root (direct hit to api.php or /api)
  if (empty($pathParts) ||
      (count($pathParts) === 1 && $pathParts[0] === 'api') ||
      (count($pathParts) === 1 && strpos($pathParts[0], 'api.php') !== false) ||
      (count($pathParts) === 2 && $pathParts[1] === 'api.php')) {
    http_response_code(200);
    echo json_encode([
      'status' => 'ok',
      'time' => date('c'),
      'database' => 'connected',
    ]);
    $db->close();
    exit;
  }

  http_response_code(404);
  echo json_encode(['error' => 'Route not found', 'pathParts' => $pathParts, 'apiIndex' => $apiIndex]);
  $db->close();
  exit;
}

// Extract route after 'api'
$routeParts = array_slice($pathParts, $apiIndex + 1);

try {
  // Health check: GET /api/health
  if (count($routeParts) === 1 && $routeParts[0] === 'health' && $method === 'GET') {
    http_response_code(200);
    echo json_encode([
      'status' => 'ok',
      'time' => date('c'),
      'database' => 'connected',
    ]);
    $db->close();
    exit;
  }

  // Get single item: GET /api/data/{userId}/{key}
  if (count($routeParts) === 3 && $routeParts[0] === 'data' && $method === 'GET') {
    $userId = $routeParts[1];
    $key = $routeParts[2];

    if (empty($userId) || empty($key)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId or key']);
      $db->close();
      exit;
    }

    $value = $db->getItem($userId, $key);

    if ($value === null) {
      http_response_code(404);
      echo json_encode(['error' => 'Not found']);
    } else {
      http_response_code(200);
      echo json_encode(['value' => $value]);
    }
    $db->close();
    exit;
  }

  // Set item: POST /api/data/{userId}/{key}
  if (count($routeParts) === 3 && $routeParts[0] === 'data' && $method === 'POST') {
    $userId = $routeParts[1];
    $key = $routeParts[2];

    if (empty($userId) || empty($key)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId or key']);
      $db->close();
      exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $value = $body['value'] ?? null;

    if ($value === null) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing value in request body']);
      $db->close();
      exit;
    }

    if ($db->setItem($userId, $key, $value)) {
      http_response_code(200);
      echo json_encode(['success' => true]);
    } else {
      http_response_code(500);
      echo json_encode(['error' => 'Failed to save']);
    }
    $db->close();
    exit;
  }

  // Delete item: DELETE /api/data/{userId}/{key}
  if (count($routeParts) === 3 && $routeParts[0] === 'data' && $method === 'DELETE') {
    $userId = $routeParts[1];
    $key = $routeParts[2];

    if (empty($userId) || empty($key)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId or key']);
      $db->close();
      exit;
    }

    if ($db->removeItem($userId, $key)) {
      http_response_code(200);
      echo json_encode(['success' => true]);
    } else {
      http_response_code(500);
      echo json_encode(['error' => 'Failed to delete']);
    }
    $db->close();
    exit;
  }

  // Get all user data: GET /api/user/{userId}/data
  if (count($routeParts) === 3 && $routeParts[0] === 'user' && $routeParts[2] === 'data' && $method === 'GET') {
    $userId = $routeParts[1];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    $data = $db->getAllUserData($userId);
    http_response_code(200);
    echo json_encode($data);
    $db->close();
    exit;
  }

  // ─── Leaderboards ─────────────────────────────────────────────────────

  // Get leaderboard: GET /api/leaderboard/{mode}
  if (count($routeParts) === 2 && $routeParts[0] === 'leaderboard' && $method === 'GET') {
    $mode = $routeParts[1];
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;

    if (empty($mode)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing mode']);
      $db->close();
      exit;
    }

    $leaderboard = $db->getLeaderboard($mode, $limit);
    http_response_code(200);
    echo json_encode($leaderboard);
    $db->close();
    exit;
  }

  // Save highscore: POST /api/highscore/{userId}/{mode}/{levelId}
  if (count($routeParts) === 4 && $routeParts[0] === 'highscore' && $method === 'POST') {
    $userId = $routeParts[1];
    $mode = $routeParts[2];
    $levelId = intval($routeParts[3]);

    if (empty($userId) || empty($mode) || $levelId === 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId, mode, or levelId']);
      $db->close();
      exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $moves = $body['moves'] ?? null;
    $time = $body['time'] ?? null;

    // Moves and time are required for score calculation
    if ($moves === null || $time === null) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing moves or time']);
      $db->close();
      exit;
    }

    try {
      if ($db->saveHighscore($userId, $mode, $levelId, intval($moves), floatval($time))) {
        // Update user profile with aggregated stats
        $db->updateUserProfileStats($userId);

        http_response_code(200);
        echo json_encode(['success' => true]);
      } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save highscore']);
      }
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(['error' => 'Highscore save error: ' . $e->getMessage()]);
    }
    $db->close();
    exit;
  }

  // Get user highscore: GET /api/highscore/{userId}/{mode}/{levelId}
  if (count($routeParts) === 4 && $routeParts[0] === 'highscore' && $method === 'GET') {
    $userId = $routeParts[1];
    $mode = $routeParts[2];
    $levelId = intval($routeParts[3]);

    if (empty($userId) || empty($mode) || $levelId === 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId, mode, or levelId']);
      $db->close();
      exit;
    }

    $score = $db->getUserHighScore($userId, $mode, $levelId);
    http_response_code(200);
    echo json_encode(['score' => $score]);
    $db->close();
    exit;
  }

  // ─── Achievements ─────────────────────────────────────────────────────

  // Unlock achievement: POST /api/achievement/{userId}/{achievementId}
  if (count($routeParts) === 3 && $routeParts[0] === 'achievement' && $method === 'POST') {
    $userId = $routeParts[1];
    $achievementId = $routeParts[2];

    if (empty($userId) || empty($achievementId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId or achievementId']);
      $db->close();
      exit;
    }

    if ($db->unlockAchievement($userId, $achievementId)) {
      http_response_code(200);
      echo json_encode(['success' => true]);
    } else {
      http_response_code(500);
      echo json_encode(['error' => 'Failed to unlock achievement']);
    }
    $db->close();
    exit;
  }

  // Get user achievements: GET /api/achievement/{userId}
  if (count($routeParts) === 2 && $routeParts[0] === 'achievement' && $method === 'GET') {
    $userId = $routeParts[1];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    $achievements = $db->getUserAchievements($userId);
    http_response_code(200);
    echo json_encode($achievements);
    $db->close();
    exit;
  }

  // Get all achievements stats: GET /api/achievements
  if (count($routeParts) === 1 && $routeParts[0] === 'achievements' && $method === 'GET') {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    $achievements = $db->getAllAchievements($limit);
    http_response_code(200);
    echo json_encode($achievements);
    $db->close();
    exit;
  }

  // ─── User Profiles ────────────────────────────────────────────────────

  // Get user profile: GET /api/profile/{userId}
  if (count($routeParts) === 2 && $routeParts[0] === 'profile' && $method === 'GET') {
    $userId = $routeParts[1];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    $db->ensureUserProfile($userId);
    $profile = $db->getUserProfile($userId);
    http_response_code(200);
    echo json_encode($profile);
    $db->close();
    exit;
  }

  // Update user profile (username): POST /api/profile/{userId}
  if (count($routeParts) === 2 && $routeParts[0] === 'profile' && $method === 'POST') {
    $userId = $routeParts[1];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $username = $body['username'] ?? null;

    if (empty($username)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing username']);
      $db->close();
      exit;
    }

    if ($db->updateUserUsername($userId, $username)) {
      http_response_code(200);
      echo json_encode(['success' => true]);
    } else {
      http_response_code(500);
      echo json_encode(['error' => 'Failed to update profile']);
    }
    $db->close();
    exit;
  }

  // Get user wins (game history): GET /api/profile/{userId}/wins
  if (count($routeParts) === 3 && $routeParts[0] === 'profile' && $routeParts[2] === 'wins' && $method === 'GET') {
    $userId = $routeParts[1];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $wins = $db->getUserWins($userId, $limit);
    http_response_code(200);
    echo json_encode($wins);
    $db->close();
    exit;
  }

  // Update user stats: POST /api/profile/{userId}/stats
  if (count($routeParts) === 3 && $routeParts[0] === 'profile' && $routeParts[2] === 'stats' && $method === 'POST') {
    $userId = $routeParts[1];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);

    try {
      if ($db->updateUserStats(
        $userId,
        $body['maxCombo'] ?? null,
        $body['wallsSurvived'] ?? null,
        $body['noResetStreak'] ?? null,
        $body['speedLevels'] ?? null,
        $body['perfectLevels'] ?? null,
        $body['daysPlayed'] ?? null
      )) {
        http_response_code(200);
        echo json_encode(['success' => true]);
      } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update stats']);
      }
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(['error' => 'Stats update error: ' . $e->getMessage()]);
    }
    $db->close();
    exit;
  }

  // Get complete user profile with achievements and wins: GET /api/profile/{userId}/full
  if (count($routeParts) === 3 && $routeParts[0] === 'profile' && $routeParts[2] === 'full' && $method === 'GET') {
    $userId = $routeParts[1];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    $db->ensureUserProfile($userId);
    $profile = $db->getUserProfile($userId);
    $achievements = $db->getUserAchievements($userId);
    $wins = $db->getUserWins($userId, 50);

    $fullProfile = [
      'profile' => $profile,
      'achievements' => $achievements,
      'wins' => $wins,
    ];

    http_response_code(200);
    echo json_encode($fullProfile);
    $db->close();
    exit;
  }

  // Save replay: POST /api/replay/{userId}/{mode}/{levelId}
  if (count($routeParts) === 4 && $routeParts[0] === 'replay' && $method === 'POST') {
    $userId = $routeParts[1];
    $mode = $routeParts[2];
    $levelId = intval($routeParts[3]);

    if (empty($userId) || empty($mode) || $levelId === 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId, mode, or levelId']);
      $db->close();
      exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $moves = $body['moves'] ?? null;
    $score = intval($body['score'] ?? 0);

    if ($moves === null) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing moves data']);
      $db->close();
      exit;
    }

    if ($db->saveReplay($userId, $mode, $levelId, $moves, $score)) {
      http_response_code(200);
      echo json_encode(['success' => true]);
    } else {
      http_response_code(500);
      echo json_encode(['error' => 'Failed to save replay']);
    }
    $db->close();
    exit;
  }

  // Get replay: GET /api/replay/{userId}/{mode}/{levelId}
  if (count($routeParts) === 4 && $routeParts[0] === 'replay' && $method === 'GET') {
    $userId = $routeParts[1];
    $mode = $routeParts[2];
    $levelId = intval($routeParts[3]);

    if (empty($userId) || empty($mode) || $levelId === 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId, mode, or levelId']);
      $db->close();
      exit;
    }

    $replay = $db->getReplay($userId, $mode, $levelId);

    if ($replay) {
      http_response_code(200);
      echo json_encode($replay);
    } else {
      http_response_code(404);
      echo json_encode(['error' => 'Replay not found']);
    }
    $db->close();
    exit;
  }

  // ─── Debug Endpoints ──────────────────────────────────────────────

  // Get database schema info: GET /api/debug/schema
  if (count($routeParts) === 2 && $routeParts[0] === 'debug' && $routeParts[1] === 'schema' && $method === 'GET') {
    try {
      $schemaInfo = $db->getSchemaInfo();
      http_response_code(200);
      echo json_encode([
        'database' => $DB_NAME,
        'tables' => $schemaInfo,
      ]);
      $db->close();
      exit;
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(['error' => $e->getMessage()]);
      $db->close();
      exit;
    }
  }

  // Clean up test data for user: DELETE /api/debug/cleanup/{userId}
  if (count($routeParts) === 3 && $routeParts[0] === 'debug' && $routeParts[1] === 'cleanup' && $method === 'DELETE') {
    $userId = $routeParts[2];

    if (empty($userId)) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing userId']);
      $db->close();
      exit;
    }

    try {
      $deleted = $db->cleanupTestData($userId);
      http_response_code(200);
      echo json_encode([
        'status' => 'success',
        'message' => "Test data cleaned up for user: $userId",
        'user_id' => $userId,
        'deleted' => $deleted,
      ]);
      $db->close();
      exit;
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(['error' => $e->getMessage()]);
      $db->close();
      exit;
    }
  }

  // Route not found
  http_response_code(404);
  echo json_encode([
    'error' => 'Route not found',
    'path' => $path,
    'method' => $method,
    'routeParts' => $routeParts,
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}

$db->close();
?>
