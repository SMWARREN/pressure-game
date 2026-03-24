<?php
/**
 * Test bootstrap - loads .env.test and autoload
 */

// Let PHPUnit handle Xdebug coverage collection via --coverage-* options
// Do NOT call xdebug_start_code_coverage() here - PHPUnit will do it at the right time

require_once __DIR__ . '/autoload.php';

use Pressure\Config;

// Load test environment
Config::loadEnv(__DIR__ . '/.env.test');
