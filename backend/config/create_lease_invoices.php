<?php
require_once __DIR__ . '/db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS lease_invoices (
        invoice_id VARCHAR(50) NOT NULL PRIMARY KEY,
        invoice_date DATE NULL,
        invoice_no VARCHAR(60) NULL,
        customer_name VARCHAR(191) NULL,
        address VARCHAR(255) NULL,
        tel_no VARCHAR(60) NULL,
        bank_name VARCHAR(150) NULL,
        bank_branch VARCHAR(150) NULL,
        for_sale VARCHAR(191) NULL,
        make VARCHAR(100) NULL,
        model VARCHAR(150) NULL,
        yom VARCHAR(20) NULL,
        engine_capacity VARCHAR(50) NULL,
        chassis_number VARCHAR(100) NULL,
        engine_number VARCHAR(100) NULL,
        advance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        lease_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_cost DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        director_name VARCHAR(150) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "lease_invoices table created successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
