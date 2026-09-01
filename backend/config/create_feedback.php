<?php
require_once __DIR__ . '/db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS site_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        city VARCHAR(120) NULL,
        rating TINYINT NOT NULL DEFAULT 5,
        message TEXT NOT NULL,
        is_approved TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_approved (is_approved)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "site_feedback table created successfully.\n";

    // Seed a few sample entries the first time only
    $count = (int)$pdo->query("SELECT COUNT(*) FROM site_feedback")->fetchColumn();
    if ($count === 0) {
        $demo = [
            ['Nuwan Sameera', 'Matara', 5, 1,
             'I imported a Toyota Yaris through D&N Automart and the whole process was smooth from start to finish. They gave me the exact landed cost before bidding, and the final invoice matched it to the rupee. The clearing was handled without me having to visit the port even once. Highly recommended for anyone importing their first vehicle.'],
            ['Chamari Perera', 'Colombo 07', 5, 1,
             'Very transparent pricing and constant updates on the shipment. I could track my car from the auction right up to the yard.'],
            ['Ruwan Silva', 'Kandy', 4, 1,
             'Good service and honest advice. They talked me out of a car with a bad auction grade and found me a better one the following week. Delivery took slightly longer than expected because of port congestion, but they kept me informed the whole time.'],
            ['Ishara Fernando', 'Galle', 5, 0,
             'The inspection report and yard pictures gave me a lot of confidence before paying the balance. Great team to work with.'],
        ];
        $stmt = $pdo->prepare("INSERT INTO site_feedback (name, city, rating, is_approved, message) VALUES (?, ?, ?, ?, ?)");
        foreach ($demo as $row) {
            $stmt->execute($row);
        }
        echo "Seeded " . count($demo) . " demo feedback entries.\n";
    } else {
        echo "Feedback rows already present — nothing seeded.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
