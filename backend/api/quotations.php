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
                q.service_charge as serviceCharge,
                q.created_at as createdAt,
                q.status
            FROM quotations q
            JOIN vehicles v ON q.vehicle_id = v.id
            JOIN customers c ON v.customer_id = c.id
            ORDER BY q.created_at DESC
        ");
        sendJson($stmt->fetchAll());
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

            // 2. Fetch Vehicle Model Template Specs
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
                $vm['mileage'],
                $vm['color']
            ]);
            $vehicleId = $pdo->lastInsertId();

            // 4. Create Quotation
            $qId = $data['id'] ?? ('Q' . strtoupper(substr(uniqid(), -5)));
            $stmt = $pdo->prepare("INSERT INTO quotations (id, vehicle_id, cif_value, lc_amount, tt_amount, tax_amount, clearing_amount, service_charge, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft')");
            $stmt->execute([
                $qId,
                $vehicleId,
                $vm['cif_value'],
                $vm['lc_amount'],
                $vm['tt_amount'],
                $vm['tax_amount'],
                $vm['clearing_charge'],
                $vm['service_charge']
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
                        $vm['mileage'],
                        $vm['color'],
                        $vehicleId
                    ]);

                    // Update quotation values to freeze new pricing
                    $stmt = $pdo->prepare("UPDATE quotations SET cif_value = ?, lc_amount = ?, tt_amount = ?, tax_amount = ?, clearing_amount = ?, service_charge = ? WHERE id = ?");
                    $stmt->execute([
                        $vm['cif_value'],
                        $vm['lc_amount'],
                        $vm['tt_amount'],
                        $vm['tax_amount'],
                        $vm['clearing_charge'],
                        $vm['service_charge'],
                        $id
                    ]);
                }
            }

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
