<?php
require_once __DIR__ . '/db.php';

try {
    // Add missing columns to quotations table
    $pdo->exec("ALTER TABLE quotations ADD COLUMN mileage INT DEFAULT 0 AFTER service_charge");
    echo "Added mileage column to quotations\n";
} catch (PDOException $e) {
    echo "mileage column may already exist: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE quotations ADD COLUMN dmi_charge DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER mileage");
    echo "Added dmi_charge column to quotations\n";
} catch (PDOException $e) {
    echo "dmi_charge column may already exist: " . $e->getMessage() . "\n";
}

// Copy existing vehicle_model financial data into quotations for existing records
try {
    $pdo->exec("
        UPDATE quotations q
        JOIN vehicles v ON q.vehicle_id = v.id
        JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
        SET q.dmi_charge = vm.dmi_charge,
            q.mileage = vm.mileage
        WHERE q.dmi_charge = 0
    ");
    echo "Copied existing dmi_charge and mileage data to quotations\n";
} catch (PDOException $e) {
    echo "Data copy warning: " . $e->getMessage() . "\n";
}

// Now drop columns from vehicle_models
$columnsToDrop = ['mileage', 'cif_value', 'lc_amount', 'tt_amount', 'tax_amount', 'service_charge', 'clearing_charge', 'dmi_charge'];
foreach ($columnsToDrop as $col) {
    try {
        $pdo->exec("ALTER TABLE vehicle_models DROP COLUMN $col");
        echo "Dropped $col from vehicle_models\n";
    } catch (PDOException $e) {
        echo "Could not drop $col: " . $e->getMessage() . "\n";
    }
}

echo "\nMigration complete!\n";
