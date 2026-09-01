<?php
require_once __DIR__ . '/../config/db.php';

// Hero carousel images for the public landing page.
// The carousel has three fixed positions, so each row is one slot (1, 2, 3).

const HERO_SLOTS = [1, 2, 3];
const UPLOAD_DIR = __DIR__ . '/../uploads/website/';
const PUBLIC_DIR = 'backend/uploads/website/';

function mapSlide($row) {
    return [
        'slot' => (int)$row['slot'],
        'filePath' => $row['file_path'],
        'altText' => $row['alt_text'],
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

/** Remove the file currently stored for a slot, if any. */
function deleteSlotFile($pdo, $slot) {
    $stmt = $pdo->prepare("SELECT file_path FROM hero_slides WHERE slot = ?");
    $stmt->execute([$slot]);
    $old = $stmt->fetchColumn();
    if (!$old) return;
    $abs = __DIR__ . '/../' . str_replace('backend/', '', $old);
    $real = realpath($abs);
    $allowed = realpath(__DIR__ . '/../uploads/');
    if ($real && $allowed && strpos($real, $allowed) === 0 && is_file($real)) {
        @unlink($real);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $rows = $pdo->query("SELECT slot, file_path, alt_text, updated_at FROM hero_slides ORDER BY slot ASC")->fetchAll();
            sendJson(array_map('mapSlide', $rows));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $slot = (int)($_POST['slot'] ?? 0);
        $altText = trim($_POST['alt_text'] ?? '');

        if (!in_array($slot, HERO_SLOTS, true)) {
            sendError("Slot must be 1, 2 or 3");
        }
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            sendError("An image file is required");
        }

        $type = @getimagesize($_FILES['file']['tmp_name']);
        if (!$type || !in_array($type[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            sendError("Only JPG, PNG or WEBP images are allowed");
        }
        if ($_FILES['file']['size'] > 5 * 1024 * 1024) {
            sendError("Image must be 5MB or smaller");
        }

        try {
            if (!file_exists(UPLOAD_DIR)) {
                mkdir(UPLOAD_DIR, 0777, true);
            }

            $extMap = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
            $fileName = 'hero_' . $slot . '_' . time() . '.' . $extMap[$type[2]];

            if (!move_uploaded_file($_FILES['file']['tmp_name'], UPLOAD_DIR . $fileName)) {
                sendError("Failed to save uploaded image");
            }

            // Drop the previous image so old uploads do not pile up
            deleteSlotFile($pdo, $slot);

            $filePath = PUBLIC_DIR . $fileName;
            $stmt = $pdo->prepare("INSERT INTO hero_slides (slot, file_path, alt_text) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), alt_text = VALUES(alt_text)");
            $stmt->execute([$slot, $filePath, $altText]);

            sendJson(mapSlide([
                'slot' => $slot,
                'file_path' => $filePath,
                'alt_text' => $altText,
                'updated_at' => date('Y-m-d H:i:s'),
            ]));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $slot = (int)($_GET['slot'] ?? 0);
        if (!in_array($slot, HERO_SLOTS, true)) {
            sendError("Slot must be 1, 2 or 3");
        }
        try {
            deleteSlotFile($pdo, $slot);
            $stmt = $pdo->prepare("DELETE FROM hero_slides WHERE slot = ?");
            $stmt->execute([$slot]);
            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
