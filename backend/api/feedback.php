<?php
require_once __DIR__ . '/../config/db.php';

// Visitor feedback. Anything submitted from the public site starts unapproved;
// only approved rows are shown on the landing page.

function mapFeedback($row) {
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'city' => $row['city'],
        'rating' => (int)$row['rating'],
        'message' => $row['message'],
        'isApproved' => (bool)(int)$row['is_approved'],
        'createdAt' => $row['created_at'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // status: approved (default, public) | pending | all
        $status = $_GET['status'] ?? 'approved';
        try {
            if ($status === 'pending') {
                $sql = "SELECT * FROM site_feedback WHERE is_approved = 0 ORDER BY created_at DESC, id DESC";
            } elseif ($status === 'all') {
                $sql = "SELECT * FROM site_feedback ORDER BY created_at DESC, id DESC";
            } else {
                $sql = "SELECT * FROM site_feedback WHERE is_approved = 1 ORDER BY created_at DESC, id DESC";
            }
            sendJson(array_map('mapFeedback', $pdo->query($sql)->fetchAll()));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');
        $city = trim($data['city'] ?? '');
        $message = trim($data['message'] ?? '');
        $rating = (int)($data['rating'] ?? 5);

        if ($name === '' || $message === '') {
            sendError("Name and feedback message are required");
        }
        if (mb_strlen($name) > 150) {
            sendError("Name must be 150 characters or fewer");
        }
        if (mb_strlen($message) > 2000) {
            sendError("Feedback must be 2000 characters or fewer");
        }
        if ($rating < 1 || $rating > 5) {
            $rating = 5;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO site_feedback (name, city, rating, message, is_approved) VALUES (?, ?, ?, ?, 0)");
            $stmt->execute([$name, $city, $rating, $message]);
            sendJson([
                'id' => (int)$pdo->lastInsertId(),
                'status' => 'pending',
                'message' => 'Thank you! Your feedback will appear once it is approved.',
            ], 201);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'PUT':
        // Approve / unpublish
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendError("Feedback ID is required");
        }
        $data = getJsonInput();
        $isApproved = !empty($data['isApproved']) ? 1 : 0;

        try {
            $stmt = $pdo->prepare("UPDATE site_feedback SET is_approved = ? WHERE id = ?");
            $stmt->execute([$isApproved, $id]);

            $get = $pdo->prepare("SELECT * FROM site_feedback WHERE id = ?");
            $get->execute([$id]);
            $row = $get->fetch();
            if (!$row) {
                sendError("Feedback not found", 404);
            }
            sendJson(mapFeedback($row));
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendError("Feedback ID is required");
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM site_feedback WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(["status" => "success"]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed", 405);
}
