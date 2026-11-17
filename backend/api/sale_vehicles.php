<?php
require_once __DIR__ . '/../config/db.php';

// "Vehicles For Sale" listings shown on the public landing page.
// Each vehicle has one cover image plus up to MAX_GALLERY extra photos.
// Managed from the admin "Vehicles For Sale" page.

const UPLOAD_DIR = __DIR__ . '/../uploads/sale_vehicles/';
const PUBLIC_DIR = 'backend/uploads/sale_vehicles/';
const MAX_GALLERY = 5;
const STATUSES = ['available', 'reserved', 'sold'];

/** Tables are created on first use so a fresh deploy works without a manual step. */
function ensureTables($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS sale_vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        make VARCHAR(80) NULL,
        model VARCHAR(80) NULL,
        year SMALLINT NULL,
        mileage INT NULL,
        fuel_type VARCHAR(30) NULL,
        transmission VARCHAR(30) NULL,
        engine_cc INT NULL,
        color VARCHAR(40) NULL,
        vehicle_condition VARCHAR(30) NULL,
        price DECIMAL(14,2) NOT NULL DEFAULT 0,
        description TEXT NULL,
        cover_path VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS sale_vehicle_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vehicle (vehicle_id),
        CONSTRAINT fk_sale_vehicle_images FOREIGN KEY (vehicle_id)
            REFERENCES sale_vehicles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function deleteUploadedFile($path) {
    if (!$path) return;
    $abs = __DIR__ . '/../' . str_replace('backend/', '', $path);
    $real = realpath($abs);
    $allowed = realpath(__DIR__ . '/../uploads/');
    if ($real && $allowed && strpos($real, $allowed) === 0 && is_file($real)) {
        @unlink($real);
    }
}

/** Validate + store an uploaded picture, returning its public path. */
function storeUpload($file, $prefix) {
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
    $fileName = $prefix . '_' . time() . '_' . mt_rand(1000, 9999) . '.' . $extMap[$type[2]];
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $fileName)) {
        sendError("Failed to save uploaded image");
    }
    return PUBLIC_DIR . $fileName;
}

