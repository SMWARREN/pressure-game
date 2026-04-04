<?php

namespace Pressure;

/**
 * HTTP Response handler for controllers
 * Supports both real HTTP responses and test mode
 */
class Response
{
    private static ?self $instance = null;
    private int $statusCode = 200;
    private bool $testMode = false;
    private ?string $testOutput = null;

    /**
     * Private constructor for singleton pattern
     */
    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function setTestMode(bool $enabled): void
    {
        self::getInstance()->testMode = $enabled;
    }

    public static function getTestOutput(): ?string
    {
        return self::getInstance()->testOutput;
    }

    /**
     * Send a JSON response
     */
    public static function json(int $code, mixed $data): never
    {
        $instance = self::getInstance();
        $instance->statusCode = $code;
        $json = json_encode($data);

        if ($instance->testMode) {
            // In test mode, capture output instead of sending headers
            $instance->testOutput = $json;
        } else {
            // In production, send real HTTP response
            http_response_code($code);
            echo $json;
        }

        // Always throw to comply with 'never' return type
        throw new ResponseException($code);
    }

    public static function reset(): void
    {
        self::$instance = null;
        self::$instance = new self();  // Create fresh instance preserving test mode from next setTestMode call
    }
}
