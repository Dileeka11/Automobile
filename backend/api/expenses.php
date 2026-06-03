<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $vehicleId = $_GET['vehicle_id'] ?? null;
        if ($vehicleId) {
            $stmt = $pdo->prepare("SELECT * FROM expenses WHERE vehicle_id = ? ORDER BY date_incurred DESC");
            $stmt->execute([$vehicleId]);
        } else {
            $stmt = $pdo->query("
                SELECT e.*, CONCAT(v.make, ' ', v.model) as vehicleName, v.chassis_number as chassisNumber
                FROM expenses e
                JOIN vehicles v ON e.vehicle_id = v.id
                ORDER BY e.date_incurred DESC
            ");
        }
        sendJson($stmt->fetchAll());
        break;

    case 'POST':
        $data = getJsonInput();
        if (empty($data['vehicleId']) || empty($data['expenseType']) || empty($data['amount'])) {
            sendError("Vehicle ID, Expense Type, and Amount are required");
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO expenses (vehicle_id, expense_type, amount, description, date_incurred) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['vehicleId'],
                $data['expenseType'],
                $data['amount'],
                $data['description'] ?? '',
                $data['dateIncurred'] ?? date('Y-m-d')
            ]);
            sendJson([
                'id' => $pdo->lastInsertId(),
                'status' => 'success'
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Expense ID is required");
        }
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(["status" => "success"]);
        break;

    default:
        sendError("Method not allowed", 405);
}
