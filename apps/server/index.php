<?php
/**
 * Pressure Game API — bootstrap entry point.
 *
 * Replaces router.php → api.php. Responsibilities:
 *   1. Set CORS headers
 *   2. Handle OPTIONS preflight
 *   3. Load environment via Config::loadEnv()
 *   4. Initialise Database
 *   5. Dispatch to Router
 */

require_once __DIR__ . '/autoload.php';

use Pressure\Config;
use Pressure\Database;
use Pressure\Router;

// ─── CORS ────────────────────────────────────────────────────────────────────

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── Shared JSON helper (global, available to all controllers) ────────────────

if (!function_exists('jsonResponse')) {
    /**
     * Emit a JSON response and terminate.
     *
     * @param int   $code HTTP status code
     * @param mixed $data Any JSON-serialisable value
     */
    function jsonResponse(int $code, mixed $data): never
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}

// ─── Environment & Database ───────────────────────────────────────────────────

Config::loadEnv(__DIR__ . '/.env');
$cfg = Config::getDbConfig();

$db = new Database($cfg['host'], $cfg['port'], $cfg['user'], $cfg['pass'], $cfg['name']);

// ─── Request parsing ─────────────────────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$pathParts = array_values(array_filter(explode('/', trim((string) $path, '/'))));

// Find the 'api' or 'api.php' segment and take everything after it.
$apiIndex = array_search('api', $pathParts);
if ($apiIndex === false) {
    $apiIndex = array_search('api.php', $pathParts);
}

if ($apiIndex === false) {
    // Direct root hit — return health response
    jsonResponse(200, [
        'status'   => 'ok',
        'time'     => date('c'),
        'database' => 'connected',
    ]);
}

$routeParts = array_slice($pathParts, (int) $apiIndex + 1);

// ─── Dispatch ─────────────────────────────────────────────────────────────────

try {
    Router::dispatch($method, $routeParts, $db);
} catch (\Exception $e) {
    jsonResponse(500, ['error' => $e->getMessage()]);
}
