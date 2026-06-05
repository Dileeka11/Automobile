<?php
$_SERVER['REQUEST_METHOD'] = 'GET'; // Avoid undefined key warning
require_once __DIR__ . '/db.php';

try {
    $cols = [
        'lc_copy_path' => "VARCHAR(255) NULL",
        'inspection_certificate_path' => "VARCHAR(255) NULL",
        'etd_date' => "DATE NULL",
        'arrival_date' => "DATE NULL"
    ];

    foreach ($cols as $colName => $definition) {
        // Query information_schema to check if column exists
        $stmt = $pdo->prepare("
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'automobile' 
              AND TABLE_NAME = 'invoices' 
              AND COLUMN_NAME = ?
        ");
        $stmt->execute([$colName]);
        if ($stmt->rowCount() === 0) {
            $pdo->exec("ALTER TABLE invoices ADD COLUMN $colName $definition");
            echo "Added column '$colName' to invoices table.\n";
        } else {
            echo "Column '$colName' already exists in invoices table.\n";
        }
    }

    // 2. Create invoice_yard_pictures table
    $sqlCreateYardPics = "CREATE TABLE IF NOT EXISTS invoice_yard_pictures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id VARCHAR(50) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )";
    $pdo->exec($sqlCreateYardPics);
    echo "Created table 'invoice_yard_pictures' successfully.\n";

    echo "Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Error running migration: " . $e->getMessage() . "\n";
}
