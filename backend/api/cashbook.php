<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT id, expense_type AS expenseType, amount, description, date_incurred AS dateIncurred, created_at AS createdAt FROM cashbook_expenses ORDER BY date_incurred DESC, id DESC");
            sendJson($stmt->fetchAll());
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $expenseType = trim($data['expenseType'] ?? '');
        $amount = floatval($data['amount'] ?? 0);
        $description = trim($data['description'] ?? '');
        $dateIncurred = trim($data['dateIncurred'] ?? '');

        if (empty($expenseType) || $amount <= 0 || empty($dateIncurred)) {
            sendError("Expense Type, Amount, and Date are required");
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO cashbook_expenses (expense_type, amount, description, date_incurred) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $expenseType,
                $amount,
                $description,
                $dateIncurred
            ]);
            sendJson([
                'id' => (int)$pdo->lastInsertId(),
                'expenseType' => $expenseType,
                'amount' => $amount,
                'description' => $description,
                'dateIncurred' => $dateIncurred,
                'createdAt' => date('Y-m-d H:i:s')
            ], 210);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError("Expense ID is required");
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM cashbook_expenses WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
