<?php

namespace Pressure\Controllers;

use Pressure\Database;
use Pressure\Response;

class HealthController
{
    public function __construct(private Database $db) {}

    public function get(): void
    {
        // Do work first so it can be tracked by coverage tools
        $data = [
            'status'   => 'ok',
            'time'     => date('c'),
            'database' => 'connected',
        ];

        // Then respond (this calls exit internally but we declare void)
        Response::json(200, $data);
    }
}
