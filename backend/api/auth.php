<?php
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Only POST requests are allowed", 405);
}

$data = getJsonInput();
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($username) || empty($password)) {
    sendError("Username and password are required");
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        sendError("Incorrect username", 401);
    } else if (!password_verify($password, $user['password'])) {
        sendError("Incorrect password", 401);
    } else {
        // Successful login
        sendJson([
            "id" => (int)$user['id'],
            "username" => $user['username'],
            "name" => $user['name'],
            "role" => $user['role']
        ]);
    }
} catch (Exception $e) {
    sendError("Authentication error: " . $e->getMessage(), 500);
}
