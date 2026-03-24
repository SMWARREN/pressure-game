<?php
/**
 * Test bootstrap - loads .env.test and autoload
 */

// Start Xdebug coverage collection immediately, before ANY code is loaded
if (extension_loaded('xdebug') && function_exists('xdebug_start_code_coverage')) {
    xdebug_start_code_coverage();
}

require_once __DIR__ . '/autoload.php';

use Pressure\Config;

// Load test environment
Config::loadEnv(__DIR__ . '/.env.test');
