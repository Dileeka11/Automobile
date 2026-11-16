<?php
// Adds JPY amount + exchange rate columns to quotations. Safe to re-run.
// Usage: php backend/config/upgrade_quotation_jpy.php
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once __DIR__ . '/db.php';

$cols = [
    'exchange_rate' => "DECIMAL(12,4) NOT NULL DEFAULT 0 AFTER tt_amount",
    'cif_value_jpy' => "DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER exchange_rate",
    'lc_amount_jpy' => "DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER cif_value_jpy",
    'tt_amount_jpy' => "DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER lc_amount_jpy",
];

foreach ($cols as $col => $def) {
    $stmt = $pdo->prepare("SHOW COLUMNS FROM quotations LIKE ?");
    $stmt->execute([$col]);
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE quotations ADD COLUMN $col $def");
        echo "Added column '$col' to quotations.\n";
    } else {
        echo "Column '$col' already exists.\n";
    }
}

echo "Done.\n";
