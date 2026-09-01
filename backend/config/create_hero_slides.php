<?php
require_once __DIR__ . '/db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS hero_slides (
        slot TINYINT NOT NULL PRIMARY KEY,
        file_path VARCHAR(255) NOT NULL,
        alt_text VARCHAR(191) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "hero_slides table created successfully.\n";

    $dir = __DIR__ . '/../uploads/website/';
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
        echo "uploads/website directory created.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
