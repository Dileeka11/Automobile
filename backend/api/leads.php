<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM website_leads ORDER BY created_at DESC");
        sendJson($stmt->fetchAll());
        break;

    case 'POST':
        $data = getJsonInput();
        if (empty($data['name']) || empty($data['email'])) {
            sendError("Name and Email are required");
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO website_leads (name, email, phone, message, status) VALUES (?, ?, ?, ?, 'New')");
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? null,
                $data['message'] ?? null
            ]);
            sendJson([
                'id' => $pdo->lastInsertId(),
                'status' => 'success'
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Lead ID is required");
        }
        $data = getJsonInput();
        if (empty($data['status'])) {
            sendError("Status is required");
        }

        try {
            $stmt = $pdo->prepare("UPDATE website_leads SET status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $id]);
            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Lead ID is required");
        }
        $stmt = $pdo->prepare("DELETE FROM website_leads WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(["status" => "success"]);
        break;

    default:
        sendError("Method not allowed", 405);
}
