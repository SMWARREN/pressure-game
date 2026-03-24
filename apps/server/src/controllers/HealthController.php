<?php

namespace Pressure\Controllers;

use Pressure\Database;

class HealthController
{
    public function __construct(private Database $db) {}

    public function get(): never
    {
        jsonResponse(200, [
            'status'   => 'ok',
            'time'     => date('c'),
            'database' => 'connected',
        ]);
    }
}
