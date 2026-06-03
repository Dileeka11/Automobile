<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM make_models ORDER BY name ASC");
        sendJson($stmt->fetchAll());
        break;
        
    case 'POST':
        $data = getJsonInput();
        if (empty($data['name'])) {
            sendError("Make Model name is required");
        }
        $id = $data['id'] ?? ('MK' . strtoupper(substr(uniqid(), -5)));
        $stmt = $pdo->prepare("INSERT INTO make_models (id, name) VALUES (?, ?)");
        $stmt->execute([$id, $data['name']]);
        sendJson(["id" => $id, "name" => $data['name']]);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Make Model ID is required");
        }
        $data = getJsonInput();
        if (empty($data['name'])) {
            sendError("Make Model name is required");
        }
        $stmt = $pdo->prepare("UPDATE make_models SET name = ? WHERE id = ?");
        $stmt->execute([$data['name'], $id]);
        sendJson(["id" => $id, "name" => $data['name']]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Make Model ID is required");
        }
        $stmt = $pdo->prepare("DELETE FROM make_models WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(["status" => "success"]);
        break;

    default:
        sendError("Method not allowed", 405);
}
