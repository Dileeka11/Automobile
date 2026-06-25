<?php
require_once __DIR__ . '/../config/db.php';

// Save an uploaded clearing document and return its stored DB path (or null).
function saveInvoiceUpload($fileKey, $prefix, $id) {
    if (empty($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) return null;
    $dir = __DIR__ . '/../uploads/documents/';
    if (!file_exists($dir)) mkdir($dir, 0777, true);
    $ext = pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION);
    $fileName = $prefix . '_' . $id . '_' . time() . '.' . $ext;
    if (move_uploaded_file($_FILES[$fileKey]['tmp_name'], $dir . $fileName)) {
        return 'backend/uploads/documents/' . $fileName;
    }
    return null;
}

// Fetch the user-defined custom clearing documents for an invoice.
function getCustomDocuments($pdo, $invoiceId) {
    $stmt = $pdo->prepare("SELECT id, doc_type, file_path FROM invoice_documents WHERE invoice_id = ? ORDER BY created_at ASC");
    $stmt->execute([$invoiceId]);
    $docs = [];
    foreach ($stmt->fetchAll() as $d) {
        $docs[] = ['id' => (int)$d['id'], 'docType' => $d['doc_type'], 'filePath' => $d['file_path']];
    }
    return $docs;
}

// Delete a clearing document column's file + clear it when the given delete flag is set.
function deleteInvoiceDoc($pdo, $id, $column, $flag) {
    if (empty($_POST[$flag])) return;
    $sel = $pdo->prepare("SELECT $column FROM invoices WHERE id = ?");
    $sel->execute([$id]);
    $path = $sel->fetchColumn();
    if ($path) {
        $full = __DIR__ . '/../' . str_replace('backend/', '', $path);
        if (file_exists($full)) unlink($full);
    }
    $pdo->prepare("UPDATE invoices SET $column = NULL WHERE id = ?")->execute([$id]);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT i.*, COALESCE((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id), 0.00) AS tt_amount FROM invoices i ORDER BY i.created_at DESC");
        $results = [];
        foreach ($stmt->fetchAll() as $row) {
            // Fetch yard pictures for this invoice
            $picStmt = $pdo->prepare("SELECT id, file_path FROM invoice_yard_pictures WHERE invoice_id = ?");
            $picStmt->execute([$row['id']]);
            $yardPictures = $picStmt->fetchAll();

            $results[] = [
                'id' => $row['id'],
                'quotationId' => $row['quotation_id'],
                'ttAmount' => (float)$row['tt_amount'],
                'advanceAmount' => (float)$row['advance_amount'],
                'balance' => (float)$row['balance'],
                'isLcComplete' => (bool)$row['is_lc_complete'],
                'lcNumber' => $row['lc_number'],
                'lcOpenType' => $row['lc_open_type'],
                'isTtComplete' => (bool)$row['is_tt_complete'],
                'status' => strtolower($row['status']),
                'lcCopyPath' => $row['lc_copy_path'],
                'inspectionCertificatePath' => $row['inspection_certificate_path'],
                'exportCertificatePath' => $row['export_certificate_path'] ?? null,
                'transferDocumentPath' => $row['transfer_document_path'] ?? null,
                'customsDocumentPath' => $row['customs_document_path'] ?? null,
                'etdDate' => $row['etd_date'],
                'arrivalDate' => $row['arrival_date'],
                'yardPictures' => $yardPictures,
                'customDocuments' => getCustomDocuments($pdo, $row['id']),
                'createdAt' => $row['created_at']
            ];
        }
        sendJson($results);
        break;

    case 'POST':
        $id = $_GET['id'] ?? null;
        if ($id) {
            // --- This is a POST-based UPDATE to support multipart/form-data file uploads ---
            try {
                $lcCopyPath = null;
                if (!empty($_FILES['lcCopy']) && $_FILES['lcCopy']['error'] === UPLOAD_ERR_OK) {
                    $dir = __DIR__ . '/../uploads/documents/';
                    if (!file_exists($dir)) mkdir($dir, 0777, true);
                    $ext = pathinfo($_FILES['lcCopy']['name'], PATHINFO_EXTENSION);
                    $fileName = 'lc_' . $id . '_' . time() . '.' . $ext;
                    if (move_uploaded_file($_FILES['lcCopy']['tmp_name'], $dir . $fileName)) {
                        $lcCopyPath = 'backend/uploads/documents/' . $fileName;
                    }
                }

                $insCertPath = null;
                if (!empty($_FILES['inspectionCertificate']) && $_FILES['inspectionCertificate']['error'] === UPLOAD_ERR_OK) {
                    $dir = __DIR__ . '/../uploads/documents/';
                    if (!file_exists($dir)) mkdir($dir, 0777, true);
                    $ext = pathinfo($_FILES['inspectionCertificate']['name'], PATHINFO_EXTENSION);
                    $fileName = 'ic_' . $id . '_' . time() . '.' . $ext;
                    if (move_uploaded_file($_FILES['inspectionCertificate']['tmp_name'], $dir . $fileName)) {
                        $insCertPath = 'backend/uploads/documents/' . $fileName;
                    }
                }

                // Clearing documents
                $exportCertPath = saveInvoiceUpload('exportCertificate', 'export', $id);
                $transferDocPath = saveInvoiceUpload('transferDocument', 'transfer', $id);
                $customsDocPath = saveInvoiceUpload('customsDocument', 'customs', $id);

                if (!empty($_FILES['yardPictures'])) {
                    $files = $_FILES['yardPictures'];
                    $dir = __DIR__ . '/../uploads/documents/';
                    if (!file_exists($dir)) mkdir($dir, 0777, true);
                    
                    if (is_array($files['name'])) {
                        for ($i = 0; $i < count($files['name']); $i++) {
                            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                                $ext = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
                                $fileName = 'yard_' . $id . '_' . $i . '_' . time() . '.' . $ext;
                                if (move_uploaded_file($files['tmp_name'][$i], $dir . $fileName)) {
                                    $dbPath = 'backend/uploads/documents/' . $fileName;
                                    $picStmt = $pdo->prepare("INSERT INTO invoice_yard_pictures (invoice_id, file_path) VALUES (?, ?)");
                                    $picStmt->execute([$id, $dbPath]);
                                }
                            }
                        }
                    } else {
                        if ($files['error'] === UPLOAD_ERR_OK) {
                            $ext = pathinfo($files['name'], PATHINFO_EXTENSION);
                            $fileName = 'yard_' . $id . '_' . time() . '.' . $ext;
                            if (move_uploaded_file($files['tmp_name'], $dir . $fileName)) {
                                $dbPath = 'backend/uploads/documents/' . $fileName;
                                $picStmt = $pdo->prepare("INSERT INTO invoice_yard_pictures (invoice_id, file_path) VALUES (?, ?)");
                                $picStmt->execute([$id, $dbPath]);
                            }
                        }
                    }
                }

                // Delete yard pictures if requested
                if (!empty($_POST['deleteYardPictureIds'])) {
                    $delIds = explode(',', $_POST['deleteYardPictureIds']);
                    foreach ($delIds as $delId) {
                        $delId = (int)trim($delId);
                        if ($delId > 0) {
                            $selStmt = $pdo->prepare("SELECT file_path FROM invoice_yard_pictures WHERE id = ? AND invoice_id = ?");
                            $selStmt->execute([$delId, $id]);
                            $delPath = $selStmt->fetchColumn();
                            if ($delPath) {
                                $fullPath = __DIR__ . '/../' . str_replace('backend/', '', $delPath);
                                if (file_exists($fullPath)) unlink($fullPath);
                                $delStmt = $pdo->prepare("DELETE FROM invoice_yard_pictures WHERE id = ?");
                                $delStmt->execute([$delId]);
                            }
                        }
                    }
                }

                // Delete LC Copy if requested
                if (!empty($_POST['deleteLcCopy'])) {
                    $selStmt = $pdo->prepare("SELECT lc_copy_path FROM invoices WHERE id = ?");
                    $selStmt->execute([$id]);
                    $delPath = $selStmt->fetchColumn();
                    if ($delPath) {
                        $fullPath = __DIR__ . '/../' . str_replace('backend/', '', $delPath);
                        if (file_exists($fullPath)) unlink($fullPath);
                    }
                    $upStmt = $pdo->prepare("UPDATE invoices SET lc_copy_path = NULL WHERE id = ?");
                    $upStmt->execute([$id]);
                }

                // Delete Inspection Certificate if requested
                if (!empty($_POST['deleteInspectionCertificate'])) {
                    $selStmt = $pdo->prepare("SELECT inspection_certificate_path FROM invoices WHERE id = ?");
                    $selStmt->execute([$id]);
                    $delPath = $selStmt->fetchColumn();
                    if ($delPath) {
                        $fullPath = __DIR__ . '/../' . str_replace('backend/', '', $delPath);
                        if (file_exists($fullPath)) unlink($fullPath);
                    }
                    $upStmt = $pdo->prepare("UPDATE invoices SET inspection_certificate_path = NULL WHERE id = ?");
                    $upStmt->execute([$id]);
                }

                // Delete clearing documents if requested
                deleteInvoiceDoc($pdo, $id, 'export_certificate_path', 'deleteExportCertificate');
                deleteInvoiceDoc($pdo, $id, 'transfer_document_path', 'deleteTransferDocument');
                deleteInvoiceDoc($pdo, $id, 'customs_document_path', 'deleteCustomsDocument');

                $fields = [];
                $params = [];

                $currentBalance = isset($_POST['balance']) ? (float)$_POST['balance'] : null;
                $currentStatus = isset($_POST['status']) ? strtoupper($_POST['status']) : null;

                if ($currentBalance !== null && $currentBalance <= 0) {
                    $currentStatus = 'PAID';
                }

                if ($currentStatus !== null) {
                    $fields[] = "status = ?";
                    $params[] = $currentStatus;
                }
                if (isset($_POST['advanceAmount'])) {
                    $fields[] = "advance_amount = ?";
                    $params[] = (float)$_POST['advanceAmount'];
                }
                if ($currentBalance !== null) {
                    $fields[] = "balance = ?";
                    $params[] = $currentBalance;
                }
                if (isset($_POST['isLcComplete'])) {
                    $fields[] = "is_lc_complete = ?";
                    $params[] = filter_var($_POST['isLcComplete'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
                }
                if (isset($_POST['lcNumber'])) {
                    $fields[] = "lc_number = ?";
                    $params[] = empty($_POST['lcNumber']) ? null : $_POST['lcNumber'];
                }
                if (isset($_POST['lcOpenType'])) {
                    $fields[] = "lc_open_type = ?";
                    $params[] = empty($_POST['lcOpenType']) ? null : $_POST['lcOpenType'];
                }
                if (isset($_POST['isTtComplete'])) {
                    $fields[] = "is_tt_complete = ?";
                    $params[] = filter_var($_POST['isTtComplete'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
                }
                if (isset($_POST['etdDate'])) {
                    $fields[] = "etd_date = ?";
                    $params[] = empty($_POST['etdDate']) ? null : $_POST['etdDate'];
                }
                if (isset($_POST['arrivalDate'])) {
                    $fields[] = "arrival_date = ?";
                    $params[] = empty($_POST['arrivalDate']) ? null : $_POST['arrivalDate'];
                }
                if ($lcCopyPath) {
                    $fields[] = "lc_copy_path = ?";
                    $params[] = $lcCopyPath;
                }
                if ($insCertPath) {
                    $fields[] = "inspection_certificate_path = ?";
                    $params[] = $insCertPath;
                }
                if ($exportCertPath) {
                    $fields[] = "export_certificate_path = ?";
                    $params[] = $exportCertPath;
                }
                if ($transferDocPath) {
                    $fields[] = "transfer_document_path = ?";
                    $params[] = $transferDocPath;
                }
                if ($customsDocPath) {
                    $fields[] = "customs_document_path = ?";
                    $params[] = $customsDocPath;
                }

                if (count($fields) > 0) {
                    $params[] = $id;
                    $sql = "UPDATE invoices SET " . implode(", ", $fields) . " WHERE id = ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                }

                // Fetch updated invoice
                $stmt = $pdo->prepare("SELECT i.*, COALESCE((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id), 0.00) AS tt_amount FROM invoices i WHERE i.id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();

                $picStmt = $pdo->prepare("SELECT id, file_path FROM invoice_yard_pictures WHERE invoice_id = ?");
                $picStmt->execute([$id]);
                $yardPictures = $picStmt->fetchAll();

                sendJson([
                    'id' => $row['id'],
                    'quotationId' => $row['quotation_id'],
                    'ttAmount' => (float)$row['tt_amount'],
                    'advanceAmount' => (float)$row['advance_amount'],
                    'balance' => (float)$row['balance'],
                    'isLcComplete' => (bool)$row['is_lc_complete'],
                    'lcNumber' => $row['lc_number'],
                    'lcOpenType' => $row['lc_open_type'],
                    'isTtComplete' => (bool)$row['is_tt_complete'],
                    'status' => strtolower($row['status']),
                    'lcCopyPath' => $row['lc_copy_path'],
                    'inspectionCertificatePath' => $row['inspection_certificate_path'],
                    'exportCertificatePath' => $row['export_certificate_path'] ?? null,
                    'transferDocumentPath' => $row['transfer_document_path'] ?? null,
                    'customsDocumentPath' => $row['customs_document_path'] ?? null,
                    'etdDate' => $row['etd_date'],
                    'arrivalDate' => $row['arrival_date'],
                    'yardPictures' => $yardPictures,
                    'customDocuments' => getCustomDocuments($pdo, $row['id']),
                    'createdAt' => $row['created_at']
                ]);

            } catch (Exception $e) {
                sendError($e->getMessage());
            }
            break;
        }

        // --- Standard Normal Create Invoice ---
        $data = getJsonInput();
        if (empty($data['quotationId'])) {
            sendError("Quotation ID is required");
        }

        try {
            $stmt = $pdo->prepare("SELECT vehicle_id FROM quotations WHERE id = ?");
            $stmt->execute([$data['quotationId']]);
            $vehicleId = $stmt->fetchColumn();

            if (!$vehicleId) {
                throw new Exception("Quotation not found");
            }

            $id = $data['id'] ?? ('INV' . strtoupper(substr(uniqid(), -5)));
            $dueDate = date('Y-m-d', strtotime('+3 days'));
            $status = strtoupper($data['status'] ?? 'PENDING');

            $stmt = $pdo->prepare("INSERT INTO invoices (id, vehicle_id, quotation_id, invoice_type, total_amount, tt_amount, advance_amount, balance, is_lc_complete, lc_number, lc_open_type, is_tt_complete, due_date, status, etd_date, arrival_date) VALUES (?, ?, ?, 'Advance', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
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
                $data['lcNumber'] ?? null,
                $data['lcOpenType'] ?? null,
                isset($data['isTtComplete']) ? ($data['isTtComplete'] ? 1 : 0) : 0,
                $dueDate,
                $status,
                empty($data['etdDate']) ? null : $data['etdDate'],
                empty($data['arrivalDate']) ? null : $data['arrivalDate']
            ]);

            sendJson([
                'id' => $id,
                'quotationId' => $data['quotationId'],
                'ttAmount' => (float)($data['ttAmount'] ?? 0),
                'advanceAmount' => (float)($data['advanceAmount'] ?? 0),
                'balance' => (float)($data['balance'] ?? 0),
                'isLcComplete' => isset($data['isLcComplete']) ? (bool)$data['isLcComplete'] : false,
                'lcNumber' => $data['lcNumber'] ?? null,
                'lcOpenType' => $data['lcOpenType'] ?? null,
                'isTtComplete' => isset($data['isTtComplete']) ? (bool)$data['isTtComplete'] : false,
                'status' => strtolower($status),
                'lcCopyPath' => null,
                'inspectionCertificatePath' => null,
                'exportCertificatePath' => null,
                'transferDocumentPath' => null,
                'customsDocumentPath' => null,
                'etdDate' => $data['etdDate'] ?? null,
                'arrivalDate' => $data['arrivalDate'] ?? null,
                'yardPictures' => [],
                'customDocuments' => [],
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
            $fields = [];
            $params = [];

            $currentBalance = isset($data['balance']) ? (float)$data['balance'] : null;
            $currentStatus = isset($data['status']) ? strtoupper($data['status']) : null;

            if ($currentBalance !== null && $currentBalance <= 0) {
                $currentStatus = 'PAID';
            }

            if ($currentStatus !== null) {
                $fields[] = "status = ?";
                $params[] = $currentStatus;
            }
            if (isset($data['advanceAmount'])) {
                $fields[] = "advance_amount = ?";
                $params[] = $data['advanceAmount'];
            }
            if ($currentBalance !== null) {
                $fields[] = "balance = ?";
                $params[] = $currentBalance;
            }
            if (isset($data['isLcComplete'])) {
                $fields[] = "is_lc_complete = ?";
                $params[] = $data['isLcComplete'] ? 1 : 0;
            }
            if (isset($data['lcNumber'])) {
                $fields[] = "lc_number = ?";
                $params[] = empty($data['lcNumber']) ? null : $data['lcNumber'];
            }
            if (isset($data['lcOpenType'])) {
                $fields[] = "lc_open_type = ?";
                $params[] = empty($data['lcOpenType']) ? null : $data['lcOpenType'];
            }
            if (isset($data['isTtComplete'])) {
                $fields[] = "is_tt_complete = ?";
                $params[] = $data['isTtComplete'] ? 1 : 0;
            }
            if (isset($data['etdDate'])) {
                $fields[] = "etd_date = ?";
                $params[] = empty($data['etdDate']) ? null : $data['etdDate'];
            }
            if (isset($data['arrivalDate'])) {
                $fields[] = "arrival_date = ?";
                $params[] = empty($data['arrivalDate']) ? null : $data['arrivalDate'];
            }

            if (count($fields) > 0) {
                $params[] = $id;
                $sql = "UPDATE invoices SET " . implode(", ", $fields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            // Fetch updated invoice
            $stmt = $pdo->prepare("SELECT i.*, COALESCE((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id), 0.00) AS tt_amount FROM invoices i WHERE i.id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();

            $picStmt = $pdo->prepare("SELECT id, file_path FROM invoice_yard_pictures WHERE invoice_id = ?");
            $picStmt->execute([$id]);
            $yardPictures = $picStmt->fetchAll();

            sendJson([
                'id' => $row['id'],
                'quotationId' => $row['quotation_id'],
                'ttAmount' => (float)$row['tt_amount'],
                'advanceAmount' => (float)$row['advance_amount'],
                'balance' => (float)$row['balance'],
                'isLcComplete' => (bool)$row['is_lc_complete'],
                'lcNumber' => $row['lc_number'],
                'lcOpenType' => $row['lc_open_type'],
                'isTtComplete' => (bool)$row['is_tt_complete'],
                'status' => strtolower($row['status']),
                'lcCopyPath' => $row['lc_copy_path'],
                'inspectionCertificatePath' => $row['inspection_certificate_path'],
                'exportCertificatePath' => $row['export_certificate_path'] ?? null,
                'transferDocumentPath' => $row['transfer_document_path'] ?? null,
                'customsDocumentPath' => $row['customs_document_path'] ?? null,
                'etdDate' => $row['etd_date'],
                'arrivalDate' => $row['arrival_date'],
                'yardPictures' => $yardPictures,
                'customDocuments' => getCustomDocuments($pdo, $row['id']),
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
        
        // Fetch files to delete them from folder
        $stmt = $pdo->prepare("SELECT lc_copy_path, inspection_certificate_path, export_certificate_path, transfer_document_path, customs_document_path FROM invoices WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row) {
            foreach (['lc_copy_path', 'inspection_certificate_path', 'export_certificate_path', 'transfer_document_path', 'customs_document_path'] as $pathCol) {
                if (!empty($row[$pathCol])) {
                    $fullPath = __DIR__ . '/../' . str_replace('backend/', '', $row[$pathCol]);
                    if (file_exists($fullPath)) unlink($fullPath);
                }
            }
        }
        
        $picsStmt = $pdo->prepare("SELECT file_path FROM invoice_yard_pictures WHERE invoice_id = ?");
        $picsStmt->execute([$id]);
        foreach ($picsStmt->fetchAll() as $pic) {
            $fullPath = __DIR__ . '/../' . str_replace('backend/', '', $pic['file_path']);
            if (file_exists($fullPath)) unlink($fullPath);
        }

        $stmt = $pdo->prepare("DELETE FROM invoices WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(["status" => "success"]);
        break;

    default:
        sendError("Method not allowed", 405);
}
