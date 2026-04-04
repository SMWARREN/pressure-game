<?php

namespace Pressure;

/**
 * Exception thrown by Response::json() to signal request completion
 * Used to exit the request cycle with a specific HTTP status code
 */
class ResponseException extends \Exception
{
    public function __construct(private int $statusCode)
    {
        parent::__construct("exit:" . $statusCode);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
