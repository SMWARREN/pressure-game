<?php
/**
 * PRESSURE GAME - Database Initialization Script
 *
 * Run this script once to create all required tables for the Pressure Game API.
 * Usage: php api-init.php
 *
 * This creates:
 * - game_data: Main game persistence (save states)
 * - user_profiles: User stats and metadata
 * - highscores: Top scores by mode/level
 * - achievements: User achievements
 */

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

echo "=== PRESSURE GAME - Database Initialization ===\n";
echo "Connecting to: $DB_HOST:$DB_PORT\n";

// Connect to MySQL
$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);

if ($conn->connect_error) {
  die("ERROR: Connection failed - " . $conn->connect_error . "\n");
}

echo "✓ Connected to MySQL\n\n";

$conn->set_charset('utf8mb4');

// Table creation functions
$tables = [
  [
    'name' => 'game_data',
    'sql' => "
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
    "
  ],
  [
    'name' => 'user_profiles',
    'sql' => "
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
    "
  ],
  [
    'name' => 'highscores',
    'sql' => "
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
    "
  ],
  [
    'name' => 'achievements',
    'sql' => "
      CREATE TABLE IF NOT EXISTS achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        achievement_id VARCHAR(100) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_achievement (user_id, achievement_id),
        INDEX idx_user (user_id),
        INDEX idx_achievement (achievement_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    "
  ]
];

// Create tables
$created = 0;
$existing = 0;

foreach ($tables as $table) {
  if ($conn->query($table['sql'])) {
    // Check if table already existed
    $result = $conn->query("SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = '{$table['name']}'");
    $row = $result->fetch_assoc();

    if ($row['count'] > 0) {
      echo "✓ Table '{$table['name']}' already exists\n";
      $existing++;
    } else {
      echo "✓ Created table '{$table['name']}'\n";
      $created++;
    }
  } else {
    die("ERROR: Failed to create {$table['name']}: " . $conn->error . "\n");
  }
}

$conn->close();

echo "\n=== Initialization Complete ===\n";
echo "Tables created: $created\n";
echo "Tables existing: $existing\n";
echo "\n✓ Database is ready for the Pressure Game API!\n";
echo "\nAPI Endpoints:\n";
echo "  POST /api/data/{userId}/{key}              - Save data\n";
echo "  GET  /api/data/{userId}/{key}              - Load data\n";
echo "  POST /api/highscore/{userId}/{mode}/{level} - Save score\n";
echo "  GET  /api/leaderboard/{mode}               - Get leaderboard\n";
echo "  POST /api/achievement/{userId}/{id}        - Unlock achievement\n";
echo "  GET  /api/achievement/{userId}             - Get user achievements\n";
echo "  GET  /api/profile/{userId}                 - Get user profile\n";
?>
