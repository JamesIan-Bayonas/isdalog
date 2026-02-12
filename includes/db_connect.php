<?php
/*
 * Database Connection File
 * Using PDO (PHP Data Objects) for better security and flexibility.
 * * industrial Best Practice: 
 * We use a try-catch block to handle connection errors without 
 * exposing sensitive database credentials to the user.
 */

$host = 'localhost';
$db_name = 'isdalog_db';
$username = 'root';     // Default XAMPP username
$password = '';         // Default XAMPP password is empty

try {
    // Data Source Name (DSN)
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    
    // Create a new PDO instance
    $pdo = new PDO($dsn, $username, $password);
    
    // Set PDO options for error handling
    // ATTR_ERRMODE: Tells PDO to throw exceptions on errors (Strict Mode)
    // ATTR_DEFAULT_FETCH_MODE: Sets default fetch style to Associative Array
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Comment this out in production, but helpful for initial testing:
    // echo "Connected successfully"; 
    
} catch (PDOException $e) {
    // Secure Failure: Don't echo $e->getMessage() to the public!
    // Instead, log it and show a generic message.
    error_log("Connection Error: " . $e->getMessage());
    die("Database connection failed. Please contact the administrator.");
}
?>