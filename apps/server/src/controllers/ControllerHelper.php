<?php

namespace Pressure\Controllers;

/**
 * Helper trait for controllers to guard against prepare failures
 */
trait ControllerHelper
{
    /**
     * Guard against prepare failures - returns statement or calls jsonResponse with error
     */
    protected function guardPrepare(\mysqli_stmt|false $stmt): \mysqli_stmt|false
    {
        if ($stmt === false) {
            jsonResponse(500, ['error' => 'Prepare failed: ' . $this->db->conn->error]);
        }
        return $stmt;
    }
}
