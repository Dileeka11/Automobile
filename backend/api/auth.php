<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET: Verify existing session/user
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $username = trim($_GET['username'] ?? '');

    if ($id <= 0 || empty($username)) {
        sendError("Authentication required", 401);
    }

    try {
        $stmt = $pdo->prepare("SELECT id, username, name, role FROM users WHERE id = ? AND username = ?");
        $stmt->execute([$id, $username]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError("Invalid session. User not found.", 401);
        }

        sendJson([
            "id" => (int)$user['id'],
            "username" => $user['username'],
            "name" => $user['name'],
            "role" => $user['role']
        ]);
    } catch (Exception $e) {
        sendError("Authentication error: " . $e->getMessage(), 500);
    }
}

// POST: Login with username and password
if ($method === 'POST') {
    $data = getJsonInput();
    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');

    if (empty($username) || empty($password)) {
        sendError("Username and password are required", 400);
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
}

sendError("Only GET and POST requests are allowed", 405);

