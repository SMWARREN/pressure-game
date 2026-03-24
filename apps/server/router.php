<?php
/**
 * Router for PHP Built-in Server
 * Routes all requests through api.php
 */

// Get the requested path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If it's a direct file request (exists as a real file), serve it
if ($requestPath !== '/' && file_exists(__DIR__ . $requestPath) && !is_dir(__DIR__ . $requestPath)) {
    return false; // Let PHP serve the file
}

// Otherwise, route everything to index.php
require_once __DIR__ . '/index.php';
