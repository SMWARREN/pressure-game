<?php

namespace Pressure;

class HealthController
{
    /**
     * Constructor for health check controller
     */
    public function __construct() {
    }

    /**
     * Get health check - returns data only, no response handling
     * Router will handle the response
     */
    public function get(): array
    {
        return [
            'status'   => 'ok',
            'time'     => date('c'),
            'database' => 'connected',
        ];
    }
}
