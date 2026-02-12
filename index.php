<?php
/* * File: index.php
 * Purpose: The main dashboard. displays the list of catches and handles search.
 * Industrial Practice: "Server-Side Rendering" (SSR).
 */

// 1. Include the secure connection file we made in Step 2
require_once 'includes/db_connect.php';

// 2. Handle Search Logic (If user typed something)
$search = $_GET['search'] ?? ''; // Null coalescing operator (PHP 7+)

try {
    // Prepare the SQL Query
    // We use a flexible query that changes if a search term exists
    if ($search) {
        $sql = "SELECT * FROM catches 
                WHERE species_name LIKE :search 
                OR location LIKE :search 
                ORDER BY catch_date DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':search', "%$search%"); // Wildcard search
    } else {
        // Default: Show all, newest first
        $sql = "SELECT * FROM catches ORDER BY catch_date DESC";
        $stmt = $pdo->prepare($sql);
    }

    $stmt->execute();
    $catches = $stmt->fetchAll(); // Fetch all rows as an associative array

} catch (PDOException $e) {
    die("Query Failed: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IsdaLog - Catch Dashboard</title>
    <link rel="stylesheet" href="css/style.css"> 
    <style>
        /* Inline CSS for immediate setup - move to style.css later */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .search-box input { padding: 8px; width: 250px; border: 1px solid #ccc; border-radius: 4px; }
        .btn { padding: 8px 15px; text-decoration: none; border-radius: 4px; color: white; font-size: 14px; }
        .btn-primary { background-color: #007bff; } /* Blue */
        .btn-warning { background-color: #ffc107; color: black; } /* Yellow */
        .btn-danger { background-color: #dc3545; } /* Red */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        tr:hover { background-color: #f1f1f1; }
        .empty-state { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>🐟 IsdaLog Dashboard</h1>
        <a href="create.php" class="btn btn-primary">+ New Catch</a>
    </div>

    <form method="GET" action="index.php" style="margin-bottom: 20px;">
        <div class="search-box">
            <input type="text" name="search" placeholder="Search species or location..." value="<?php echo htmlspecialchars($search); ?>">
            <button type="submit" class="btn btn-primary">Search</button>
            <?php if($search): ?>
                <a href="index.php" class="btn" style="background:#6c757d;">Clear</a>
            <?php endif; ?>
        </div>
    </form>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Species</th>
                <th>Method</th>
                <th>Weight (kg)</th>
                <th>Price/kg</th>
                <th>Total Value</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php if (count($catches) > 0): ?>
                <?php foreach ($catches as $row): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($row['catch_date']); ?></td>
                        <td>
                            <strong><?php echo htmlspecialchars($row['species_name']); ?></strong><br>
                            <small style="color:#666;"><?php echo htmlspecialchars($row['location']); ?></small>
                        </td>
                        <td><?php echo htmlspecialchars($row['catch_method']); ?></td>
                        <td><?php echo htmlspecialchars($row['weight_kg']); ?></td>
                        <td>₱<?php echo number_format($row['price_per_kg'], 2); ?></td>
                        <td style="font-weight:bold; color:green;">
                            ₱<?php echo number_format($row['weight_kg'] * $row['price_per_kg'], 2); ?>
                        </td>
                        <td>
                            <a href="update.php?id=<?php echo $row['id']; ?>" class="btn btn-warning">Edit</a>
                            <a href="delete.php?id=<?php echo $row['id']; ?>" class="btn btn-danger" onclick="return confirm('Are you sure you want to delete this record?');">Delete</a>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td colspan="7" class="empty-state">No catches found. Time to go fishing!</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>

</body>
</html>