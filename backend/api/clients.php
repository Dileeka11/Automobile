<?php
require_once __DIR__ . '/../config/db.php';

// "Our Clients" cards shown on the public landing page.
// Managed from the admin "Website Customize" page.

const UPLOAD_DIR = __DIR__ . '/../uploads/clients/';
const PUBLIC_DIR = 'backend/uploads/clients/';

function mapClient($row) {
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'city' => $row['city'],
        'filePath' => $row['file_path'],
        'sortOrder' => (int)$row['sort_order'],
    ];
}

function deleteClientFile($path) {
    if (!$path) return;
    $abs = __DIR__ . '/../' . str_replace('backend/', '', $path);
    $real = realpath($abs);
    $allowed = realpath(__DIR__ . '/../uploads/');
    if ($real && $allowed && strpos($real, $allowed) === 0 && is_file($real)) {
        @unlink($real);
    }
}

/** Validate + store an uploaded picture, returning its public path. */
function storeUpload($file) {
    $type = @getimagesize($file['tmp_name']);
    if (!$type || !in_array($type[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
        sendError("Only JPG, PNG or WEBP images are allowed");
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        sendError("Image must be 5MB or smaller");
    }
    if (!file_exists(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0777, true);
    }
    $extMap = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    $fileName = 'client_' . time() . '_' . mt_rand(1000, 9999) . '.' . $extMap[$type[2]];
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $fileName)) {
        sendError("Failed to save uploaded image");
    }
    return PUBLIC_DIR . $fileName;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $rows = $pdo->query("SELECT id, name, city, file_path, sort_order FROM site_clients ORDER BY sort_order ASC, id ASC")->fetchAll();
            sendJson(array_map('mapClient', $rows));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        // One endpoint for create and update — multipart bodies only arrive on POST.
        $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
        $name = trim($_POST['name'] ?? '');
        $city = trim($_POST['city'] ?? '');

        if ($name === '') {
            sendError("Client name is required");
        }

        $hasFile = !empty($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK;

        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT id, name, city, file_path, sort_order FROM site_clients WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch();
                if (!$existing) {
                    sendError("Client not found", 404);
                }

                $filePath = $existing['file_path'];
                if ($hasFile) {
                    $filePath = storeUpload($_FILES['file']);
                    deleteClientFile($existing['file_path']);
                }

                $up = $pdo->prepare("UPDATE site_clients SET name = ?, city = ?, file_path = ? WHERE id = ?");
                $up->execute([$name, $city, $filePath, $id]);

                sendJson(mapClient([
                    'id' => $id,
                    'name' => $name,
                    'city' => $city,
                    'file_path' => $filePath,
                    'sort_order' => $existing['sort_order'],
                ]));
            }

            if (!$hasFile) {
                sendError("A picture is required");
            }
            $filePath = storeUpload($_FILES['file']);

            $nextOrder = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM site_clients")->fetchColumn();
            $ins = $pdo->prepare("INSERT INTO site_clients (name, city, file_path, sort_order) VALUES (?, ?, ?, ?)");
            $ins->execute([$name, $city, $filePath, $nextOrder]);

            sendJson(mapClient([
                'id' => $pdo->lastInsertId(),
                'name' => $name,
                'city' => $city,
                'file_path' => $filePath,
                'sort_order' => $nextOrder,
            ]), 201);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendError("Client ID is required");
        }
        try {
            $stmt = $pdo->prepare("SELECT file_path FROM site_clients WHERE id = ?");
            $stmt->execute([$id]);
            $path = $stmt->fetchColumn();

            $del = $pdo->prepare("DELETE FROM site_clients WHERE id = ?");
            $del->execute([$id]);
            deleteClientFile($path);

            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
