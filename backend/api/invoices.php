<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM invoices ORDER BY created_at DESC");
        $results = [];
        foreach ($stmt->fetchAll() as $row) {
            $results[] = [
                'id' => $row['id'],
                'quotationId' => $row['quotation_id'],
                'ttAmount' => (float)$row['tt_amount'],
                'advanceAmount' => (float)$row['advance_amount'],
                'balance' => (float)$row['balance'],
                'isLcComplete' => (bool)$row['is_lc_complete'],
                'isTtComplete' => (bool)$row['is_tt_complete'],
                'status' => strtolower($row['status']),
                'createdAt' => $row['created_at']
            ];
        }
        sendJson($results);
        break;

    case 'POST':
        $data = getJsonInput();
        if (empty($data['quotationId'])) {
            sendError("Quotation ID is required");
        }

        try {
            // Find vehicle_id for the quotation
            $stmt = $pdo->prepare("SELECT vehicle_id FROM quotations WHERE id = ?");
            $stmt->execute([$data['quotationId']]);
            $vehicleId = $stmt->fetchColumn();

            if (!$vehicleId) {
                throw new Exception("Quotation not found");
            }

            $id = $data['id'] ?? ('INV' . strtoupper(substr(uniqid(), -5)));
            $dueDate = date('Y-m-d', strtotime('+3 days'));
            $status = strtoupper($data['status'] ?? 'PENDING');

            $stmt = $pdo->prepare("INSERT INTO invoices (id, vehicle_id, quotation_id, invoice_type, total_amount, tt_amount, advance_amount, balance, is_lc_complete, is_tt_complete, due_date, status) VALUES (?, ?, ?, 'Advance', ?, ?, ?, ?, ?, ?, ?, ?)");
            
            // total cost is advance + balance
            $totalAmount = ($data['advanceAmount'] ?? 0) + ($data['balance'] ?? 0);

            $stmt->execute([
                $id,
                $vehicleId,
                $data['quotationId'],
                $totalAmount,
                $data['ttAmount'] ?? 0,
                $data['advanceAmount'] ?? 0,
                $data['balance'] ?? 0,
                isset($data['isLcComplete']) ? ($data['isLcComplete'] ? 1 : 0) : 0,
                isset($data['isTtComplete']) ? ($data['isTtComplete'] ? 1 : 0) : 0,
                $dueDate,
                $status
            ]);

            sendJson([
                'id' => $id,
                'quotationId' => $data['quotationId'],
                'ttAmount' => (float)($data['ttAmount'] ?? 0),
                'advanceAmount' => (float)($data['advanceAmount'] ?? 0),
                'balance' => (float)($data['balance'] ?? 0),
                'isLcComplete' => isset($data['isLcComplete']) ? (bool)$data['isLcComplete'] : false,
                'isTtComplete' => isset($data['isTtComplete']) ? (bool)$data['isTtComplete'] : false,
                'status' => strtolower($status),
                'createdAt' => date('c')
            ]);

        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Invoice ID is required");
        }
        $data = getJsonInput();

        try {
            // Can update status or other fields
            $fields = [];
            $params = [];

            if (isset($data['status'])) {
                $fields[] = "status = ?";
                $params[] = strtoupper($data['status']);
            }
            if (isset($data['advanceAmount'])) {
                $fields[] = "advance_amount = ?";
                $params[] = $data['advanceAmount'];
            }
            if (isset($data['balance'])) {
                $fields[] = "balance = ?";
                $params[] = $data['balance'];
            }
            if (isset($data['isLcComplete'])) {
                $fields[] = "is_lc_complete = ?";
                $params[] = $data['isLcComplete'] ? 1 : 0;
            }
            if (isset($data['isTtComplete'])) {
                $fields[] = "is_tt_complete = ?";
                $params[] = $data['isTtComplete'] ? 1 : 0;
            }

            if (count($fields) === 0) {
                sendJson(["message" => "No fields to update"]);
            }

            $params[] = $id;
            $sql = "UPDATE invoices SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Fetch updated invoice
            $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();

            sendJson([
                'id' => $row['id'],
                'quotationId' => $row['quotation_id'],
                'ttAmount' => (float)$row['tt_amount'],
                'advanceAmount' => (float)$row['advance_amount'],
                'balance' => (float)$row['balance'],
                'isLcComplete' => (bool)$row['is_lc_complete'],
                'isTtComplete' => (bool)$row['is_tt_complete'],
                'status' => strtolower($row['status']),
                'createdAt' => $row['created_at']
            ]);

        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Invoice ID is required");
        }
        $stmt = $pdo->prepare("DELETE FROM invoices WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(["status" => "success"]);
        break;

    default:
        sendError("Method not allowed", 405);
}
