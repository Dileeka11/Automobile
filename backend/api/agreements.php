<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $quotationId = $_GET['quotation_id'] ?? null;
        if (!$quotationId) {
            sendError("Quotation ID is required");
        }
        $stmt = $pdo->prepare("SELECT * FROM agreements WHERE quotation_id = ?");
        $stmt->execute([$quotationId]);
        $agreement = $stmt->fetch();
        if (!$agreement) {
            // Auto create agreement draft if not exists
            $stmt = $pdo->prepare("INSERT INTO agreements (quotation_id, is_signed) VALUES (?, 0)");
            $stmt->execute([$quotationId]);
            $agreement = [
                'id' => $pdo->lastInsertId(),
                'quotation_id' => $quotationId,
                'signed_date' => null,
                'signature_file_path' => null,
                'is_signed' => 0
            ];
        }
        sendJson($agreement);
        break;

    case 'POST':
        // Accept signature base64 or file upload
        $data = getJsonInput();
        $quotationId = $data['quotationId'] ?? null;
        $signatureBase64 = $data['signatureBase64'] ?? null; // format: "data:image/png;base64,..."

        if (!$quotationId) {
            sendError("Quotation ID is required");
        }

        try {
            $filePath = null;
            if ($signatureBase64) {
                // Ensure upload directories exist
                $dir = __DIR__ . '/../uploads/signatures/';
                if (!file_exists($dir)) {
                    mkdir($dir, 0777, true);
                }

                // Decode base64 PNG image
                $image_parts = explode(";base64,", $signatureBase64);
                $image_type_aux = explode("image/", $image_parts[0]);
                $image_type = $image_type_aux[1];
                $image_base64 = base64_decode($image_parts[1]);
                $fileName = 'sig_' . $quotationId . '_' . time() . '.' . $image_type;
                $file = $dir . $fileName;
                file_put_contents($file, $image_base64);
                $filePath = 'backend/uploads/signatures/' . $fileName;
            }

            // Update agreements
            $stmt = $pdo->prepare("UPDATE agreements SET signed_date = CURRENT_DATE(), signature_file_path = ?, is_signed = 1 WHERE quotation_id = ?");
            $stmt->execute([$filePath, $quotationId]);

            // Update vehicle status to 'Ordered'
            $stmt = $pdo->prepare("
                UPDATE vehicles v 
                JOIN quotations q ON v.id = q.vehicle_id 
                SET v.status = 'Ordered' 
                WHERE q.id = ?
            ");
            $stmt->execute([$quotationId]);

            // Auto create an Advance Invoice when agreement is signed!
            // First find vehicle_id and quotation details
            $stmt = $pdo->prepare("
                SELECT q.vehicle_id, q.cif_value, q.tax_amount, q.clearing_amount, q.service_charge, q.tt_amount
                FROM quotations q
                WHERE q.id = ?
            ");
            $stmt->execute([$quotationId]);
            $qInfo = $stmt->fetch();

            if ($qInfo) {
                $vehicleId = $qInfo['vehicle_id'];
                // Check if advance invoice already exists
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM invoices WHERE vehicle_id = ? AND invoice_type = 'Advance'");
                $stmt->execute([$vehicleId]);
                if ($stmt->fetchColumn() == 0) {
                    $invId = 'INV' . strtoupper(substr(uniqid(), -5));
                    $totalCost = $qInfo['cif_value'] + $qInfo['tax_amount'] + $qInfo['clearing_amount'] + $qInfo['service_charge'];
                    // Advance payment typically 40% or 50%, let's make it 50% or full estimated minus service charge
                    $advanceAmount = $totalCost * 0.5; 
                    $dueDate = date('Y-m-d', strtotime('+3 days'));

                    $stmt = $pdo->prepare("INSERT INTO invoices (id, vehicle_id, invoice_type, total_amount, due_date, status) VALUES (?, ?, 'Advance', ?, ?, 'Pending')");
                    $stmt->execute([$invId, $vehicleId, $totalCost, $dueDate]);
                }
            }

            sendJson([
                'status' => 'success',
                'signature_file_path' => $filePath
            ]);

        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
