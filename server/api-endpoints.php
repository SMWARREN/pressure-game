<?php
/**
 * PRESSURE - Game API Endpoints
 * Proper relational database endpoints (no JSON blobs)
 */

require_once 'config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_filter(explode('/', $path));

// ─── USER ENDPOINTS ────────────────────────────────────────────────────────

// GET /api/users/{userId} - Get user profile
if ($method === 'GET' && count($parts) === 3 && $parts[1] === 'api' && $parts[2] === 'users') {
  $userId = $_GET['id'] ?? null;
  if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user ID']);
    exit;
  }

  try {
    $stmt = $pdo->prepare('SELECT id, username, created_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
      http_response_code(404);
      echo json_encode(['error' => 'User not found']);
      exit;
    }

    // Get stats
    $stmt = $pdo->prepare('SELECT * FROM user_stats WHERE user_id = ?');
    $stmt->execute([$userId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
      'user' => $user,
      'stats' => $stats ?: []
    ]);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// POST /api/users - Create or get user
if ($method === 'POST' && count($parts) === 2 && $parts[1] === 'users') {
  $data = json_decode(file_get_contents('php://input'), true);
  $userId = $data['id'] ?? null;
  $username = $data['username'] ?? null;

  if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user ID']);
    exit;
  }

  try {
    // Try to insert (IGNORE if exists)
    $stmt = $pdo->prepare('INSERT IGNORE INTO users (id, username) VALUES (?, ?)');
    $stmt->execute([$userId, $username]);

    // Return user
    $stmt = $pdo->prepare('SELECT id, username, created_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($user);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// ─── GAME COMPLETION ENDPOINTS ─────────────────────────────────────────────

// POST /api/games - Record game completion
if ($method === 'POST' && count($parts) === 2 && $parts[1] === 'games') {
  $data = json_decode(file_get_contents('php://input'), true);
  $userId = $data['user_id'] ?? null;
  $mode = $data['mode'] ?? null;
  $levelId = $data['level_id'] ?? null;
  $score = $data['score'] ?? null;
  $moves = $data['moves'] ?? null;
  $time = $data['elapsed_seconds'] ?? null;

  if (!$userId || !$mode || $levelId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
  }

  try {
    $stmt = $pdo->prepare(
      'INSERT INTO game_completions (user_id, mode, level_id, score, moves, elapsed_seconds)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score))'
    );
    $stmt->execute([$userId, $mode, $levelId, $score, $moves, $time]);

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Game recorded']);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// GET /api/games - Get user games
if ($method === 'GET' && count($parts) === 2 && $parts[1] === 'games') {
  $userId = $_GET['user_id'] ?? null;
  $mode = $_GET['mode'] ?? null;
  $limit = $_GET['limit'] ?? 100;

  if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
    exit;
  }

  try {
    $sql = 'SELECT * FROM game_completions WHERE user_id = ?';
    $params = [$userId];

    if ($mode) {
      $sql .= ' AND mode = ?';
      $params[] = $mode;
    }

    $sql .= ' ORDER BY completed_at DESC LIMIT ?';
    $params[] = (int)$limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $games = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($games);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// ─── ACHIEVEMENT ENDPOINTS ────────────────────────────────────────────────

// POST /api/achievements/{id} - Unlock achievement
if ($method === 'POST' && count($parts) === 3 && $parts[1] === 'achievements') {
  $userId = $_GET['user_id'] ?? null;
  $achievementId = $parts[2];

  if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
    exit;
  }

  try {
    $stmt = $pdo->prepare(
      'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
    );
    $stmt->execute([$userId, $achievementId]);

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Achievement unlocked']);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// GET /api/achievements - Get user achievements
if ($method === 'GET' && count($parts) === 2 && $parts[1] === 'achievements') {
  $userId = $_GET['user_id'] ?? null;
  $limit = $_GET['limit'] ?? 100;

  if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
    exit;
  }

  try {
    $stmt = $pdo->prepare(
      'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY unlocked_at DESC LIMIT ?'
    );
    $stmt->execute([$userId, (int)$limit]);
    $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($achievements);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// ─── STATS ENDPOINTS ───────────────────────────────────────────────────────

// POST /api/stats - Update user stats
if ($method === 'POST' && count($parts) === 2 && $parts[1] === 'stats') {
  $data = json_decode(file_get_contents('php://input'), true);
  $userId = $data['user_id'] ?? null;

  if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
    exit;
  }

  try {
    // Ensure user exists
    $stmt = $pdo->prepare('INSERT IGNORE INTO users (id) VALUES (?)');
    $stmt->execute([$userId]);

    // Ensure stats row exists
    $stmt = $pdo->prepare('INSERT IGNORE INTO user_stats (user_id) VALUES (?)');
    $stmt->execute([$userId]);

    // Update with provided fields
    $updates = [];
    $params = [];
    foreach (['total_levels_completed', 'total_score', 'max_combo', 'total_walls_survived',
              'no_reset_streak', 'speed_levels', 'perfect_levels', 'total_hours_played'] as $field) {
      if (isset($data[$field])) {
        $updates[] = "{$field} = ?";
        $params[] = $data[$field];
      }
    }

    if (empty($updates)) {
      echo json_encode(['success' => true, 'message' => 'No updates']);
      exit;
    }

    $params[] = $userId;
    $sql = 'UPDATE user_stats SET ' . implode(', ', $updates) . ' WHERE user_id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Stats updated']);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// GET /api/stats - Get user stats
if ($method === 'GET' && count($parts) === 2 && $parts[1] === 'stats') {
  $userId = $_GET['user_id'] ?? null;

  if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
    exit;
  }

  try {
    $stmt = $pdo->prepare('SELECT * FROM user_stats WHERE user_id = ?');
    $stmt->execute([$userId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($stats ?: []);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// ─── LEADERBOARD ENDPOINTS ────────────────────────────────────────────────

// GET /api/leaderboards/{mode} - Get mode leaderboard
if ($method === 'GET' && count($parts) === 3 && $parts[1] === 'leaderboards') {
  $mode = $parts[2];
  $limit = $_GET['limit'] ?? 100;

  try {
    $stmt = $pdo->prepare(
      'SELECT user_id, username, score, rank FROM leaderboard_cache
       WHERE mode = ? ORDER BY rank ASC LIMIT ?'
    );
    $stmt->execute([$mode, (int)$limit]);
    $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($leaderboard);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// ─── REPLAY ENDPOINTS ──────────────────────────────────────────────────────

// POST /api/replays - Save replay
if ($method === 'POST' && count($parts) === 2 && $parts[1] === 'replays') {
  $data = json_decode(file_get_contents('php://input'), true);
  $userId = $data['user_id'] ?? null;
  $mode = $data['mode'] ?? null;
  $levelId = $data['level_id'] ?? null;
  $moves = $data['moves'] ?? [];
  $score = $data['score'] ?? null;

  if (!$userId || !$mode || $levelId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
  }

  try {
    $stmt = $pdo->prepare(
      'INSERT INTO replays (user_id, mode, level_id, moves_json, score)
       VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $mode, $levelId, json_encode($moves), $score]);

    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// GET /api/replays - Get replay
if ($method === 'GET' && count($parts) === 2 && $parts[1] === 'replays') {
  $userId = $_GET['user_id'] ?? null;
  $mode = $_GET['mode'] ?? null;
  $levelId = $_GET['level_id'] ?? null;

  if (!$userId || !$mode || $levelId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
  }

  try {
    $stmt = $pdo->prepare(
      'SELECT moves_json as moves, score FROM replays
       WHERE user_id = ? AND mode = ? AND level_id = ?
       ORDER BY recorded_at DESC LIMIT 1'
    );
    $stmt->execute([$userId, $mode, (int)$levelId]);
    $replay = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($replay) {
      $replay['moves'] = json_decode($replay['moves'], true);
    }

    echo json_encode($replay ?: null);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
