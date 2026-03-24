<?php

use PHPUnit\Framework\TestCase;

/**
 * Tests for Database class using SQLite for isolation.
 * Each test gets a fresh temporary database that's destroyed after.
 */
class DatabaseTest extends TestCase
{
    private ?\PDO $pdo = null;
    private string $dbFile = '';

    protected function setUp(): void
    {
        // Create temporary SQLite database
        $this->dbFile = tempnam(sys_get_temp_dir(), 'test_db_');
        unlink($this->dbFile);

        $this->pdo = new \PDO('sqlite:' . $this->dbFile);
        $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $this->pdo->exec('PRAGMA foreign_keys = ON');

        $this->createSchema();
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        if (file_exists($this->dbFile)) {
            unlink($this->dbFile);
        }
    }

    private function createSchema(): void
    {
        $schema = file_get_contents(__DIR__ . '/../schema.sql');
        $statements = array_filter(
            array_map('trim', explode(';', $schema)),
            fn($stmt) => !empty($stmt)
        );
        foreach ($statements as $stmt) {
            $this->pdo->exec($stmt);
        }
    }

    // ─── User-related operations ─────────────────────────────────────────────

    public function testInsertUser(): void
    {
        $stmt = $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)');
        $result = $stmt->execute(['user1', 'testuser']);

        $this->assertTrue($result);

