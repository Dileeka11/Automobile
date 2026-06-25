<?php
require_once __DIR__ . '/../config/db.php';

// Custom (user-defined) clearing document types per invoice.
// Each row is one named document with an uploaded file.

$method = $_SERVER['REQUEST_METHOD'];

// Map a DB row to the shape the frontend expects.
function mapInvoiceDoc($row) {
    return [
        'id' => (int)$row['id'],
        'docType' => $row['doc_type'],
        'filePath' => $row['file_path'],
    ];
}

switch ($method) {
    case 'GET':
        $invoiceId = $_GET['invoice_id'] ?? null;
        if (!$invoiceId) {
            sendError("Invoice ID is required");
        }
        $stmt = $pdo->prepare("SELECT id, doc_type, file_path FROM invoice_documents WHERE invoice_id = ? ORDER BY created_at ASC");
        $stmt->execute([$invoiceId]);
        sendJson(array_map('mapInvoiceDoc', $stmt->fetchAll()));
        break;

    case 'POST':
        // Add a new document type + file in one step.
        $invoiceId = $_POST['invoice_id'] ?? null;
        $docType = trim($_POST['doc_type'] ?? '');

        if (!$invoiceId || $docType === '') {
            sendError("Invoice ID and document type name are required");
        }
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            sendError("A file is required");
        }

        try {
            $dir = __DIR__ . '/../uploads/documents/';
            if (!file_exists($dir)) mkdir($dir, 0777, true);

            $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
            $safeType = preg_replace('/[^A-Za-z0-9]+/', '_', $docType);
            $fileName = 'custom_' . $invoiceId . '_' . $safeType . '_' . time() . '.' . $ext;

            if (!move_uploaded_file($_FILES['file']['tmp_name'], $dir . $fileName)) {
                sendError("Failed to save uploaded file");
            }

            $filePath = 'backend/uploads/documents/' . $fileName;
            $stmt = $pdo->prepare("INSERT INTO invoice_documents (invoice_id, doc_type, file_path) VALUES (?, ?, ?)");
            $stmt->execute([$invoiceId, $docType, $filePath]);

            sendJson(mapInvoiceDoc([
                'id' => $pdo->lastInsertId(),
                'doc_type' => $docType,
                'file_path' => $filePath,
            ]));
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
            $sel = $pdo->prepare("SELECT file_path FROM invoice_documents WHERE id = ?");
            $sel->execute([$id]);
            $filePath = $sel->fetchColumn();
            if ($filePath) {
                $full = __DIR__ . '/../' . str_replace('backend/', '', $filePath);
                if (file_exists($full)) unlink($full);
            }
            $pdo->prepare("DELETE FROM invoice_documents WHERE id = ?")->execute([$id]);
            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
