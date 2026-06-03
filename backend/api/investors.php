<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

switch ($method) {
    case 'GET':
        if ($action === 'get_investments') {
            // Retrieve all vehicle investments with details
            $stmt = $pdo->query("
                SELECT 
                    vi.id,
                    vi.investor_id as investorId,
                    i.name as investorName,
                    vi.vehicle_id as vehicleId,
                    CONCAT(v.make, ' ', v.model) as vehicleName,
                    v.chassis_number as chassisNumber,
                    vi.invested_amount as investedAmount,
                    vi.roi_percentage as roiPercentage,
                    vi.profit_share_amount as profitShareAmount,
                    vi.status
                FROM vehicle_investments vi
                JOIN investors i ON vi.investor_id = i.id
                JOIN vehicles v ON vi.vehicle_id = v.id
                ORDER BY vi.id DESC
            ");
            sendJson($stmt->fetchAll());
        } elseif ($action === 'vehicles_available') {
            // Retrieve all vehicles that have status in Ordered, Shipped, Clearing
            $stmt = $pdo->query("
                SELECT id, make, model, manufacture_year as year, chassis_number as chassisNumber, status
                FROM vehicles
                WHERE status IN ('Ordered', 'Shipped', 'Clearing')
            ");
            sendJson($stmt->fetchAll());
        } else {
            // List all investors
            $stmt = $pdo->query("SELECT * FROM investors ORDER BY name ASC");
            sendJson($stmt->fetchAll());
        }
        break;

    case 'POST':
        if ($action === 'add_investment') {
            $data = getJsonInput();
            if (empty($data['investorId']) || empty($data['vehicleId']) || empty($data['investedAmount'])) {
                sendError("Investor ID, Vehicle ID, and Invested Amount are required");
            }

            try {
                $roi = $data['roiPercentage'] ?? 5.00;
                // Calculate profit share (flat % or split)
                // Let's store roi_percentage, profit share will be updated/computed upon final invoicing
                $stmt = $pdo->prepare("INSERT INTO vehicle_investments (investor_id, vehicle_id, invested_amount, roi_percentage, status) VALUES (?, ?, ?, ?, 'Active')");
                $stmt->execute([
                    $data['investorId'],
                    $data['vehicleId'],
                    $data['investedAmount'],
                    $roi
                ]);
                sendJson(["id" => $pdo->lastInsertId(), "status" => "success"]);
            } catch (Exception $e) {
                sendError($e->getMessage());
            }
        } elseif ($action === 'settle_investment') {
            $data = getJsonInput();
            if (empty($data['investmentId'])) {
                sendError("Investment ID is required");
            }

            try {
                // Settle investment and calculate final payout
                $stmt = $pdo->prepare("SELECT * FROM vehicle_investments WHERE id = ?");
                $stmt->execute([$data['investmentId']]);
                $inv = $stmt->fetch();

                if (!$inv) {
                    throw new Exception("Investment not found");
                }

                // calculate profit share: flat percentage of invested amount
                $profitShare = $inv['invested_amount'] * ($inv['roi_percentage'] / 100);

                $stmt = $pdo->prepare("UPDATE vehicle_investments SET status = 'Settled', profit_share_amount = ? WHERE id = ?");
                $stmt->execute([$profitShare, $data['investmentId']]);

                sendJson(["status" => "success", "profit_share" => $profitShare]);
            } catch (Exception $e) {
                sendError($e->getMessage());
            }
        } else {
            // Create Investor
            $data = getJsonInput();
            if (empty($data['name'])) {
                sendError("Name is required");
            }

            try {
                $stmt = $pdo->prepare("INSERT INTO investors (name, phone, email) VALUES (?, ?, ?)");
                $stmt->execute([
                    $data['name'],
                    $data['phone'] ?? '',
                    $data['email'] ?? ''
                ]);
                sendJson([
                    'id' => $pdo->lastInsertId(),
                    'name' => $data['name'],
                    'phone' => $data['phone'] ?? '',
                    'email' => $data['email'] ?? ''
                ]);
            } catch (Exception $e) {
                sendError($e->getMessage());
            }
        }
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Investor ID is required");
        }
        $data = getJsonInput();
        if (empty($data['name'])) {
            sendError("Name is required");
        }

        try {
            $stmt = $pdo->prepare("UPDATE investors SET name = ?, phone = ?, email = ? WHERE id = ?");
            $stmt->execute([
                $data['name'],
                $data['phone'] ?? '',
                $data['email'] ?? '',
                $id
            ]);
            sendJson(["id" => $id, "name" => $data['name']]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Investor ID is required");
        }
        $stmt = $pdo->prepare("DELETE FROM investors WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(["status" => "success"]);
        break;

    default:
        sendError("Method not allowed", 405);
}
