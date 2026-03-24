-- SQLite schema for Pressure Game tests
-- Simplified from MySQL schema for SQLite compatibility

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL,
    mode VARCHAR(50) NOT NULL,
    level_id INT NOT NULL,
    score INT,
    moves INT,
    elapsed_seconds FLOAT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, mode, level_id)
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS replays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL,
    mode VARCHAR(50) NOT NULL,
    level_id INT NOT NULL,
    moves_json TEXT NOT NULL,
    score INT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode VARCHAR(50) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    username VARCHAR(255),
    score INT,
    rank INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mode, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS highscores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(255) NOT NULL,
    mode VARCHAR(50) NOT NULL,
    level_id INT NOT NULL,
    score INT NOT NULL,
    moves INT,
    elapsed_time FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mode, level_id)
);

CREATE TABLE IF NOT EXISTS game_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(255) NOT NULL,
    data_key VARCHAR(255) NOT NULL,
    data_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, data_key)
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    total_score INT DEFAULT 0,
    total_moves INT DEFAULT 0,
    achievements_count INT DEFAULT 0,
    levels_completed INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(255) NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);
