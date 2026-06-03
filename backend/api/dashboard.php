<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError("Method not allowed", 405);
}

try {
    // 1. Core KPIs
    $totalQuotations = $pdo->query("SELECT COUNT(*) FROM quotations")->fetchColumn();
    $totalInvoices = $pdo->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
    
    // Total Revenue is sum of total_amount of all invoices
    $totalRevenue = $pdo->query("SELECT SUM(total_amount) FROM invoices")->fetchColumn() ?: 0.00;
    
    $pendingInvoices = $pdo->query("SELECT COUNT(*) FROM invoices WHERE status = 'PENDING'")->fetchColumn();

    // 2. Recent Quotations
    $recentQStmt = $pdo->query("
        SELECT 
            q.id,
            c.name,
            CONCAT(v.make, ' ', v.model) as vehicleName,
            q.created_at as createdAt
        FROM quotations q
        JOIN vehicles v ON q.vehicle_id = v.id
        JOIN customers c ON v.customer_id = c.id
        ORDER BY q.created_at DESC
        LIMIT 5
    ");
    $recentQuotations = $recentQStmt->fetchAll();

    // 3. Recent Invoices
    $recentIStmt = $pdo->query("
        SELECT 
            i.id,
            i.balance,
            LOWER(i.status) as status,
            i.created_at as createdAt
        FROM invoices i
        ORDER BY i.created_at DESC
        LIMIT 5
    ");
    $recentInvoices = $recentIStmt->fetchAll();

    // 4. Sales Distribution by Make
    $makeStmt = $pdo->query("
        SELECT 
            v.make as name,
            COUNT(*) as value
        FROM quotations q
        JOIN vehicles v ON q.vehicle_id = v.id
        GROUP BY v.make
    ");
    $makeDistribution = $makeStmt->fetchAll();

    // 5. Monthly Activity (last 6 months)
    $months = [];
    for ($i = 5; $i >= 0; $i--) {
        $d = new DateInterval("P{$i}M");
        $date = (new DateTime())->sub($d);
        $key = $date->format('Y-m');
        $label = $date->format('M Y');
        $months[$key] = [
            'label' => $label,
            'quotations' => 0,
            'invoices' => 0
        ];
    }

    // Get monthly quotations counts
    $qMonthly = $pdo->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as cnt
        FROM quotations
        GROUP BY ym
    ")->fetchAll();
    foreach ($qMonthly as $row) {
        if (isset($months[$row['ym']])) {
            $months[$row['ym']]['quotations'] = (int)$row['cnt'];
        }
    }

    // Get monthly invoices counts
    $iMonthly = $pdo->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as cnt
        FROM invoices
        GROUP BY ym
    ")->fetchAll();
    foreach ($iMonthly as $row) {
        if (isset($months[$row['ym']])) {
            $months[$row['ym']]['invoices'] = (int)$row['cnt'];
        }
    }

    sendJson([
        'kpis' => [
            'totalQuotations' => (int)$totalQuotations,
            'totalInvoices' => (int)$totalInvoices,
            'totalRevenue' => (float)$totalRevenue,
            'pendingInvoices' => (int)$pendingInvoices
        ],
        'recentQuotations' => $recentQuotations,
        'recentInvoices' => $recentInvoices,
        'makeDistribution' => $makeDistribution,
        'monthlyActivity' => array_values($months)
    ]);

} catch (Exception $e) {
    sendError($e->getMessage());
}
