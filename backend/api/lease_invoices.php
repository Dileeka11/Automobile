<?php
require_once __DIR__ . '/../config/db.php';

$SELECT = "SELECT
        invoice_id      AS invoiceId,
        invoice_date    AS date,
        invoice_no      AS invoiceNo,
        customer_name   AS customerName,
        address,
        tel_no          AS telNo,
        bank_name       AS bankName,
        bank_branch     AS bankBranch,
        for_sale        AS forSale,
        make,
        model,
        yom,
        engine_capacity AS engineCapacity,
        chassis_number  AS chassisNumber,
        engine_number   AS engineNumber,
        advance,
        lease_amount    AS leaseAmount,
        balance,
        total_cost      AS totalCost,
        director_name   AS directorName,
        updated_at      AS updatedAt
    FROM lease_invoices WHERE invoice_id = ?";

function castRow($row) {
    if (!$row) return null;
    foreach (['advance', 'leaseAmount', 'balance', 'totalCost'] as $k) {
        $row[$k] = (float)$row[$k];
    }
    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $invoiceId = $_GET['invoiceId'] ?? null;
        if (!$invoiceId) {
            sendError("Invoice ID is required");
        }
        try {
            $stmt = $pdo->prepare($SELECT);
            $stmt->execute([$invoiceId]);
            $row = $stmt->fetch();
            // No saved lease invoice yet — the client falls back to its defaults
            sendJson($row ? castRow($row) : null);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $invoiceId = trim($data['invoiceId'] ?? '');
        if ($invoiceId === '') {
            sendError("Invoice ID is required");
        }

        $params = [
            'invoice_id'      => $invoiceId,
            'invoice_date'    => trim($data['date'] ?? '') ?: null,
            'invoice_no'      => trim($data['invoiceNo'] ?? ''),
            'customer_name'   => trim($data['customerName'] ?? ''),
            'address'         => trim($data['address'] ?? ''),
            'tel_no'          => trim($data['telNo'] ?? ''),
            'bank_name'       => trim($data['bankName'] ?? ''),
            'bank_branch'     => trim($data['bankBranch'] ?? ''),
            'for_sale'        => trim($data['forSale'] ?? ''),
            'make'            => trim($data['make'] ?? ''),
            'model'           => trim($data['model'] ?? ''),
            'yom'             => trim((string)($data['yom'] ?? '')),
            'engine_capacity' => trim($data['engineCapacity'] ?? ''),
            'chassis_number'  => trim($data['chassisNumber'] ?? ''),
            'engine_number'   => trim($data['engineNumber'] ?? ''),
            'advance'         => floatval($data['advance'] ?? 0),
            'lease_amount'    => floatval($data['leaseAmount'] ?? 0),
            'balance'         => floatval($data['balance'] ?? 0),
            'total_cost'      => floatval($data['totalCost'] ?? 0),
            'director_name'   => trim($data['directorName'] ?? ''),
        ];

        try {
            $sql = "INSERT INTO lease_invoices
                (invoice_id, invoice_date, invoice_no, customer_name, address, tel_no, bank_name, bank_branch,
                 for_sale, make, model, yom, engine_capacity, chassis_number, engine_number,
                 advance, lease_amount, balance, total_cost, director_name)
                VALUES
                (:invoice_id, :invoice_date, :invoice_no, :customer_name, :address, :tel_no, :bank_name, :bank_branch,
                 :for_sale, :make, :model, :yom, :engine_capacity, :chassis_number, :engine_number,
                 :advance, :lease_amount, :balance, :total_cost, :director_name)
                ON DUPLICATE KEY UPDATE
                    invoice_date = VALUES(invoice_date),
                    invoice_no = VALUES(invoice_no),
                    customer_name = VALUES(customer_name),
                    address = VALUES(address),
                    tel_no = VALUES(tel_no),
                    bank_name = VALUES(bank_name),
                    bank_branch = VALUES(bank_branch),
                    for_sale = VALUES(for_sale),
                    make = VALUES(make),
                    model = VALUES(model),
                    yom = VALUES(yom),
                    engine_capacity = VALUES(engine_capacity),
                    chassis_number = VALUES(chassis_number),
                    engine_number = VALUES(engine_number),
                    advance = VALUES(advance),
                    lease_amount = VALUES(lease_amount),
                    balance = VALUES(balance),
                    total_cost = VALUES(total_cost),
                    director_name = VALUES(director_name)";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $get = $pdo->prepare($SELECT);
            $get->execute([$invoiceId]);
            sendJson(castRow($get->fetch()));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $invoiceId = $_GET['invoiceId'] ?? null;
        if (!$invoiceId) {
            sendError("Invoice ID is required");
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM lease_invoices WHERE invoice_id = ?");
            $stmt->execute([$invoiceId]);
            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
