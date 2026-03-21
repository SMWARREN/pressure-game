-- PRESSURE - Database Schema
-- Proper relational structure (no JSON blobs)
-- All data is normalized and queryable

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Game completions (scores, moves, times)
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
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  achievement_id VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  INDEX idx_user (user_id),
  INDEX idx_achievement (achievement_id)
);

-- User performance stats
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
);

-- Game replays
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
);

-- Leaderboards (materialized view for fast queries)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mode VARCHAR(50) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  username VARCHAR(255),
  score INT,
  rank INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mode_user (mode, user_id),
  INDEX idx_mode_rank (mode, rank),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_completions_user_mode ON game_completions(user_id, mode);
CREATE INDEX idx_stats_updated ON user_stats(updated_at DESC);
CREATE INDEX idx_achievements_unlocked ON user_achievements(unlocked_at DESC);
