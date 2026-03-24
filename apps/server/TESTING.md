# PHP Backend Testing Guide

## Current Coverage Status

- **Tests**: 164 passing, 306 assertions
- **Overall Coverage**: 54.29% (462/851 statements)
- **Target**: 90% (766/851 statements)
- **Gap**: 304 statements (~110 more tests needed)

### Coverage by Component

- **Config**: 100% ✓ (25/25 lines)
- **ScoreCalculator**: 100% ✓ (11/11 lines)
- **Database**: 89.07% (326/366 lines) - Near target!
- **Router**: 67.11% (100/149 lines)
- **Controllers**: ~45-55% (being tested through Router)

## Running Tests

```bash
# Run all tests
vendor/bin/phpunit

# Run specific test file
vendor/bin/phpunit tests/DatabaseTest.php

# Generate coverage report (HTML)
vendor/bin/phpunit --coverage-html=coverage

# Generate coverage report (text)
vendor/bin/phpunit --coverage-text
```

## Test Infrastructure

### Environment Variables (.env.test)
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=saintsea_pressure_test
```

Configuration is loaded via `test-bootstrap.php` and `Config::getDbConfig()`.

### InputStreamWrapper
Mocks `php://input` for testing POST request bodies. Usage:

```php
$payload = json_encode(['key' => 'value']);
InputStreamWrapper::register($payload);

// Your test code here
ob_start();
try {
    (new ControllerClass($db))->methodName();
} catch (\RuntimeException $e) {
    // Expected - jsonResponse() throws
} finally {
    InputStreamWrapper::unregister();
}

$output = ob_get_clean();
$response = json_decode((string) $output, true);
```

### BaseTestCase
Reusable test base class with database setup:

```php
class MyTest extends BaseTestCase {
    // Database automatically set up via $this->db
    // jsonResponse() function defined
}
```

## Path to 90% Coverage

To reach 90% coverage, prioritize:

### 1. Database Class (+40 statements to 100%)
Currently at 89.07%, very close. Add tests for:
- Remaining transaction scenarios
- Error conditions
- Edge cases in existing methods

### 2. Router Class (+49 statements)
Currently at 67.11%. Add tests for:
- POST routes that weren't covered
- Less common query parameter combinations
- Error paths

### 3. Controller Methods (+215+ statements)
Test all controller POST/DELETE methods thoroughly:
- HighscoreController.save() - all paths
- GameController.create() - all paths
- ProfileController.update() - all paths
- StatsController.update() - all validation paths
- DataController.set() - all paths
- UserController.create() - all paths

### 4. Additional Coverage
- Test exception handling paths
- Test database transaction failures
- Test malformed input handling
- Test boundary conditions

## Test File Structure

```
tests/
├── BaseTestCase.php              # Reusable base class
├── InputStreamWrapper.php        # php://input mock
├── DatabaseTest.php              # Database class (35 tests)
├── RouterTest.php                # Router dispatch (30 tests)
├── AchievementControllerTest.php # (14 tests)
├── DataControllerTest.php        # (14 tests)
├── GameControllerTest.php        # (7 tests)
├── HighscoreControllerTest.php   # (10 tests)
├── LeaderboardControllerTest.php # (7 tests)
├── ProfileControllerTest.php     # (13 tests)
├── StatsControllerTest.php       # (6 tests)
├── UserControllerTest.php        # (7 tests)
├── ConfigTest.php                # (8 tests)
└── ScoreCalculatorTest.php       # (13 tests)
```

## Adding New Tests

1. Extend `BaseTestCase` for database tests (automatic setup)
2. Use `InputStreamWrapper` for POST request bodies
3. Test all validation paths (missing params, wrong types, etc.)
4. Test success and error cases
5. Verify database state after operations
6. Use descriptive test names

Example:
```php
class MyControllerTest extends BaseTestCase {
    public function testUpdateSuccess(): void {
        $payload = json_encode(['field' => 'value']);
        InputStreamWrapper::register($payload);

        ob_start();
        try {
            (new MyController($this->db))->update('user1');
        } catch (\RuntimeException $e) {
            // Expected
        } finally {
            InputStreamWrapper::unregister();
        }
        $output = ob_get_clean();
        $response = json_decode((string) $output, true);

        $this->assertTrue($response['success']);
    }
}
```

## Notes

- All tests use real MySQL test database (saintsea_pressure_test)
- Foreign key constraints are disabled during setup for quick cleanup
- Each test is isolated - database is truncated before each test
- jsonResponse() throws RuntimeException to exit, tests catch this
- Coverage includes inline styles, no separate stylesheet test needed

## Future Improvements

1. Create test fixtures for common data setup
2. Add performance/load testing
3. Add integration tests with frontend
4. Add contract tests for API endpoints
5. Implement test data factories
