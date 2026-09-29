<?php
require_once __DIR__ . '/../config/db.php';

// entry_type separates manually added revenue from expenses. Added on demand so a
// deploy without running the migration still works (not in db.php: the deploy never uploads it).
try {
    if (!$pdo->query("SHOW COLUMNS FROM cashbook_expenses LIKE 'entry_type'")->fetch()) {
        $pdo->exec("ALTER TABLE cashbook_expenses ADD COLUMN entry_type VARCHAR(20) NOT NULL DEFAULT 'expense' AFTER id");
    }
} catch (Exception $e) {
    error_log('cashbook entry_type: ' . $e->getMessage());
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT id, entry_type AS entryType, expense_type AS expenseType, amount, description, date_incurred AS dateIncurred, created_at AS createdAt FROM cashbook_expenses ORDER BY date_incurred DESC, id DESC");
            sendJson($stmt->fetchAll());
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $entryType = ($data['entryType'] ?? 'expense') === 'revenue' ? 'revenue' : 'expense';
        $expenseType = trim($data['expenseType'] ?? '');
        $amount = floatval($data['amount'] ?? 0);
        $description = trim($data['description'] ?? '');
        $dateIncurred = trim($data['dateIncurred'] ?? '');

        if (empty($expenseType) || $amount <= 0 || empty($dateIncurred)) {
            sendError("Category, Amount, and Date are required");
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO cashbook_expenses (entry_type, expense_type, amount, description, date_incurred) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $entryType,
                $expenseType,
                $amount,
                $description,
                $dateIncurred
            ]);
            sendJson([
                'id' => (int)$pdo->lastInsertId(),
                'entryType' => $entryType,
                'expenseType' => $expenseType,
                'amount' => $amount,
                'description' => $description,
                'dateIncurred' => $dateIncurred,
                'createdAt' => date('Y-m-d H:i:s')
            ], 201);
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
