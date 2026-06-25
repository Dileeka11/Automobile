<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT id, username, name, role, created_at AS createdAt FROM users ORDER BY id DESC");
            $users = $stmt->fetchAll();
            sendJson($users);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        $name = trim($data['name'] ?? '');
        $role = trim($data['role'] ?? 'sales');

        if (empty($username) || empty($password) || empty($name)) {
            sendError("Username, password, and name are required");
        }

        try {
            // Check for duplicate username
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                sendError("Username is already taken");
            }

            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$username, $hashed, $name, $role]);

            $id = $pdo->lastInsertId();
            sendJson([
                "id" => (int)$id,
                "username" => $username,
                "name" => $name,
                "role" => $role,
                "createdAt" => date('Y-m-d H:i:s')
            ], 201);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("User ID is required");
        }

        $data = getJsonInput();
        $username = trim($data['username'] ?? '');
        $name = trim($data['name'] ?? '');
        $role = trim($data['role'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($name) || empty($role) || empty($username)) {
            sendError("Username, name, and role are required");
        }

        try {
            // Check if user is system admin 'admin' - do not allow changing their username
            $stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $currentUsername = $stmt->fetchColumn();

            if ($currentUsername === 'admin' && $username !== 'admin') {
                sendError("Cannot change system administrator username", 403);
            }

            // Check if username is already taken by another user
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$username, $id]);
            if ($stmt->fetchColumn() > 0) {
                sendError("Username is already taken");
            }

            $fields = ["username = ?", "name = ?", "role = ?"];
            $params = [$username, $name, $role];

            if (!empty($password)) {
                $fields[] = "password = ?";
                $params[] = password_hash($password, PASSWORD_DEFAULT);
            }

            $params[] = $id;
            $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Fetch and return the updated user
            $stmt = $pdo->prepare("SELECT id, username, name, role, created_at AS createdAt FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $updatedUser = $stmt->fetch();

            if ($updatedUser) {
                sendJson($updatedUser);
            } else {
                sendError("User not found", 404);
            }
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("User ID is required");
        }

        try {
            // Verify if target is default admin to prevent lockouts
            $stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $username = $stmt->fetchColumn();

            if ($username === 'admin') {
                sendError("Cannot delete system administrator account", 403);
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(["success" => true]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
        break;
}
