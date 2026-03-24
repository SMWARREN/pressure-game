<?php
/**
 * Test bootstrap - loads .env.test and autoload
 */
require_once __DIR__ . '/autoload.php';

use Pressure\Config;

// Load test environment
Config::loadEnv(__DIR__ . '/.env.test');
