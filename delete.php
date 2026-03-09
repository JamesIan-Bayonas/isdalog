<?php
/*
 * File: delete.php
 * Feature: Delete a catch record
 * Security: Uses Prepared Statements to prevent SQL Injection
 */

require_once 'includes/db_connect.php';

// Security Check: Ensure an ID is provided and is a number
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    
    $id = $_GET['id'];

    try {
        // Prepare the DELETE Statement
        // Strict Rule #5: Must use prepared statements
        $sql = "DELETE FROM catches WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        
        // Bind and Execute
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            // Success: Redirect back to dashboard with a message
            header("Location: index.php?status=deleted");
            exit();
        } else {
            die("Error: Could not delete record.");
        }

    } catch (PDOException $e) {
        // Log the error and show a generic message
        error_log($e->getMessage());
        die("Database error: Request could not be processed.");
    }
} else {
    // If no ID provided, just redirect back to index
    header("Location: index.php");
    exit();
}
?>