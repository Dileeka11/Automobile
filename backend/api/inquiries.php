<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $data = getJsonInput();
        if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
            sendError("Required fields missing");
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO inquiries (name, email, phone, message) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? '',
                $data['message']
            ]);
            sendJson(['status' => 'success', 'id' => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;
        
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM inquiries ORDER BY created_at DESC");
        sendJson($stmt->fetchAll());
        break;

    default:
        sendError("Method not allowed", 405);
}
