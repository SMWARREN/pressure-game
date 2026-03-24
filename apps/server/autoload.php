<?php
/**
 * Autoloader for the Pressure namespace.
 *
 * Maps:
 *   Pressure\Foo                 → src/Foo.php
 *   Pressure\Controllers\Foo     → src/controllers/Foo.php
 */
spl_autoload_register(function (string $class): void {
    $prefix = 'Pressure\\';
    $baseDir = __DIR__ . '/src/';

    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }

    $relative = substr($class, strlen($prefix));

    // Controllers sub-namespace → src/controllers/
    if (strncmp('Controllers\\', $relative, 12) === 0) {
        $className = substr($relative, 12);
        $file = $baseDir . 'controllers/' . $className . '.php';
    } else {
        $file = $baseDir . str_replace('\\', '/', $relative) . '.php';
    }

    if (file_exists($file)) {
        require_once $file;
    }
});
