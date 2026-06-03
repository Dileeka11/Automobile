<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Retrieve logistics info for all ordered/shipped/clearing/registered vehicles
        $stmt = $pdo->query("
            SELECT 
                v.id as vehicleId,
                v.chassis_number as chassisNumber,
                v.status as vehicleStatus,
                c.name as customerName,
                c.phone as customerPhone,
                v.make,
                v.model,
                v.manufacture_year as year,
                v.color,
                l.id as logisticsId,
                l.shipping_company as shippingCompany,
                l.vessel_name as vesselName,
                l.etd,
                l.eta,
                l.port_of_loading as portOfLoading,
                l.port_of_discharge as portOfDischarge
            FROM vehicles v
            JOIN customers c ON v.customer_id = c.id
            LEFT JOIN logistics l ON v.id = l.vehicle_id
            WHERE v.status IN ('Ordered', 'Shipped', 'Clearing', 'Registered', 'Delivered')
            ORDER BY v.created_at DESC
        ");
        sendJson($stmt->fetchAll());
        break;

    case 'POST':
        $data = getJsonInput();
        $vehicleId = $data['vehicleId'] ?? null;
        if (!$vehicleId) {
            sendError("Vehicle ID is required");
        }

        try {
            $pdo->beginTransaction();

            // 1. Update vehicle status if provided
            if (!empty($data['vehicleStatus'])) {
                $stmt = $pdo->prepare("UPDATE vehicles SET status = ? WHERE id = ?");
                $stmt->execute([$data['vehicleStatus'], $vehicleId]);
            }

            // 2. Check if logistics row exists
            $stmt = $pdo->prepare("SELECT id FROM logistics WHERE vehicle_id = ?");
            $stmt->execute([$vehicleId]);
            $logisticsId = $stmt->fetchColumn();

            if (!$logisticsId) {
                $stmt = $pdo->prepare("INSERT INTO logistics (vehicle_id, shipping_company, vessel_name, etd, eta, port_of_loading, port_of_discharge) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $vehicleId,
                    $data['shippingCompany'] ?? null,
                    $data['vesselName'] ?? null,
                    $data['etd'] ?: null,
                    $data['eta'] ?: null,
                    $data['portOfLoading'] ?? null,
                    $data['portOfDischarge'] ?? null
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE logistics SET shipping_company = ?, vessel_name = ?, etd = ?, eta = ?, port_of_loading = ?, port_of_discharge = ? WHERE vehicle_id = ?");
                $stmt->execute([
                    $data['shippingCompany'] ?? null,
                    $data['vesselName'] ?? null,
                    $data['etd'] ?: null,
                    $data['eta'] ?: null,
                    $data['portOfLoading'] ?? null,
                    $data['portOfDischarge'] ?? null,
                    $vehicleId
                ]);
            }

            $pdo->commit();
            sendJson(["status" => "success"]);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage());
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
