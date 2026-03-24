<?php

/**
 * DIY Stream wrapper to mock php://input for unit tests.
 * Allows file_get_contents('php://input') to read test data.
 */
class InputStreamWrapper
{
    private static string $data = '';
    private static int $position = 0;
    private static ?InputStreamWrapper $instance = null;
    public $context;

    public static function register(string $data): void
    {
        self::$data = $data;
        self::$position = 0;
        self::$instance = new self();

        stream_wrapper_unregister('php');
        stream_wrapper_register('php', self::class, STREAM_IS_URL);
    }

    public static function unregister(): void
    {
        if (in_array('php', stream_get_wrappers())) {
            stream_wrapper_unregister('php');
            stream_wrapper_restore('php');
        }
        self::$instance = null;
    }

    public function stream_open($path, $mode, $options, &$opened_path)
    {
        return true;
    }

    public function stream_read($count)
    {
        $result = substr(self::$data, self::$position, $count);
        self::$position += strlen($result);
        return $result;
    }

    public function stream_write($data)
    {
        self::$data .= $data;
        self::$position += strlen($data);
        return strlen($data);
    }

    public function stream_eof()
    {
        return self::$position >= strlen(self::$data);
    }

    public function stream_seek($offset, $whence = SEEK_SET)
    {
        switch ($whence) {
            case SEEK_SET:
                self::$position = $offset;
                break;
            case SEEK_CUR:
                self::$position += $offset;
                break;
            case SEEK_END:
                self::$position = strlen(self::$data) + $offset;
                break;
        }
        return true;
    }

    public function stream_tell()
    {
        return self::$position;
    }

    public function stream_stat()
    {
        return [];
    }
}
