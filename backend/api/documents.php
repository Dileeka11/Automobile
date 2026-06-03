<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $vehicleId = $_GET['vehicle_id'] ?? null;
        if (!$vehicleId) {
            sendError("Vehicle ID is required");
        }
        $stmt = $pdo->prepare("SELECT * FROM documents WHERE vehicle_id = ? ORDER BY uploaded_at DESC");
        $stmt->execute([$vehicleId]);
        sendJson($stmt->fetchAll());
        break;

    case 'POST':
        // Handle file upload
        $vehicleId = $_POST['vehicle_id'] ?? null;
        $documentType = $_POST['document_type'] ?? null;

        if (!$vehicleId || !$documentType) {
            sendError("Vehicle ID and Document Type are required");
        }

        if (empty($_FILES['file'])) {
            sendError("No file uploaded");
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            sendError("File upload error code: " . $file['error']);
        }

        try {
            // Create uploads directory
            $dir = __DIR__ . '/../uploads/documents/';
            if (!file_exists($dir)) {
                mkdir($dir, 0777, true);
            }

            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $fileName = 'doc_' . $vehicleId . '_' . strtoupper(str_replace(' ', '_', $documentType)) . '_' . time() . '.' . $extension;
            $destination = $dir . $fileName;

            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $filePath = 'backend/uploads/documents/' . $fileName;

                $stmt = $pdo->prepare("INSERT INTO documents (vehicle_id, document_type, file_path) VALUES (?, ?, ?)");
                $stmt->execute([$vehicleId, $documentType, $filePath]);

                sendJson([
                    'id' => $pdo->lastInsertId(),
                    'vehicle_id' => $vehicleId,
                    'document_type' => $documentType,
                    'file_path' => $filePath,
                    'uploaded_at' => date('Y-m-d H:i:s')
                ]);
            } else {
                sendError("Failed to save uploaded file");
            }

        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Document ID is required");
        }

        try {
            // Get file path first
            $stmt = $pdo->prepare("SELECT file_path FROM documents WHERE id = ?");
            $stmt->execute([$id]);
            $filePath = $stmt->fetchColumn();

            if ($filePath) {
                $fullPath = __DIR__ . '/../' . str_replace('backend/', '', $filePath);
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }

            $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ?");
            $stmt->execute([$id]);

            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
