<?php
// Company-LC pricing columns (selling price + VAT). Added on demand so a deploy
// without running the migration still works. Kept out of db.php because the
// deploy never uploads db.php (the server keeps its own copy).
function ensureInvoicePricingColumns($pdo) {
    $cols = ['selling_price' => 'DECIMAL(15,2) NULL', 'vat_percent' => 'DECIMAL(5,2) NULL'];
    foreach ($cols as $col => $def) {
        try {
            if (!$pdo->query("SHOW COLUMNS FROM invoices LIKE '$col'")->fetch()) {
                $pdo->exec("ALTER TABLE invoices ADD COLUMN $col $def");
            }
        } catch (Exception $e) {
            // No ALTER permission etc. — run the ALTER manually; reads still work below.
            error_log("ensureInvoicePricingColumns($col): " . $e->getMessage());
        }
    }
}
