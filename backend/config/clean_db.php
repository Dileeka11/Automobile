<?php
$host = 'localhost';
$user = 'root';
$pass = '';

try {
    // 1. Connect to MySQL server
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 2. Create database if not exists
    $pdo->exec("DROP DATABASE IF EXISTS automobile");
    $pdo->exec("CREATE DATABASE automobile");
    $pdo->exec("USE automobile");
    echo "Prised database 'automobile' created and selected successfully.\n";

    // 3. Run schema script
    $sql = file_get_contents(__DIR__ . '/init_db.sql');
    $pdo->exec($sql);
    echo "Database tables created successfully.\n";

    // 4. Seed Make Models (Reference configurations)
    $makes = [
        ['MK1', 'Toyota'],
        ['MK2', 'Honda'],
        ['MK3', 'Nissan'],
        ['MK4', 'Suzuki'],
        ['MK5', 'BMW']
    ];
    $insertMake = $pdo->prepare("INSERT INTO make_models (id, name) VALUES (?, ?)");
    foreach ($makes as $m) {
        $insertMake->execute($m);
    }
    echo "Reference makes populated.\n";

    // 5. Seed Vehicle Models (Catalog items)
    $vehicles = [
        ['VM1', 'MK1', 'Aqua', '1500cc', 'White', 'S', 2019, 45000, 2800000, 50000, 150000, 1200000, 35000, 45000, 20000],
        ['VM2', 'MK1', 'Premio', '1800cc', 'Pearl', 'F', 2018, 60000, 4500000, 80000, 250000, 2100000, 50000, 60000, 25000],
        ['VM3', 'MK2', 'Vezel', '1500cc', 'Black', 'Z', 2020, 30000, 5200000, 90000, 280000, 2400000, 55000, 65000, 30000],
        ['VM4', 'MK2', 'Civic', '1800cc', 'Red', 'EX', 2021, 22000, 6800000, 100000, 320000, 3100000, 60000, 70000, 35000],
        ['VM5', 'MK3', 'X-Trail', '2000cc', 'Silver', 'GT', 2019, 55000, 7200000, 110000, 350000, 3400000, 65000, 75000, 40000],
        ['VM6', 'MK4', 'Swift', '1200cc', 'Blue', 'RS', 2022, 15000, 3200000, 60000, 180000, 1500000, 40000, 50000, 22000],
        ['VM7', 'MK5', 'X1', '2000cc', 'Black', 'M Sport', 2020, 38000, 12500000, 180000, 600000, 5800000, 90000, 110000, 60000]
    ];
    $insertVeh = $pdo->prepare("INSERT INTO vehicle_models (id, make_model_id, name, engine_capacity, color, grade, year, mileage, cif_value, lc_amount, tt_amount, tax_amount, service_charge, clearing_charge, dmi_charge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($vehicles as $v) {
        $insertVeh->execute($v);
    }
    echo "Catalog model templates populated successfully.\n";
    echo "Database cleaned and prepared for production launch!\n";

} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
