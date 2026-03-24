<?php

use PHPUnit\Framework\TestCase;

/**
 * Base test case for database tests.
 * Sets up a temporary SQLite database with the same schema as production.
 */
abstract class DatabaseTestCase extends TestCase
{
    protected \PDO $pdo;
    protected string $dbFile;

    protected function setUp(): void
    {
        // Create a temporary SQLite database
        $this->dbFile = tempnam(sys_get_temp_dir(), 'test_db_');
        unlink($this->dbFile);

        $this->pdo = new \PDO('sqlite:' . $this->dbFile);
        $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        // Create schema
        $this->createSchema();
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        if (file_exists($this->dbFile)) {
            unlink($this->dbFile);
        }
    }

    protected function createSchema(): void
    {
        $schema = file_get_contents(__DIR__ . '/../schema.sql');
        if ($schema) {
            // Split by semicolons and execute each statement
            $statements = array_filter(
                array_map('trim', explode(';', $schema)),
                fn($stmt) => !empty($stmt)
            );
            foreach ($statements as $stmt) {
                $this->pdo->exec($stmt);
            }
        }
    }

    /**
     * Insert test data and return the PDO connection for assertions
     */
    protected function insertTestUser(string $userId, string $username = null): array
    {
        $username = $username ?? 'test_user_' . substr($userId, 0, 5);
        $stmt = $this->pdo->prepare('INSERT INTO users (id, username) VALUES (?, ?)');
        $stmt->execute([$userId, $username]);

        $stmt = $this->pdo->prepare('SELECT id, username, created_at FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    protected function insertTestHighscore(
        string $userId,
        string $mode,
        int $levelId,
        int $score,
        int $moves = 10,
        float $time = 25.5
    ): bool {
        $stmt = $this->pdo->prepare(
            'INSERT INTO highscores (user_id, mode, level_id, score, moves, elapsed_time)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        return $stmt->execute([$userId, $mode, $levelId, $score, $moves, $time]);
    }

    protected function insertTestAchievement(string $userId, string $achievementId): bool
    {
        $stmt = $this->pdo->prepare(
            'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
        );
        return $stmt->execute([$userId, $achievementId]);
    }
}
