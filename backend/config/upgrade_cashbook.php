<?php
require_once __DIR__ . '/db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS cashbook_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expense_type VARCHAR(100) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        date_incurred DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $pdo->exec($sql);
    echo "cashbook_expenses table verified/created successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
