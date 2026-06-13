<?php
require_once __DIR__ . '/db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS invoice_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        payment_date DATE NOT NULL,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $pdo->exec($sql);
    echo "invoice_payments table created successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