        // Verify insertion
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute(['user1']);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        $this->assertNotNull($user);
        $this->assertSame('user1', $user['id']);
        $this->assertSame('testuser', $user['username']);
    }

    public function testUserUniquenessConstraint(): void
    {
        $stmt = $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)');
        $stmt->execute(['user1', 'duplicate']);
        $stmt->execute(['user2', 'different']);

        // Second insert with same username should fail
        $this->expectException(\PDOException::class);
        $stmt->execute(['user3', 'duplicate']);
    }

    // ─── Game completions ────────────────────────────────────────────────────

    public function testInsertGameCompletion(): void
    {
        // Setup user
        $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)')->execute(['user1', 'test']);

        // Insert game completion
        $stmt = $this->pdo->prepare(
            'INSERT INTO game_completions (user_id, mode, level_id, score, moves, elapsed_seconds)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $result = $stmt->execute(['user1', 'classic', 1, 9500, 10, 25.5]);

        $this->assertTrue($result);

        // Verify
        $stmt = $this->pdo->prepare('SELECT * FROM game_completions WHERE user_id = ?');
        $stmt->execute(['user1']);
        $completion = $stmt->fetch(\PDO::FETCH_ASSOC);

        $this->assertNotNull($completion);
        $this->assertSame(9500, (int)$completion['score']);
        $this->assertSame(10, (int)$completion['moves']);
    }

    public function testGameCompletionUniqueConstraint(): void
    {
        $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)')->execute(['user1', 'test']);

        $stmt = $this->pdo->prepare(
            'INSERT OR IGNORE INTO game_completions (user_id, mode, level_id, score)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(['user1', 'classic', 1, 9500]);
        $stmt->execute(['user1', 'classic', 1, 9600]);  // Should be ignored

        $count = $this->pdo->query('SELECT COUNT(*) FROM game_completions')->fetchColumn();
        $this->assertSame(1, (int)$count);
    }

    // ─── Achievements ────────────────────────────────────────────────────────

    public function testInsertUserAchievement(): void
    {
        $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)')->execute(['user1', 'test']);

        $stmt = $this->pdo->prepare(
            'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
        );
        $result = $stmt->execute(['user1', 'first_win']);

        $this->assertTrue($result);

        $stmt = $this->pdo->prepare('SELECT * FROM user_achievements WHERE user_id = ?');
        $stmt->execute(['user1']);
        $ach = $stmt->fetch(\PDO::FETCH_ASSOC);

        $this->assertNotNull($ach);
        $this->assertSame('first_win', $ach['achievement_id']);
    }

    public function testGetAllAchievementsForUser(): void
    {
        $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)')->execute(['user1', 'test']);

        $stmt = $this->pdo->prepare(
            'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
        );
        $stmt->execute(['user1', 'first_win']);
        $stmt->execute(['user1', 'ten_wins']);
        $stmt->execute(['user1', 'speedrunner']);

        $stmt = $this->pdo->prepare('SELECT * FROM user_achievements WHERE user_id = ? ORDER BY unlocked_at DESC');
        $stmt->execute(['user1']);
        $achievements = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $this->assertCount(3, $achievements);
    }

    // ─── Game data (key-value store) ──────────────────────────────────────────

    public function testInsertGameData(): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO game_data (user_id, data_key, data_value) VALUES (?, ?, ?)'
        );
        $result = $stmt->execute(['user1', 'save', '{"level":5}']);

        $this->assertTrue($result);

        $stmt = $this->pdo->prepare('SELECT data_value FROM game_data WHERE user_id = ? AND data_key = ?');
        $stmt->execute(['user1', 'save']);
        $value = $stmt->fetchColumn();

        $this->assertSame('{"level":5}', $value);
    }

    public function testUpdateGameData(): void
    {
        $this->pdo->prepare(
            'INSERT INTO game_data (user_id, data_key, data_value) VALUES (?, ?, ?)'
        )->execute(['user1', 'save', '{"level":3}']);

        // Update the value
        $stmt = $this->pdo->prepare(
            'UPDATE game_data SET data_value = ? WHERE user_id = ? AND data_key = ?'
        );
        $stmt->execute(['{"level":10}', 'user1', 'save']);

        $stmt = $this->pdo->prepare('SELECT data_value FROM game_data WHERE user_id = ? AND data_key = ?');
        $stmt->execute(['user1', 'save']);
        $value = $stmt->fetchColumn();

        $this->assertSame('{"level":10}', $value);
    }

    public function testDeleteGameData(): void
    {
        $this->pdo->prepare(
            'INSERT INTO game_data (user_id, data_key, data_value) VALUES (?, ?, ?)'
        )->execute(['user1', 'save', '{"level":3}']);

        // Delete
        $stmt = $this->pdo->prepare('DELETE FROM game_data WHERE user_id = ? AND data_key = ?');
        $stmt->execute(['user1', 'save']);

        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM game_data WHERE user_id = ? AND data_key = ?');
        $stmt->execute(['user1', 'save']);
        $count = $stmt->fetchColumn();

        $this->assertSame(0, (int)$count);
    }

    // ─── Highscores ──────────────────────────────────────────────────────────

    public function testInsertHighscore(): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO highscores (user_id, mode, level_id, score, moves, elapsed_time)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $result = $stmt->execute(['user1', 'classic', 1, 9500, 10, 25.5]);

        $this->assertTrue($result);

        $stmt = $this->pdo->prepare('SELECT score FROM highscores WHERE user_id = ? AND mode = ? AND level_id = ?');
        $stmt->execute(['user1', 'classic', 1]);
        $score = $stmt->fetchColumn();

        $this->assertSame(9500, (int)$score);
    }

    public function testHighscoreUpsert(): void
    {
        // Insert initial
        $this->pdo->prepare(
            'INSERT INTO highscores (user_id, mode, level_id, score) VALUES (?, ?, ?, ?)'
        )->execute(['user1', 'classic', 1, 9500]);

        // Try to insert better score (should fail due to UNIQUE constraint)
        $stmt = $this->pdo->prepare(
            'INSERT OR REPLACE INTO highscores (user_id, mode, level_id, score) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(['user1', 'classic', 1, 9600]);

        // Verify new score
        $stmt = $this->pdo->prepare('SELECT score FROM highscores WHERE user_id = ? AND mode = ? AND level_id = ?');
        $stmt->execute(['user1', 'classic', 1]);
        $score = $stmt->fetchColumn();

        $this->assertSame(9600, (int)$score);
    }

    // ─── User stats ──────────────────────────────────────────────────────────

    public function testInsertUserStats(): void
    {
        $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)')->execute(['user1', 'test']);

        $stmt = $this->pdo->prepare(
            'INSERT INTO user_stats (user_id, max_combo, total_score) VALUES (?, ?, ?)'
        );
        $result = $stmt->execute(['user1', 42, 50000]);

        $this->assertTrue($result);

        $stmt = $this->pdo->prepare('SELECT max_combo, total_score FROM user_stats WHERE user_id = ?');
        $stmt->execute(['user1']);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        $this->assertSame(42, (int)$stats['max_combo']);
        $this->assertSame(50000, (int)$stats['total_score']);
    }

    // ─── Leaderboard cache ───────────────────────────────────────────────────

    public function testInsertLeaderboardEntry(): void
    {
        $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)')->execute(['user1', 'champ']);

        $stmt = $this->pdo->prepare(
            'INSERT INTO leaderboard_cache (mode, user_id, username, score, rank) VALUES (?, ?, ?, ?, ?)'
        );
        $result = $stmt->execute(['classic', 'user1', 'champ', 50000, 1]);

        $this->assertTrue($result);

        $stmt = $this->pdo->prepare('SELECT * FROM leaderboard_cache WHERE mode = ? ORDER BY rank');
        $stmt->execute(['classic']);
        $entry = $stmt->fetch(\PDO::FETCH_ASSOC);

        $this->assertSame('user1', $entry['user_id']);
        $this->assertSame(1, (int)$entry['rank']);
    }

    // ─── Replays ─────────────────────────────────────────────────────────────

    public function testInsertReplay(): void
    {
        $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)')->execute(['user1', 'test']);

        $moves = json_encode([['x' => 0, 'y' => 0, 'dir' => 'CW']]);
        $stmt = $this->pdo->prepare(
            'INSERT INTO replays (user_id, mode, level_id, moves_json, score) VALUES (?, ?, ?, ?, ?)'
        );
        $result = $stmt->execute(['user1', 'classic', 1, $moves, 9500]);

        $this->assertTrue($result);

        $stmt = $this->pdo->prepare('SELECT moves_json FROM replays WHERE user_id = ? AND mode = ? AND level_id = ?');
        $stmt->execute(['user1', 'classic', 1]);
        $storedMoves = $stmt->fetchColumn();

        $this->assertSame($moves, $storedMoves);
    }
}
