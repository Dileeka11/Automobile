<?php
require_once __DIR__ . '/../config/db.php';

// Extra cashbook expense categories added by the user.
// The built-in categories live in the frontend and are never stored here.

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $rows = $pdo->query("SELECT id, name FROM expense_categories ORDER BY name ASC")->fetchAll();
            sendJson(array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name']], $rows));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');

        if ($name === '') {
            sendError("Category name is required");
        }
        if (mb_strlen($name) > 100) {
            sendError("Category name must be 100 characters or fewer");
        }

        try {
            $exists = $pdo->prepare("SELECT id, name FROM expense_categories WHERE name = ?");
            $exists->execute([$name]);
            if ($row = $exists->fetch()) {
                // Already there — hand back the existing one instead of erroring
                sendJson(['id' => (int)$row['id'], 'name' => $row['name']]);
            }

            $stmt = $pdo->prepare("INSERT INTO expense_categories (name) VALUES (?)");
            $stmt->execute([$name]);
            sendJson(['id' => (int)$pdo->lastInsertId(), 'name' => $name], 201);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendError("Category ID is required");
        }
        try {
            // Existing expense records keep their text, only the option disappears
            $stmt = $pdo->prepare("DELETE FROM expense_categories WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
