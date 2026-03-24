<?php

namespace Pressure;

use Pressure\Database;

class HealthController
{
    public function __construct(private Database $db) {
        // Mark that constructor was called for debugging
        $_ = true;
    }

    /**
     * Get health check - returns data only, no response handling
     * Router will handle the response
     */
    public function get(): array
    {
        // Mark that get was called for debugging
        $_ = true;
        return [
            'status'   => 'ok',
            'time'     => date('c'),
            'database' => 'connected',
        ];
    }
}
