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

// Load environment variables
$env = [];
if (file_exists('.env')) {
  $env = parse_ini_file('.env', true) ?: [];
}

// Database Configuration
$DB_HOST = $env['MYSQL_HOST'] ?? 'localhost';
$DB_PORT = $env['MYSQL_PORT'] ?? 3306;
$DB_USER = $env['MYSQL_USER'] ?? 'saintsea_pressure';
$DB_PASS = $env['MYSQL_PASSWORD'] ?? 'pressurepressure';
$DB_NAME = $env['MYSQL_DATABASE'] ?? 'saintsea_pressure-engine';

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

  private function initTable() {
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
        achievements_count INT DEFAULT 0,
        levels_completed INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_total_score (total_score DESC),
        INDEX idx_achievements (achievements_count DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";

    if (!$this->conn->query($sql)) {
      throw new Exception('Failed to create user_profiles table: ' . $this->conn->error);
    }

    // Highscores table
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

    // Achievements table
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

  public function saveHighscore($userId, $mode, $levelId, $score) {
    $stmt = $this->conn->prepare(
      'INSERT INTO highscores (user_id, mode, level_id, score)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       score = IF(VALUES(score) > score, VALUES(score), score),
       updated_at = CURRENT_TIMESTAMP'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('ssii', $userId, $mode, $levelId, $score);
    $success = $stmt->execute();
    $stmt->close();

    // Update user profile stats (aggregate from highscores and achievements)
    if ($success) {
      $this->updateUserProfileStats($userId);
    }

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

    $levelsCompleted = intval($stats['levels_completed'] ?? 0);
    $totalScore = intval($stats['total_score'] ?? 0);

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
       SET total_score = ?, levels_completed = ?, achievements_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?'
    );
    if (!$stmt) {
      throw new Exception('Prepare failed: ' . $this->conn->error);
    }

    $stmt->bind_param('iis', $totalScore, $levelsCompleted, $achievementsCount, $userId);
    $stmt->execute();
    $stmt->close();
  }

  public function getLeaderboard($mode, $limit = 100) {
    $stmt = $this->conn->prepare(
      'SELECT h.user_id, h.score, h.created_at, COALESCE(up.username, h.user_id) as username
       FROM highscores h
       LEFT JOIN user_profiles up ON h.user_id = up.user_id
       WHERE h.mode = ?
       ORDER BY h.score DESC
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
      'SELECT user_id, username, total_score, achievements_count, levels_completed, created_at FROM user_profiles WHERE user_id = ?'
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
  // Health check at root
  if (empty($pathParts) || (count($pathParts) === 1 && $pathParts[0] === 'api')) {
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
  echo json_encode(['error' => 'Route not found']);
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
    $score = $body['score'] ?? null;

    if ($score === null) {
      http_response_code(400);
      echo json_encode(['error' => 'Missing score']);
      $db->close();
      exit;
    }

    if ($db->saveHighscore($userId, $mode, $levelId, intval($score))) {
      http_response_code(200);
      echo json_encode(['success' => true]);
    } else {
      http_response_code(500);
      echo json_encode(['error' => 'Failed to save highscore']);
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
