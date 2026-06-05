<?php
require_once __DIR__ . '/../config/db.php';

$path = $_GET['path'] ?? '';
if (empty($path)) {
    http_response_code(400);
    echo json_encode(["error" => "Path is required"]);
    exit();
}

// Security: Resolve realpaths to prevent directory traversal
$baseDir = __DIR__ . '/../';
$cleanPath = str_replace('backend/', '', $path);
$fullPath = $baseDir . $cleanPath;
$realPath = realpath($fullPath);
$allowedDir = realpath($baseDir . 'uploads/');

if (!$realPath || !$allowedDir || strpos($realPath, $allowedDir) !== 0) {
    http_response_code(403);
    echo json_encode(["error" => "Access denied"]);
    exit();
}

if (!file_exists($realPath)) {
    http_response_code(404);
    echo json_encode(["error" => "File not found"]);
    exit();
}

// Detect content type
$ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
$contentType = 'application/octet-stream';
if (in_array($ext, ['jpg', 'jpeg'])) {
    $contentType = 'image/jpeg';
} elseif ($ext === 'png') {
    $contentType = 'image/png';
} elseif ($ext === 'gif') {
    $contentType = 'image/gif';
} elseif ($ext === 'webp') {
    $contentType = 'image/webp';
} elseif ($ext === 'pdf') {
    $contentType = 'application/pdf';
}

header("Content-Type: $contentType");
readfile($realPath);
exit();
