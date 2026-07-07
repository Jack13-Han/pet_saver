<?php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load .env
function loadEnv($path)
{
    if (!file_exists($path)) return false;

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $line = trim($line);

        if (empty($line) || strpos($line, ';') === 0) continue;
        if (strpos($line, '=') === false) continue;

        list($key, $value) = explode('=', $line, 2);

        $key = trim($key);
        $value = trim($value);

        if (
            (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
            (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)
        ) {
            $value = substr($value, 1, -1);
        }

        $_ENV[$key] = $value;
        putenv("$key=$value");
    }

    return true;
}

$envPath = __DIR__ . '/.env';

if (!file_exists($envPath)) {
    $envPath = __DIR__ . '/.env.example';
}

loadEnv($envPath);

define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'pet_saver');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'change_me_in_production');
define('GEMINI_API_KEY', $_ENV['GEMINI_API_KEY'] ?? '');

try {
    $dsn = "mysql:host=" . DB_HOST .
        ";port=" . DB_PORT .
        ";dbname=" . DB_NAME .
        ";charset=utf8mb4";

    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->exec("SET NAMES utf8mb4");

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Database connection failed: " . $e->getMessage()
    ]);

    exit();
}

if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', 'pet_saver_secret_key_change_me');
}

function generateJWT($userId, $username)
{
    $header = json_encode([
        'typ' => 'JWT',
        'alg' => 'HS256'
    ]);

    $time = time();

    $payload = json_encode([
        'iss' => 'pet_saver',
        'iat' => $time,
        'exp' => $time + 604800,
        'sub' => $userId,
        'username' => $username
    ]);

    $b64h = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $b64p = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $sig = hash_hmac('sha256', $b64h . "." . $b64p, JWT_SECRET, true);

    $b64s = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sig));

    return $b64h . "." . $b64p . "." . $b64s;
}

function verifyJWT($token)
{
    $parts = explode('.', $token);

    if (count($parts) !== 3) return false;

    $sig = hash_hmac(
        'sha256',
        $parts[0] . "." . $parts[1],
        JWT_SECRET,
        true
    );

    $b64s = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sig));

    if (!hash_equals($b64s, $parts[2])) return false;

    $payload = json_decode(
        base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])),
        true
    );

    if (!$payload || $payload['exp'] < time()) return false;

    return $payload;
}

function getAuthUser()
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];

    $auth = '';

    foreach (['Authorization', 'authorization'] as $headerName) {
        if (!empty($headers[$headerName])) {
            $auth = $headers[$headerName];
            break;
        }
    }

    if ($auth === '') {
        $auth = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';
    }

    if ($auth === '' && function_exists('apache_request_headers')) {
        $apacheHeaders = apache_request_headers();
        foreach (['Authorization', 'authorization'] as $headerName) {
            if (!empty($apacheHeaders[$headerName])) {
                $auth = $apacheHeaders[$headerName];
                break;
            }
        }
    }

    if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
        return verifyJWT($matches[1]);
    }

    return false;
}

function jsonResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function errorResponse($message, $code = 400)
{
    jsonResponse([
        'success' => false,
        'error' => $message
    ], $code);
}

function successResponse($data, $message = 'Success')
{
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}
