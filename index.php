<?php
/* * File: index.php
 * Purpose: Main dashboard with Search, Sort, and Statistics
 * Security: Uses Whitelisting for Sort Columns to prevent SQL Injection
 */

require_once 'includes/db_connect.php';

// HANDLE SEARCH & SORT PARAMETERS 
$search = $_GET['search'] ?? ''; 

// Default Sort State
$sort_column = 'catch_date';
$sort_order = 'DESC';

// SECURITY WHITELIST: Only allow specific columns to be sorted
// This strictly prevents SQL Injection via ORDER BY clauses
$allowed_columns = ['catch_date', 'species_name', 'weight_kg', 'price_per_kg'];
$allowed_orders = ['ASC', 'DESC'];

// Validate 'sort' parameter
if (isset($_GET['sort']) && in_array($_GET['sort'], $allowed_columns)) {
    $sort_column = $_GET['sort'];
}

// Validate 'order' parameter
if (isset($_GET['order']) && in_array(strtoupper($_GET['order']), $allowed_orders)) {
    $sort_order = strtoupper($_GET['order']);
}

// Helper Function: Generates the URL for sorting links
function getSortLink($col, $current_col, $current_order) {
    // Toggle direction: If currently DESC, switch to ASC, else DESC
    $new_order = ($current_col === $col && $current_order === 'DESC') ? 'ASC' : 'DESC';
    
    // Preserve search query if it exists
    global $search;
    $query_string = "?sort=$col&order=$new_order";
    if ($search) {
        $query_string .= "&search=" . urlencode($search);
    }
    
    return $query_string;
}

// New Helper: Generates the CSS class for the sort icon
function getSortClass($col, $current_col, $current_order) {
    if ($col !== $current_col) return ''; // No sort active
    return $current_order === 'ASC' ? 'sorted-asc' : 'sorted-desc';
}

try {
    // BUILD THE SECURE QUERY 
    $sql = "SELECT * FROM catches";
    
    // Add Search Conditions
    if ($search) {
        $sql .= " WHERE species_name LIKE :search OR location LIKE :search";
    }

    // Add Sorting (Safe because $sort_column is whitelisted)
    $sql .= " ORDER BY $sort_column $sort_order";

    $stmt = $pdo->prepare($sql);

    // Bind Search Parameters
    if ($search) {
        $stmt->bindValue(':search', "%$search%");
    }

    $stmt->execute();
    $catches = $stmt->fetchAll(); 

} catch (PDOException $e) {
    die("Query Failed: " . $e->getMessage());
}

// DASHBOARD STATISTICS
$total_weight = 0;
$total_value = 0;

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
    <?php if (isset($_GET['status'])): ?>
        <?php
            $status = $_GET['status'];
            $msg = "";
            $icon = "";
            $alertClass = "";

            if ($status == 'success') {
                $msg = "Success! New catch recorded successfully.";
                $icon = "✅";
                $alertClass = "alert-success";
            } elseif ($status == 'updated') {
                $msg = "Update Complete! The catch record has been modified.";
                $icon = "✏️";
                $alertClass = "alert-warning"; // Matches your yellow Edit theme
            } elseif ($status == 'deleted') {
                $msg = "Record Deleted. The catch has been removed permanently.";
                $icon = "🗑️";
                $alertClass = "alert-danger"; // Matches your red Delete theme
            }
        ?>
        
        <?php if ($msg): ?>
            <div class="alert <?php echo $alertClass; ?>">
                <span class="alert-icon"><?php echo $icon; ?></span>
                <span class="alert-text"><?php echo $msg; ?></span>
                <a href="index.php" class="alert-close">&times;</a>
            </div>
        <?php endif; ?>
    <?php endif; ?>


    <div class="brand-header">
        <h1>🌊 IsdaLog <span class="subtitle">Catch & Sales Tracker</span></h1>
        
        <div>
            <button onclick="window.print()" class="btn" style="background: white; color: var(--primary-color); border: 2px solid var(--primary-color); margin-right: 10px; font-weight:bold;">
                🖨️ Print Report
            </button>
            
            <a href="create.php" class="btn btn-primary btn-glow">+ Record Catch</a>
        </div>
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

    <div class="table-wrapper">
        </div>
</div>

    <form method="GET" action="index.php" style="margin-bottom: 20px;" class="search-form">
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
                <th>
                    <a href="<?php echo getSortLink('catch_date', $sort_column, $sort_order); ?>" class="sortable-header <?php echo getSortClass('catch_date', $sort_column, $sort_order); ?>">
                        Date 
                        <span class="sort-icon"></span>
                    </a>
                </th>
                
                <th>
                    <a href="<?php echo getSortLink('species_name', $sort_column, $sort_order); ?>" class="sortable-header <?php echo getSortClass('species_name', $sort_column, $sort_order); ?>">
                        Species 
                        <span class="sort-icon"></span>
                    </a>
                </th>
                
                <th>Method</th>
                
                <th>
                    <a href="<?php echo getSortLink('weight_kg', $sort_column, $sort_order); ?>" class="sortable-header <?php echo getSortClass('weight_kg', $sort_column, $sort_order); ?>">
                        Weight (kg) 
                        <span class="sort-icon"></span>
                    </a>
                </th>
                
                <th>
                    <a href="<?php echo getSortLink('price_per_kg', $sort_column, $sort_order); ?>" class="sortable-header <?php echo getSortClass('price_per_kg', $sort_column, $sort_order); ?>">
                        Price/kg 
                        <span class="sort-icon"></span>
                    </a>
                </th>
                
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