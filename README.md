# IsdaLog: Catch & Sales Tracker

> **A secure, vanilla PHP application for managing maritime catch records.**

IsdaLog is a web-based dashboard designed to help fishermen and fishery managers record, track, and analyze daily catch data. This project demonstrates a **Vanilla PHP** implementation (no frameworks) with a strong focus on **security**, **data integrity**, and **modern UI/UX**.

---

##  Project Description

This application serves as a digital logbook for maritime activities. It allows users to perform full **CRUD** (Create, Read, Update, Delete) operations on catch records while providing real-time statistics on total weight and earnings.

### Key Features
* **Secure CRUD Operations:**
    * **Create:** Record new catches with strict validation for species, weight, and price.
    * **Read:** View a paginated dashboard with dynamic sorting and search filtering.
    * **Update:** Modify existing records using a "sticky" form state.
    * **Delete:** Securely remove records with confirmation dialogs.
* **Security Architecture:**
    * **SQL Injection Protection:** Uses `PDO` prepared statements for all database interactions.
    * **Whitelisting:** Sort parameters are strictly validated against an allowed list to prevent injection via `ORDER BY`.
    * **XSS Prevention:** All output is sanitized using `htmlspecialchars()`.
* **Modern UI/UX:**
    * **Glassmorphism Theme:** Custom CSS with translucent cards and a maritime color palette.
    * **Print Optimization:** Dedicated `@media print` styles for generating clean physical reports.
    * **Feedback System:** Visual alerts for success, update, and deletion events.

---

## ⚙️ Setup Instructions

### 1. Prerequisites
* A local web server environment (XAMPP, WAMP, or LAMP).
* PHP 8.0 or higher.
* MySQL or MariaDB.

### 2. Database Installation
1.  Open your database management tool (e.g., phpMyAdmin).
2.  Import the provided SQL file located in the root directory:
    * File: `database.sql`
3.  This script will:
    * Create the database `isdalog_db`.
    * Create the `catches` table.
    * Seed the table with initial sample data for testing.

### 3. Application Configuration
1.  Navigate to the `includes/` folder.
2.  Open `db_connect.php`.
3.  Verify the database credentials match your local setup:
    ```php
    $host = 'localhost';
    $db_name = 'isdalog_db';
    $username = 'root'; // Default XAMPP user
    $password = '';     // Default XAMPP password
    ```

### 4. Running the Project
1.  Place the project folder into your server's root directory (e.g., `htdocs` for XAMPP).
2.  Open your browser and navigate to:
    `http://localhost/isdalog/`

---

## 📂 File Structure

* `index.php`: Main dashboard with statistics, search, and the records table.
* `create.php`: Form for adding new catch records.
* `update.php`: Form for editing existing records.
* `delete.php`: Backend logic for deleting records.
* `includes/db_connect.php`: Secure PDO database connection string.
* `css/style.css`: Main stylesheet including responsive design and print layout.
* `database.sql`: SQL schema and data seeding script.
