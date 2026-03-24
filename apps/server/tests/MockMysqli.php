<?php

/**
 * Mock mysqli for testing without a live database.
 * Provides a realistic interface for prepare(), bind_param(), execute(), etc.
 */
class MockMysqli
{
    public string $error = '';
    private array $statements = [];
    private int $insertId = 0;

    public function prepare(string $sql): MockMysqliStmt|false
    {
        return new MockMysqliStmt($sql, $this);
    }

    public function query(string $sql): MockMysqliResult|false
    {
        // For SELECT queries
        if (stripos($sql, 'SELECT') === 0) {
            return new MockMysqliResult([]);
        }
        // For INSERT/UPDATE/DELETE, return true
        return true;
    }

    public function setInsertId(int $id): void
    {
        $this->insertId = $id;
    }

    public function set_charset(string $charset): bool
    {
        return true;
    }
}

/**
 * Mock prepared statement
 */
class MockMysqliStmt
{
    private string $sql;
    private MockMysqli $mysqli;
    private array $params = [];
    private string $types = '';
    private MockMysqliResult $result;

    public function __construct(string $sql, MockMysqli $mysqli)
    {
        $this->sql = $sql;
        $this->mysqli = $mysqli;
        $this->result = new MockMysqliResult([]);
    }

    public function bind_param(string $types, mixed &...$params): bool
    {
        $this->types = $types;
        $this->params = $params;
        return true;
    }

    public function execute(): bool
    {
        // Success by default
        return true;
    }

    public function get_result(): MockMysqliResult
    {
        // Return configured result
        return $this->result;
    }

    public function setMockResult(array $rows): void
    {
        $this->result = new MockMysqliResult($rows);
    }

    public function close(): bool
    {
        return true;
    }

    public function fetch_assoc(): array|null
    {
        return $this->result->fetch_assoc();
    }

    public function fetch_all(int $mode = MYSQLI_ASSOC): array
    {
        return $this->result->fetch_all($mode);
    }
}

/**
 * Mock result set
 */
class MockMysqliResult
{
    private array $rows = [];
    private int $position = 0;
    public int $num_rows = 0;

    public function __construct(array $rows = [])
    {
        $this->rows = $rows;
        $this->num_rows = count($rows);
        $this->position = 0;
    }

    public function fetch_assoc(): array|null
    {
        if ($this->position >= count($this->rows)) {
            return null;
        }
        return $this->rows[$this->position++];
    }

    public function fetch_all(int $mode = MYSQLI_ASSOC): array
    {
        return $this->rows;
    }

    public function free_result(): void
    {
        // No-op
    }
}
