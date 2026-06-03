<?php
$host = 'localhost';
$user = 'root';
$pass = '';

try {
    // 1. Connect to MySQL server (without database name)
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 2. Create database if not exists
    $pdo->exec("DROP DATABASE IF EXISTS automobile");
    $pdo->exec("CREATE DATABASE automobile");
    $pdo->exec("USE automobile");
    echo "Database 'automobile' created and selected successfully.\n";

    // 3. Run schema script
    $sql = file_get_contents(__DIR__ . '/init_db.sql');
    $pdo->exec($sql);
    echo "Database tables created successfully.\n";

    // 4. Seed Make Models
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
    echo "Seeded make models.\n";

    // 5. Seed Vehicle Models
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
    echo "Seeded vehicle models.\n";

    // 6. Seed Customers & Operational Data
    $customers = [
        ['id' => 1, 'name' => 'Kasun Perera', 'phone' => '0771234567', 'email' => 'kasun@example.com', 'address' => 'No.12, Galle Road, Colombo', 'nic' => '199012345678'],
        ['id' => 2, 'name' => 'Nimali Silva', 'phone' => '0779876543', 'email' => 'nimali@example.com', 'address' => '45, Temple Road, Kandy', 'nic' => '198754321987'],
        ['id' => 3, 'name' => 'Ruwan Fernando', 'phone' => '0712345678', 'email' => 'ruwan@example.com', 'address' => '78, Beach Road, Negombo', 'nic' => '199234567891'],
        ['id' => 4, 'name' => 'Dilani Jayasinghe', 'phone' => '0701234567', 'email' => 'dilani@example.com', 'address' => '9, Lake View, Nuwara Eliya', 'nic' => '199512345670'],
        ['id' => 5, 'name' => 'Sahan Wickramasinghe', 'phone' => '0761234567', 'email' => 'sahan@example.com', 'address' => '23, Hill Street, Galle', 'nic' => '198812345671'],
        ['id' => 6, 'name' => 'Tharushi Rajapaksha', 'phone' => '0751234567', 'email' => 'tharushi@example.com', 'address' => '56, Main Street, Matara', 'nic' => '199712345672'],
    ];

    $insCust = $pdo->prepare("INSERT INTO customers (id, name, phone, email, address, nic) VALUES (:id, :name, :phone, :email, :address, :nic)");
    foreach ($customers as $c) {
        $insCust->execute($c);
    }

    // Vehicles
    $vehiclesData = [
        ['id' => 1, 'customer_id' => 1, 'make_model_id' => 'MK1', 'vehicle_model_id' => 'VM1', 'make' => 'Toyota', 'model' => 'Aqua', 'manufacture_year' => 2019, 'grade' => 'S', 'engine_capacity' => '1500cc', 'mileage' => 45000, 'color' => 'White', 'chassis_number' => 'NHP10-1234567', 'status' => 'Ordered'],
        ['id' => 2, 'customer_id' => 2, 'make_model_id' => 'MK2', 'vehicle_model_id' => 'VM3', 'make' => 'Honda', 'model' => 'Vezel', 'manufacture_year' => 2020, 'grade' => 'Z', 'engine_capacity' => '1500cc', 'mileage' => 30000, 'color' => 'Black', 'chassis_number' => 'RU3-9876543', 'status' => 'Shipped'],
        ['id' => 3, 'customer_id' => 3, 'make_model_id' => 'MK3', 'vehicle_model_id' => 'VM5', 'make' => 'Nissan', 'model' => 'X-Trail', 'manufacture_year' => 2019, 'grade' => 'GT', 'engine_capacity' => '2000cc', 'mileage' => 55000, 'color' => 'Silver', 'chassis_number' => 'NT32-2345678', 'status' => 'Clearing'],
        ['id' => 4, 'customer_id' => 4, 'make_model_id' => 'MK1', 'vehicle_model_id' => 'VM2', 'make' => 'Toyota', 'model' => 'Premio', 'manufacture_year' => 2018, 'grade' => 'F', 'engine_capacity' => '1800cc', 'mileage' => 60000, 'color' => 'Pearl', 'chassis_number' => 'NZT260-112233', 'status' => 'Registered'],
    ];
    $insVeh = $pdo->prepare("INSERT INTO vehicles (id, customer_id, make_model_id, vehicle_model_id, make, model, manufacture_year, grade, engine_capacity, mileage, color, chassis_number, status) VALUES (:id, :customer_id, :make_model_id, :vehicle_model_id, :make, :model, :manufacture_year, :grade, :engine_capacity, :mileage, :color, :chassis_number, :status)");
    foreach ($vehiclesData as $v) {
        $insVeh->execute($v);
    }

    // Quotations
    $quotationsData = [
        ['id' => 'Q1001', 'vehicle_id' => 1, 'cif_value' => 2800000, 'lc_amount' => 50000, 'tt_amount' => 150000, 'tax_amount' => 1200000, 'clearing_amount' => 45000, 'service_charge' => 35000, 'status' => 'Accepted'],
        ['id' => 'Q1002', 'vehicle_id' => 2, 'cif_value' => 5200000, 'lc_amount' => 90000, 'tt_amount' => 280000, 'tax_amount' => 2400000, 'clearing_amount' => 65000, 'service_charge' => 55000, 'status' => 'Accepted'],
        ['id' => 'Q1003', 'vehicle_id' => 3, 'cif_value' => 7200000, 'lc_amount' => 110000, 'tt_amount' => 350000, 'tax_amount' => 3400000, 'clearing_amount' => 75000, 'service_charge' => 65000, 'status' => 'Accepted'],
        ['id' => 'Q1004', 'vehicle_id' => 4, 'cif_value' => 4500000, 'lc_amount' => 80000, 'tt_amount' => 250000, 'tax_amount' => 2100000, 'clearing_amount' => 60000, 'service_charge' => 50000, 'status' => 'Accepted']
    ];
    $insQuo = $pdo->prepare("INSERT INTO quotations (id, vehicle_id, cif_value, lc_amount, tt_amount, tax_amount, clearing_amount, service_charge, status) VALUES (:id, :vehicle_id, :cif_value, :lc_amount, :tt_amount, :tax_amount, :clearing_amount, :service_charge, :status)");
    foreach ($quotationsData as $q) {
        $insQuo->execute($q);
    }

    // Agreements
    $insAg = $pdo->prepare("INSERT INTO agreements (quotation_id, signed_date, is_signed) VALUES (?, CURRENT_DATE(), 1)");
    $insAg->execute(['Q1001']);
    $insAg->execute(['Q1002']);
    $insAg->execute(['Q1003']);
    $insAg->execute(['Q1004']);

    // Invoices
    $invoicesData = [
        ['id' => 'INV2001', 'vehicle_id' => 1, 'quotation_id' => 'Q1001', 'invoice_type' => 'Advance', 'total_amount' => 4230000, 'tt_amount' => 150000, 'advance_amount' => 2000000, 'balance' => 2230000, 'due_date' => date('Y-m-d', strtotime('+3 days')), 'status' => 'Pending'],
        ['id' => 'INV2002', 'vehicle_id' => 2, 'quotation_id' => 'Q1002', 'invoice_type' => 'Advance', 'total_amount' => 7800000, 'tt_amount' => 280000, 'advance_amount' => 4000000, 'balance' => 3800000, 'due_date' => date('Y-m-d', strtotime('+3 days')), 'status' => 'Paid'],
        ['id' => 'INV2003', 'vehicle_id' => 3, 'quotation_id' => 'Q1003', 'invoice_type' => 'Advance', 'total_amount' => 10890000, 'tt_amount' => 350000, 'advance_amount' => 5000000, 'balance' => 5890000, 'due_date' => date('Y-m-d', strtotime('+3 days')), 'status' => 'Pending'],
        ['id' => 'INV2004', 'vehicle_id' => 4, 'quotation_id' => 'Q1004', 'invoice_type' => 'Advance', 'total_amount' => 6760000, 'tt_amount' => 250000, 'advance_amount' => 3500000, 'balance' => 3260000, 'due_date' => date('Y-m-d', strtotime('+3 days')), 'status' => 'Paid'],
    ];
    $insInv = $pdo->prepare("INSERT INTO invoices (id, vehicle_id, quotation_id, invoice_type, total_amount, tt_amount, advance_amount, balance, due_date, status) VALUES (:id, :vehicle_id, :quotation_id, :invoice_type, :total_amount, :tt_amount, :advance_amount, :balance, :due_date, :status)");
    foreach ($invoicesData as $i) {
        $insInv->execute($i);
    }

    // Logistics
    $logisticsData = [
        ['vehicle_id' => 1, 'shipping_company' => 'NYK Line', 'vessel_name' => 'Aries Leader', 'etd' => date('Y-m-d', strtotime('-5 days')), 'eta' => date('Y-m-d', strtotime('+15 days')), 'port_of_loading' => 'Yokohama', 'port_of_discharge' => 'Hambantota'],
        ['vehicle_id' => 2, 'shipping_company' => 'Mitsui O.S.K. Lines', 'vessel_name' => 'Orca Ace', 'etd' => date('Y-m-d', strtotime('-10 days')), 'eta' => date('Y-m-d', strtotime('+7 days')), 'port_of_loading' => 'Nagoya', 'port_of_discharge' => 'Hambantota'],
        ['vehicle_id' => 3, 'shipping_company' => 'K-Line', 'vessel_name' => 'Zenith Leader', 'etd' => date('Y-m-d', strtotime('-18 days')), 'eta' => date('Y-m-d', strtotime('-1 day')), 'port_of_loading' => 'Yokohama', 'port_of_discharge' => 'Hambantota'],
        ['vehicle_id' => 4, 'shipping_company' => 'Hoegh Autoliners', 'vessel_name' => 'Hoegh Target', 'etd' => date('Y-m-d', strtotime('-25 days')), 'eta' => date('Y-m-d', strtotime('-5 days')), 'port_of_loading' => 'Nagoya', 'port_of_discharge' => 'Hambantota'],
    ];
    $insLog = $pdo->prepare("INSERT INTO logistics (vehicle_id, shipping_company, vessel_name, etd, eta, port_of_loading, port_of_discharge) VALUES (:vehicle_id, :shipping_company, :vessel_name, :etd, :eta, :port_of_loading, :port_of_discharge)");
    foreach ($logisticsData as $l) {
        $insLog->execute($l);
    }

    // RMV Registration
    $rmvData = [
        ['vehicle_id' => 1, 'has_id_copy' => 1, 'has_gs_certificate' => 0, 'has_tin_certificate' => 0, 'has_mt2_form' => 0, 'registration_number' => null, 'status' => 'Pending Documents'],
        ['vehicle_id' => 2, 'has_id_copy' => 1, 'has_gs_certificate' => 1, 'has_tin_certificate' => 1, 'has_mt2_form' => 0, 'registration_number' => null, 'status' => 'Submitted to RMV'],
        ['vehicle_id' => 3, 'has_id_copy' => 1, 'has_gs_certificate' => 1, 'has_tin_certificate' => 1, 'has_mt2_form' => 1, 'registration_number' => null, 'status' => 'Submitted to RMV'],
        ['vehicle_id' => 4, 'has_id_copy' => 1, 'has_gs_certificate' => 1, 'has_tin_certificate' => 1, 'has_mt2_form' => 1, 'registration_number' => 'WP CAD-4488', 'status' => 'Completed'],
    ];
    $insRmv = $pdo->prepare("INSERT INTO rmv_registrations (vehicle_id, has_id_copy, has_gs_certificate, has_tin_certificate, has_mt2_form, registration_number, status) VALUES (:vehicle_id, :has_id_copy, :has_gs_certificate, :has_tin_certificate, :has_mt2_form, :registration_number, :status)");
    foreach ($rmvData as $r) {
        $insRmv->execute($r);
    }

    // Seed some investors
    $investorsData = [
        ['id' => 1, 'name' => 'Sunil Shantha', 'phone' => '0715566778', 'email' => 'sunil@example.com'],
        ['id' => 2, 'name' => 'Wimal Siri', 'phone' => '0729988776', 'email' => 'wimal@example.com'],
    ];
    $insInvst = $pdo->prepare("INSERT INTO investors (id, name, phone, email) VALUES (:id, :name, :phone, :email)");
    foreach ($investorsData as $inv) {
        $insInvst->execute($inv);
    }

    // Seed some investments
    $investmentsData = [
        ['investor_id' => 1, 'vehicle_id' => 1, 'invested_amount' => 1000000.00, 'roi_percentage' => 5.00, 'profit_share_amount' => 50000.00, 'status' => 'Settled'],
        ['investor_id' => 2, 'vehicle_id' => 2, 'invested_amount' => 2000000.00, 'roi_percentage' => 10.00, 'profit_share_amount' => null, 'status' => 'Active']
    ];
    $insInvs = $pdo->prepare("INSERT INTO vehicle_investments (investor_id, vehicle_id, invested_amount, roi_percentage, profit_share_amount, status) VALUES (:investor_id, :vehicle_id, :invested_amount, :roi_percentage, :profit_share_amount, :status)");
    foreach ($investmentsData as $invs) {
        $insInvs->execute($invs);
    }

    // Seed some website leads
    $leadsData = [
        ['name' => 'Chaminda Silva', 'email' => 'chaminda@gmail.com', 'phone' => '0773344556', 'message' => 'I would like to import a Toyota Aqua 2021 model. Please send quotation details.', 'status' => 'New'],
        ['name' => 'Priyantha Bandara', 'email' => 'priyantha@outlook.com', 'phone' => '0714455667', 'message' => 'Looking for customs clearing agent fees and schedules.', 'status' => 'Contacted'],
    ];
    $insLead = $pdo->prepare("INSERT INTO website_leads (name, email, phone, message, status) VALUES (:name, :email, :phone, :message, :status)");
    foreach ($leadsData as $ld) {
        $insLead->execute($ld);
    }

    echo "Seeded operational data successfully!\n";

} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
