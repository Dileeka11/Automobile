<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError("Method not allowed", 405);
}

try {
    // 1. VAT Returns (15% VAT on service charges of accepted quotations)
    $vatStmt = $pdo->query("
        SELECT 
            q.id as quotationId,
            c.name as customerName,
            CONCAT(v.make, ' ', v.model) as vehicleName,
            q.service_charge as serviceCharge,
            (q.service_charge * 0.15) as vatAmount,
            (q.service_charge * 1.15) as totalWithVat,
            q.created_at as date
        FROM quotations q
        JOIN vehicles v ON q.vehicle_id = v.id
        JOIN customers c ON v.customer_id = c.id
        WHERE q.status = 'Accepted'
        ORDER BY q.created_at DESC
    ");
    $vatReturns = $vatStmt->fetchAll();

    // 2. Sales Summary (Grouped by Month)
    $salesStmt = $pdo->query("
        SELECT 
            DATE_FORMAT(created_at, '%b %Y') as month,
            COUNT(*) as count,
            SUM(total_amount) as totalSales,
            SUM(advance_amount) as totalPaid
        FROM invoices
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY created_at ASC
    ");
    $salesSummary = $salesStmt->fetchAll();

    // 3. Expenses Summary (Grouped by Type)
    $expStmt = $pdo->query("
        SELECT 
            expense_type as category,
            SUM(amount) as totalAmount,
            COUNT(*) as count
        FROM expenses
        GROUP BY expense_type
    ");
    $expensesSummary = $expStmt->fetchAll();

    // 4. Net Profit Margins Per Vehicle
    $profitStmt = $pdo->query("
        SELECT 
            v.id as vehicleId,
            CONCAT(v.make, ' ', v.model) as vehicleName,
            v.chassis_number as chassisNumber,
            c.name as customerName,
            -- Total Revenue (Quotation Estimated Total)
            q.total_estimated as revenue,
            -- Base Costs
            (q.cif_value + q.tax_amount + q.clearing_amount) as baseCost,
            -- Additional Expenses
            COALESCE((SELECT SUM(amount) FROM expenses WHERE vehicle_id = v.id), 0) as additionalExpenses,
            -- Investor share
            COALESCE((SELECT SUM(profit_share_amount) FROM vehicle_investments WHERE vehicle_id = v.id), 0) as investorProfitShare,
            -- Calculation: Revenue - (Base Costs + Additional Expenses + Investor Share)
            (q.total_estimated - (q.cif_value + q.tax_amount + q.clearing_amount + COALESCE((SELECT SUM(amount) FROM expenses WHERE vehicle_id = v.id), 0) + COALESCE((SELECT SUM(profit_share_amount) FROM vehicle_investments WHERE vehicle_id = v.id), 0))) as netProfit
        FROM vehicles v
        JOIN customers c ON v.customer_id = c.id
        JOIN quotations q ON v.id = q.vehicle_id
        WHERE q.status = 'Accepted'
        ORDER BY q.created_at DESC
    ");
    $profitMargins = $profitStmt->fetchAll();

    sendJson([
        'vatReturns' => $vatReturns,
        'salesSummary' => $salesSummary,
        'expensesSummary' => $expensesSummary,
        'profitMargins' => $profitMargins
    ]);

} catch (Exception $e) {
    sendError($e->getMessage());
}
