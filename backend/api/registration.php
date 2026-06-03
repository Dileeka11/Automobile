<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $vehicleId = $_GET['vehicle_id'] ?? null;
        if (!$vehicleId) {
            sendError("Vehicle ID is required");
        }
        $stmt = $pdo->prepare("SELECT * FROM rmv_registrations WHERE vehicle_id = ?");
        $stmt->execute([$vehicleId]);
        $reg = $stmt->fetch();
        if (!$reg) {
            // Create default entry if not exists
            $stmt = $pdo->prepare("INSERT INTO rmv_registrations (vehicle_id, status) VALUES (?, 'Pending Documents')");
            $stmt->execute([$vehicleId]);
            $reg = [
                'id' => $pdo->lastInsertId(),
                'vehicle_id' => $vehicleId,
                'has_id_copy' => 0,
                'has_gs_certificate' => 0,
                'has_tin_certificate' => 0,
                'has_mt2_form' => 0,
                'registration_number' => null,
                'status' => 'Pending Documents'
            ];
        }
        // Format booleans
        $reg['has_id_copy'] = (bool)$reg['has_id_copy'];
        $reg['has_gs_certificate'] = (bool)$reg['has_gs_certificate'];
        $reg['has_tin_certificate'] = (bool)$reg['has_tin_certificate'];
        $reg['has_mt2_form'] = (bool)$reg['has_mt2_form'];
        sendJson($reg);
        break;

    case 'POST':
        $data = getJsonInput();
        $vehicleId = $data['vehicleId'] ?? null;
        if (!$vehicleId) {
            sendError("Vehicle ID is required");
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE rmv_registrations 
                SET has_id_copy = ?, has_gs_certificate = ?, has_tin_certificate = ?, has_mt2_form = ?, registration_number = ?, status = ?
                WHERE vehicle_id = ?
            ");
            $stmt->execute([
                isset($data['hasIdCopy']) ? (int)$data['hasIdCopy'] : 0,
                isset($data['hasGsCertificate']) ? (int)$data['hasGsCertificate'] : 0,
                isset($data['hasTinCertificate']) ? (int)$data['hasTinCertificate'] : 0,
                isset($data['hasMt2Form']) ? (int)$data['hasMt2Form'] : 0,
                $data['registrationNumber'] ?? null,
                $data['status'] ?? 'Pending Documents',
                $vehicleId
            ]);

            // If status is completed, update vehicle status to 'Registered' or 'Delivered'
            if (($data['status'] ?? '') === 'Completed') {
                $stmt = $pdo->prepare("UPDATE vehicles SET status = 'Registered' WHERE id = ?");
                $stmt->execute([$vehicleId]);
            }

            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
