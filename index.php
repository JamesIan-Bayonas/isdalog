<?php
/* * File: index.php
 * Purpose: The main dashboard. displays the list of catches and handles search.
 * Industrial Practice: "Server-Side Rendering" (SSR).
 */

// Include the secure connection file we made in Step 2
require_once 'includes/db_connect.php';

// Handle Search Logic (If user typed something)
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

// Dashboard Statistics
// We calculate totals to show a "Heads-Up Display"
$total_weight = 0;
$total_value = 0;
$top_species = 'None';

// Calculate totals from the fetched data (saves a second DB query!)
foreach ($catches as $c) {
    $total_weight += $c['weight_kg'];
    $total_value += ($c['weight_kg'] * $c['price_per_kg']);
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IsdaLog - Catch Dashboard</title>
    <link rel="stylesheet" href="css/style.css"> 
    
</head>
<body>

<div class="container">
    <div class="container">
    <div class="brand-header">
        <h1>🌊 IsdaLog <span class="subtitle">Catch & Sales Tracker</span></h1>
        <a href="create.php" class="btn btn-primary btn-glow">+ Record Catch</a>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-title">Total Catch Weight</div>
            <div class="stat-value"><?php echo number_format($total_weight, 2); ?> <small>kg</small></div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Estimated Value</div>
            <div class="stat-value highlight">₱<?php echo number_format($total_value, 2); ?></div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Total Records</div>
            <div class="stat-value"><?php echo count($catches); ?></div>
        </div>
    </div>

    <div class="controls-bar">
        <form method="GET" action="index.php" class="search-form">
            <input type="text" name="search" class="search-input" placeholder="🔍 Search species or location..." value="<?php echo htmlspecialchars($search); ?>">
            <?php if($search): ?>
                <a href="index.php" class="btn-clear">×</a>
            <?php endif; ?>
        </form>
    </div>

    <div class="table-wrapper">
        </div>
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