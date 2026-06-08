<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("
            SELECT 
                q.id,
                c.name,
                c.address,
                c.nic,
                c.phone as mobileNo,
                c.email,
                v.make_model_id as makeModelId,
                v.vehicle_model_id as vehicleModelId,
                q.cif_value as cifValue,
                q.lc_amount as lcAmount,
                q.tt_amount as ttAmount,
                q.tax_amount as taxAmount,
                q.clearing_amount as clearingCharge,
                q.service_charge as serviceCharge,
                q.mileage,
                q.dmi_charge as dmiCharge,
                q.created_at as createdAt,
                q.status
            FROM quotations q
            JOIN vehicles v ON q.vehicle_id = v.id
            JOIN customers c ON v.customer_id = c.id
            ORDER BY q.created_at DESC
        ");
        $rows = $stmt->fetchAll();
        $results = [];
        foreach ($rows as $row) {
            $results[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'address' => $row['address'],
                'nic' => $row['nic'],
                'mobileNo' => $row['mobileNo'],
                'email' => $row['email'],
                'makeModelId' => $row['makeModelId'],
                'vehicleModelId' => $row['vehicleModelId'],
                'cifValue' => (float)$row['cifValue'],
                'lcAmount' => (float)$row['lcAmount'],
                'ttAmount' => (float)$row['ttAmount'],
                'taxAmount' => (float)$row['taxAmount'],
                'clearingCharge' => (float)$row['clearingCharge'],
                'serviceCharge' => (float)$row['serviceCharge'],
                'mileage' => (int)$row['mileage'],
                'dmiCharge' => (float)$row['dmiCharge'],
                'createdAt' => $row['createdAt'],
                'status' => $row['status'],
            ];
        }
        sendJson($results);
        break;

    case 'POST':
        $data = getJsonInput();
        if (empty($data['nic']) || empty($data['name']) || empty($data['vehicleModelId'])) {
            sendError("Required fields missing");
        }

        try {
            $pdo->beginTransaction();

            // 1. Manage Customer
            $stmt = $pdo->prepare("SELECT id FROM customers WHERE nic = ?");
            $stmt->execute([$data['nic']]);
            $customerId = $stmt->fetchColumn();

            if (!$customerId) {
                $stmt = $pdo->prepare("INSERT INTO customers (name, phone, email, address, nic) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['name'],
                    $data['mobileNo'] ?? '',
                    $data['email'] ?? '',
                    $data['address'] ?? '',
                    $data['nic']
                ]);
                $customerId = $pdo->lastInsertId();
            } else {
                $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?");
                $stmt->execute([
                    $data['name'],
                    $data['mobileNo'] ?? '',
                    $data['email'] ?? '',
                    $data['address'] ?? '',
                    $customerId
                ]);
            }

            // 2. Fetch Vehicle Model Template Specs (for vehicle info only, not pricing)
            $stmt = $pdo->prepare("SELECT * FROM vehicle_models WHERE id = ?");
            $stmt->execute([$data['vehicleModelId']]);
            $vm = $stmt->fetch();
            if (!$vm) {
                throw new Exception("Vehicle model template not found");
            }

            // Fetch Make Model Name
            $stmt = $pdo->prepare("SELECT name FROM make_models WHERE id = ?");
            $stmt->execute([$vm['make_model_id']]);
            $makeName = $stmt->fetchColumn() ?: '';

            // 3. Create Vehicle Instance
            $stmt = $pdo->prepare("INSERT INTO vehicles (customer_id, make_model_id, vehicle_model_id, make, model, manufacture_year, grade, engine_capacity, mileage, color, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Inquiry')");
            $stmt->execute([
                $customerId,
                $vm['make_model_id'],
                $vm['id'],
                $makeName,
                $vm['name'],
                $vm['year'],
                $vm['grade'],
                $vm['engine_capacity'],
                $data['mileage'] ?? 0,
                $vm['color']
            ]);
            $vehicleId = $pdo->lastInsertId();

            // 4. Create Quotation with financial data from form
            $qId = $data['id'] ?? ('Q' . strtoupper(substr(uniqid(), -5)));
            $stmt = $pdo->prepare("INSERT INTO quotations (id, vehicle_id, cif_value, lc_amount, tt_amount, tax_amount, clearing_amount, service_charge, mileage, dmi_charge, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')");
            $stmt->execute([
                $qId,
                $vehicleId,
                $data['cifValue'] ?? 0,
                $data['lcAmount'] ?? 0,
                $data['ttAmount'] ?? 0,
                $data['taxAmount'] ?? 0,
                $data['clearingCharge'] ?? 0,
                $data['serviceCharge'] ?? 0,
                $data['mileage'] ?? 0,
                $data['dmiCharge'] ?? 0
            ]);

            // 5. Create associated Agreement
            $stmt = $pdo->prepare("INSERT INTO agreements (quotation_id, is_signed) VALUES (?, 0)");
            $stmt->execute([$qId]);

            $pdo->commit();

            // Return success response
            sendJson([
                'id' => $qId,
                'name' => $data['name'],
                'address' => $data['address'],
                'nic' => $data['nic'],
                'mobileNo' => $data['mobileNo'] ?? '',
                'email' => $data['email'] ?? '',
                'makeModelId' => $vm['make_model_id'],
                'vehicleModelId' => $vm['id'],
                'cifValue' => (float)($data['cifValue'] ?? 0),
                'lcAmount' => (float)($data['lcAmount'] ?? 0),
                'ttAmount' => (float)($data['ttAmount'] ?? 0),
                'taxAmount' => (float)($data['taxAmount'] ?? 0),
                'clearingCharge' => (float)($data['clearingCharge'] ?? 0),
                'serviceCharge' => (float)($data['serviceCharge'] ?? 0),
                'mileage' => (int)($data['mileage'] ?? 0),
                'dmiCharge' => (float)($data['dmiCharge'] ?? 0),
                'createdAt' => date('c')
            ]);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage());
        }
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Quotation ID is required");
        }
        $data = getJsonInput();

        try {
            $pdo->beginTransaction();

            // Fetch quotation and vehicle
            $stmt = $pdo->prepare("SELECT vehicle_id FROM quotations WHERE id = ?");
            $stmt->execute([$id]);
            $vehicleId = $stmt->fetchColumn();
            if (!$vehicleId) {
                throw new Exception("Quotation not found");
            }

            $stmt = $pdo->prepare("SELECT customer_id FROM vehicles WHERE id = ?");
            $stmt->execute([$vehicleId]);
            $customerId = $stmt->fetchColumn();

            // Update Customer details
            $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, nic = ? WHERE id = ?");
            $stmt->execute([
                $data['name'],
                $data['mobileNo'] ?? '',
                $data['email'] ?? '',
                $data['address'] ?? '',
                $data['nic'],
                $customerId
            ]);

            // Check if template vehicleModelId changed, if so update vehicle details
            if (!empty($data['vehicleModelId'])) {
                $stmt = $pdo->prepare("SELECT * FROM vehicle_models WHERE id = ?");
                $stmt->execute([$data['vehicleModelId']]);
                $vm = $stmt->fetch();
                if ($vm) {
                    $stmt = $pdo->prepare("SELECT name FROM make_models WHERE id = ?");
                    $stmt->execute([$vm['make_model_id']]);
                    $makeName = $stmt->fetchColumn() ?: '';

                    $stmt = $pdo->prepare("UPDATE vehicles SET make_model_id = ?, vehicle_model_id = ?, make = ?, model = ?, manufacture_year = ?, grade = ?, engine_capacity = ?, mileage = ?, color = ? WHERE id = ?");
                    $stmt->execute([
                        $vm['make_model_id'],
                        $vm['id'],
                        $makeName,
                        $vm['name'],
                        $vm['year'],
                        $vm['grade'],
                        $vm['engine_capacity'],
                        $data['mileage'] ?? 0,
                        $vm['color'],
                        $vehicleId
                    ]);
                }
            }

            // Update quotation financial values from form
            $stmt = $pdo->prepare("UPDATE quotations SET cif_value = ?, lc_amount = ?, tt_amount = ?, tax_amount = ?, clearing_amount = ?, service_charge = ?, mileage = ?, dmi_charge = ? WHERE id = ?");
            $stmt->execute([
                $data['cifValue'] ?? 0,
                $data['lcAmount'] ?? 0,
                $data['ttAmount'] ?? 0,
                $data['taxAmount'] ?? 0,
                $data['clearingCharge'] ?? 0,
                $data['serviceCharge'] ?? 0,
                $data['mileage'] ?? 0,
                $data['dmiCharge'] ?? 0,
                $id
            ]);

            $pdo->commit();
            sendJson($data);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage());
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Quotation ID is required");
        }

        try {
            // Retrieve vehicle_id before deleting
            $stmt = $pdo->prepare("SELECT vehicle_id FROM quotations WHERE id = ?");
            $stmt->execute([$id]);
            $vehicleId = $stmt->fetchColumn();

            if ($vehicleId) {
                $pdo->beginTransaction();
                // Deleting vehicle deletes quotation and agreement due to ON DELETE CASCADE
                $stmt = $pdo->prepare("DELETE FROM vehicles WHERE id = ?");
                $stmt->execute([$vehicleId]);
                $pdo->commit();
            }

            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage());
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
