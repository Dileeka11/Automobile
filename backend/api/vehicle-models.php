<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM vehicle_models");
        $results = [];
        foreach ($stmt->fetchAll() as $row) {
            $results[] = [
                'id' => $row['id'],
                'makeModelId' => $row['make_model_id'],
                'name' => $row['name'],
                'engineCapacity' => $row['engine_capacity'],
                'color' => $row['color'],
                'grade' => $row['grade'],
                'year' => (int)$row['year'],
                'mileage' => (int)$row['mileage'],
                'cifValue' => (float)$row['cif_value'],
                'lcAmount' => (float)$row['lc_amount'],
                'ttAmount' => (float)$row['tt_amount'],
                'taxAmount' => (float)$row['tax_amount'],
                'serviceCharge' => (float)$row['service_charge'],
                'clearingCharge' => (float)$row['clearing_charge'],
                'dmiCharge' => (float)$row['dmi_charge']
            ];
        }
        sendJson($results);
        break;

    case 'POST':
        $data = getJsonInput();
        $id = $data['id'] ?? ('VM' . strtoupper(substr(uniqid(), -5)));
        $stmt = $pdo->prepare("INSERT INTO vehicle_models (id, make_model_id, name, engine_capacity, color, grade, year, mileage, cif_value, lc_amount, tt_amount, tax_amount, service_charge, clearing_charge, dmi_charge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['makeModelId'] ?? '',
            $data['name'] ?? '',
            $data['engineCapacity'] ?? '',
            $data['color'] ?? '',
            $data['grade'] ?? '',
            $data['year'] ?? date('Y'),
            $data['mileage'] ?? 0,
            $data['cifValue'] ?? 0,
            $data['lcAmount'] ?? 0,
            $data['ttAmount'] ?? 0,
            $data['taxAmount'] ?? 0,
            $data['serviceCharge'] ?? 0,
            $data['clearingCharge'] ?? 0,
            $data['dmiCharge'] ?? 0
        ]);
        $data['id'] = $id;
        sendJson($data);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError("Vehicle Model ID is required");
        $data = getJsonInput();
        $stmt = $pdo->prepare("UPDATE vehicle_models SET make_model_id = ?, name = ?, engine_capacity = ?, color = ?, grade = ?, year = ?, mileage = ?, cif_value = ?, lc_amount = ?, tt_amount = ?, tax_amount = ?, service_charge = ?, clearing_charge = ?, dmi_charge = ? WHERE id = ?");
        $stmt->execute([
            $data['makeModelId'] ?? '',
            $data['name'] ?? '',
            $data['engineCapacity'] ?? '',
            $data['color'] ?? '',
            $data['grade'] ?? '',
            $data['year'] ?? date('Y'),
            $data['mileage'] ?? 0,
            $data['cifValue'] ?? 0,
            $data['lcAmount'] ?? 0,
            $data['ttAmount'] ?? 0,
            $data['taxAmount'] ?? 0,
            $data['serviceCharge'] ?? 0,
            $data['clearingCharge'] ?? 0,
            $data['dmiCharge'] ?? 0,
            $id
        ]);
        $data['id'] = $id;
        sendJson($data);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError("Vehicle Model ID is required");
        $stmt = $pdo->prepare("DELETE FROM vehicle_models WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(["status" => "success"]);
        break;

    default:
        sendError("Method not allowed", 405);
}
