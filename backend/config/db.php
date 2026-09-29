<?php
// Global CORS headers
header("Access-Control-Allow-Origin: http://automobile.sourcecode.lk");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$host = 'localhost';
$db = 'automobile';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Global utility helper functions
function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $statusCode = 400) {
    sendJson(["error" => $message], $statusCode);
}

// Company-LC pricing columns (selling price + VAT). Added on demand so a deploy
// without running the migration script still works.
function ensureInvoicePricingColumns($pdo) {
    $cols = ['selling_price' => 'DECIMAL(15,2) NULL', 'vat_percent' => 'DECIMAL(5,2) NULL'];
    foreach ($cols as $col => $def) {
        if (!$pdo->query("SHOW COLUMNS FROM invoices LIKE '$col'")->fetch()) {
            $pdo->exec("ALTER TABLE invoices ADD COLUMN $col $def");
        }
    }
}