function hasUpload($key) {
    return !empty($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK;
}

function nullableInt($v) {
    $v = trim((string)$v);
    return $v === '' ? null : (int)$v;
}

function nullableStr($v, $max) {
    $v = trim((string)$v);
    return $v === '' ? null : mb_substr($v, 0, $max);
}

function mapVehicle($row, $images) {
    return [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'make' => $row['make'],
        'model' => $row['model'],
        'year' => $row['year'] !== null ? (int)$row['year'] : null,
        'mileage' => $row['mileage'] !== null ? (int)$row['mileage'] : null,
        'fuelType' => $row['fuel_type'],
        'transmission' => $row['transmission'],
        'engineCc' => $row['engine_cc'] !== null ? (int)$row['engine_cc'] : null,
        'color' => $row['color'],
        'condition' => $row['vehicle_condition'],
        'price' => (float)$row['price'],
        'description' => $row['description'],
        'coverPath' => $row['cover_path'],
        'status' => $row['status'],
        'sortOrder' => (int)$row['sort_order'],
        'createdAt' => $row['created_at'] ?? null,
        'images' => array_map(fn($i) => [
            'id' => (int)$i['id'],
            'filePath' => $i['file_path'],
        ], $images),
    ];
}

function loadVehicle($pdo, $id) {
    $stmt = $pdo->prepare("SELECT * FROM sale_vehicles WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $img = $pdo->prepare("SELECT id, file_path FROM sale_vehicle_images WHERE vehicle_id = ? ORDER BY sort_order ASC, id ASC");
    $img->execute([$id]);
    return mapVehicle($row, $img->fetchAll());
}

try {
    ensureTables($pdo);
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $rows = $pdo->query("SELECT * FROM sale_vehicles ORDER BY sort_order DESC, id DESC")->fetchAll();
            $imgs = $pdo->query("SELECT id, vehicle_id, file_path FROM sale_vehicle_images ORDER BY sort_order ASC, id ASC")->fetchAll();
            $byVehicle = [];
            foreach ($imgs as $i) {
                $byVehicle[(int)$i['vehicle_id']][] = $i;
            }
            sendJson(array_map(fn($r) => mapVehicle($r, $byVehicle[(int)$r['id']] ?? []), $rows));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        // Multipart bodies only arrive on POST, so the action decides what happens.
        $action = $_POST['action'] ?? 'save';

        if ($action === 'add_image') {
            $vehicleId = (int)($_POST['vehicle_id'] ?? 0);
            if (!$vehicleId) sendError("Vehicle ID is required");
            if (!hasUpload('file')) sendError("An image file is required");

            try {
                $exists = $pdo->prepare("SELECT id FROM sale_vehicles WHERE id = ?");
                $exists->execute([$vehicleId]);
                if (!$exists->fetchColumn()) sendError("Vehicle not found", 404);

                $count = $pdo->prepare("SELECT COUNT(*) FROM sale_vehicle_images WHERE vehicle_id = ?");
                $count->execute([$vehicleId]);
                if ((int)$count->fetchColumn() >= MAX_GALLERY) {
                    sendError("A vehicle can have at most " . MAX_GALLERY . " extra photos");
                }

                $filePath = storeUpload($_FILES['file'], 'sale_' . $vehicleId . '_img');
                $next = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM sale_vehicle_images WHERE vehicle_id = ?");
                $next->execute([$vehicleId]);
                $ins = $pdo->prepare("INSERT INTO sale_vehicle_images (vehicle_id, file_path, sort_order) VALUES (?, ?, ?)");
                $ins->execute([$vehicleId, $filePath, (int)$next->fetchColumn()]);

                sendJson(loadVehicle($pdo, $vehicleId), 201);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        }

        // Create / update a vehicle
        $id = nullableInt($_POST['id'] ?? '');
        $title = trim($_POST['title'] ?? '');
        $price = (float)($_POST['price'] ?? 0);
        $status = $_POST['status'] ?? 'available';

        if ($title === '') sendError("Vehicle title is required");
        if ($price <= 0) sendError("Price must be greater than zero");
        if (!in_array($status, STATUSES, true)) $status = 'available';

        $fields = [
            'title' => mb_substr($title, 0, 150),
            'make' => nullableStr($_POST['make'] ?? '', 80),
            'model' => nullableStr($_POST['model'] ?? '', 80),
            'year' => nullableInt($_POST['year'] ?? ''),
            'mileage' => nullableInt($_POST['mileage'] ?? ''),
            'fuel_type' => nullableStr($_POST['fuel_type'] ?? '', 30),
            'transmission' => nullableStr($_POST['transmission'] ?? '', 30),
            'engine_cc' => nullableInt($_POST['engine_cc'] ?? ''),
            'color' => nullableStr($_POST['color'] ?? '', 40),
            'vehicle_condition' => nullableStr($_POST['condition'] ?? '', 30),
            'price' => $price,
            'description' => nullableStr($_POST['description'] ?? '', 5000),
            'status' => $status,
        ];

        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT cover_path FROM sale_vehicles WHERE id = ?");
                $stmt->execute([$id]);
                $oldCover = $stmt->fetchColumn();
                if ($oldCover === false) sendError("Vehicle not found", 404);

                $fields['cover_path'] = $oldCover;
                if (hasUpload('cover')) {
                    $fields['cover_path'] = storeUpload($_FILES['cover'], 'sale_cover');
                }

                $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
                $up = $pdo->prepare("UPDATE sale_vehicles SET $set WHERE id = ?");
                $up->execute([...array_values($fields), $id]);

                if ($fields['cover_path'] !== $oldCover) deleteUploadedFile($oldCover);
                sendJson(loadVehicle($pdo, $id));
            }

            if (!hasUpload('cover')) sendError("A main image is required");
            $fields['cover_path'] = storeUpload($_FILES['cover'], 'sale_cover');
            $fields['sort_order'] = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM sale_vehicles")->fetchColumn();

            $cols = implode(', ', array_keys($fields));
            $marks = implode(', ', array_fill(0, count($fields), '?'));
            $ins = $pdo->prepare("INSERT INTO sale_vehicles ($cols) VALUES ($marks)");
            $ins->execute(array_values($fields));

            sendJson(loadVehicle($pdo, (int)$pdo->lastInsertId()), 201);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        try {
            // Remove a single gallery photo
            $imageId = (int)($_GET['image_id'] ?? 0);
            if ($imageId) {
                $stmt = $pdo->prepare("SELECT vehicle_id, file_path FROM sale_vehicle_images WHERE id = ?");
                $stmt->execute([$imageId]);
                $img = $stmt->fetch();
                if (!$img) sendError("Image not found", 404);

                $pdo->prepare("DELETE FROM sale_vehicle_images WHERE id = ?")->execute([$imageId]);
                deleteUploadedFile($img['file_path']);
                sendJson(loadVehicle($pdo, (int)$img['vehicle_id']));
            }

            // Remove a whole vehicle with all of its photos
            $id = (int)($_GET['id'] ?? 0);
            if (!$id) sendError("Vehicle ID is required");

            $stmt = $pdo->prepare("SELECT cover_path FROM sale_vehicles WHERE id = ?");
            $stmt->execute([$id]);
            $cover = $stmt->fetchColumn();
            $imgs = $pdo->prepare("SELECT file_path FROM sale_vehicle_images WHERE vehicle_id = ?");
            $imgs->execute([$id]);
            $paths = $imgs->fetchAll(PDO::FETCH_COLUMN);

            $pdo->prepare("DELETE FROM sale_vehicle_images WHERE vehicle_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM sale_vehicles WHERE id = ?")->execute([$id]);

            deleteUploadedFile($cover ?: null);
            foreach ($paths as $p) deleteUploadedFile($p);

            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
