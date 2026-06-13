<?php
require_once __DIR__ . '/../config/db.php';

function recalculateInvoiceBalance($pdo, $invoiceId) {
    // 1. Fetch invoice and quotation details
    $stmt = $pdo->prepare("
        SELECT 
            i.advance_amount, 
            i.is_lc_complete, 
            i.is_tt_complete,
            q.cif_value,
            q.lc_amount,
            q.tt_amount,
            q.tax_amount,
            q.service_charge,
            q.clearing_amount,
            q.dmi_charge
        FROM invoices i
        JOIN quotations q ON i.quotation_id = q.id
        WHERE i.id = ?
    ");
    $stmt->execute([$invoiceId]);
    $row = $stmt->fetch();
    if (!$row) return;

    // 2. Fetch sum of payments
    $payStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0.00) FROM invoice_payments WHERE invoice_id = ?");
    $payStmt->execute([$invoiceId]);
    $paymentsSum = (float)$payStmt->fetchColumn();

    // 3. Compute quotation total
    $quotationTotal = (float)$row['cif_value'] 
                    + (float)$row['lc_amount'] 
                    + (float)$row['tt_amount'] 
                    + (float)$row['tax_amount'] 
                    + (float)$row['service_charge'] 
                    + (float)$row['clearing_amount'] 
                    + (float)$row['dmi_charge'];

    $advance = (float)$row['advance_amount'];
    $lcDeduction = $row['is_lc_complete'] ? (float)$row['lc_amount'] : 0.00;
    
    // TT Deduction: if checked, deduct remaining tt_amount after paymentsSum; else deduct 0
    $ttDeduction = 0.00;
    if ($row['is_tt_complete']) {
        $ttDeduction = max(0.00, (float)$row['tt_amount'] - $paymentsSum);
    }

    $newBalance = max(0.00, $quotationTotal - $advance - $lcDeduction - $ttDeduction);

    // Determine status
    $status = 'PENDING';
    if ($newBalance <= 0) {
        $status = 'PAID';
    } elseif ($paymentsSum > 0) {
        $status = 'PARTIAL';
    }

    // Update invoice
    $upStmt = $pdo->prepare("UPDATE invoices SET balance = ?, status = ? WHERE id = ?");
    $upStmt->execute([$newBalance, $status, $invoiceId]);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $invoiceId = $_GET['invoiceId'] ?? null;
        if (!$invoiceId) {
            sendError("Invoice ID is required");
        }
        try {
            $stmt = $pdo->prepare("SELECT id, invoice_id AS invoiceId, amount, payment_date AS paymentDate, notes, created_at AS createdAt FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC");
            $stmt->execute([$invoiceId]);
            sendJson($stmt->fetchAll());
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $invoiceId = trim($data['invoiceId'] ?? '');
        $amount = floatval($data['amount'] ?? 0);
        $paymentDate = trim($data['paymentDate'] ?? '');
        $notes = trim($data['notes'] ?? '');

        if (empty($invoiceId) || $amount <= 0 || empty($paymentDate)) {
            sendError("Invoice ID, Amount, and Payment Date are required");
        }

        try {
            $pdo->beginTransaction();

            // Insert payment record
            $stmt = $pdo->prepare("INSERT INTO invoice_payments (invoice_id, amount, payment_date, notes) VALUES (?, ?, ?, ?)");
            $stmt->execute([$invoiceId, $amount, $paymentDate, $notes]);
            $paymentId = $pdo->lastInsertId();

            // Update advance_amount in invoices table
            $stmtUp = $pdo->prepare("UPDATE invoices SET advance_amount = COALESCE(advance_amount, 0.00) + ? WHERE id = ?");
            $stmtUp->execute([$amount, $invoiceId]);

            // Recalculate using the shared function
            recalculateInvoiceBalance($pdo, $invoiceId);

            $pdo->commit();

            sendJson([
                'id' => (int)$paymentId,
                'invoiceId' => $invoiceId,
                'amount' => $amount,
                'paymentDate' => $paymentDate,
                'notes' => $notes,
                'createdAt' => date('Y-m-d H:i:s')
            ], 201);

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Payment ID is required");
        }

        try {
            $pdo->beginTransaction();

            // Fetch payment to get invoice_id and amount
            $stmt = $pdo->prepare("SELECT invoice_id, amount FROM invoice_payments WHERE id = ?");
            $stmt->execute([$id]);
            $payment = $stmt->fetch();

            if (!$payment) {
                $pdo->rollBack();
                sendError("Payment record not found");
            }

            $invoiceId = $payment['invoice_id'];
            $amount = (float)$payment['amount'];

            // Delete payment record
            $stmt = $pdo->prepare("DELETE FROM invoice_payments WHERE id = ?");
            $stmt->execute([$id]);

            // Update advance_amount in invoices table
            $stmtUp = $pdo->prepare("UPDATE invoices SET advance_amount = GREATEST(0.00, COALESCE(advance_amount, 0.00) - ?) WHERE id = ?");
            $stmtUp->execute([$amount, $invoiceId]);

            // Recalculate using the shared function
            recalculateInvoiceBalance($pdo, $invoiceId);

            $pdo->commit();
            sendJson(["status" => "success"]);

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
