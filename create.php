<?php
/*
 * File: create.php
 * Pattern: Self-Processing Form with PRG (Post-Redirect-Get)
 * Best Practice: Server-Side Validation & Prepared Statements
 */

require_once 'includes/db_connect.php';

// Initialize variables to hold user input (for "Sticky" form) and errors
$species = $weight = $price = $date = $method = $location = $notes = '';
$errors = [];

// THE "GUARD": Check if form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // THE "FILTER": Sanitize and Validate Input
    // We use trim() to remove accidental whitespace
    $species = trim($_POST['species_name']);
    $weight = trim($_POST['weight_kg']);
    $price = trim($_POST['price_per_kg']);
    $date = trim($_POST['catch_date']);
    $method = $_POST['catch_method'] ?? ''; // Null coalescing if not selected
    $location = trim($_POST['location']);
    $notes = trim($_POST['fisherman_notes']);

    // --- Validation Rules (Strict Rule #6) ---
    
    // Species: Required
    if (empty($species)) {
        $errors['species'] = "Species name is required.";
    }

    // Weight: Required & Numeric
    if (empty($weight)) {
        $errors['weight'] = "Weight is required.";
    } elseif (!is_numeric($weight) || $weight <= 0) {
        $errors['weight'] = "Weight must be a valid positive number.";
    }

    // Price: Required & Numeric
    if (empty($price)) {
        $errors['price'] = "Price is required.";
    } elseif (!is_numeric($price) || $price < 0) {
        $errors['price'] = "Price must be a valid number.";
    }

    // Date: Required
    if (empty($date)) {
        $errors['date'] = "Catch date is required.";
    }

    // Method: Required & Must be in Enum list
    $allowed_methods = ['Net', 'Line', 'Trap', 'Spear', 'Trawl'];
    if (empty($method) || !in_array($method, $allowed_methods)) {
        $errors['method'] = "Please select a valid catch method.";
    }

    // Location: Required
    if (empty($location)) {
        $errors['location'] = "Location is required.";
    }

    // THE "ACTION": Insert if no errors
    if (empty($errors)) {
        try {
            // SQL Pattern: Named Placeholders (:name) for Security (Strict Rule #5)
            $sql = "INSERT INTO catches (species_name, weight_kg, price_per_kg, catch_date, catch_method, location, fisherman_notes) 
                    VALUES (:species, :weight, :price, :date, :method, :location, :notes)";
            
            $stmt = $pdo->prepare($sql);
            
            // Bind parameters
            $stmt->execute([
                ':species' => $species,
                ':weight' => $weight,
                ':price' => $price,
                ':date' => $date,
                ':method' => $method,
                ':location' => $location,
                ':notes' => $notes
            ]);

            // THE "ESCAPE": Redirect on success
            header("Location: index.php?status=success");
            exit();

        } catch (PDOException $e) {
            // Log error internally, show generic message to user
            error_log($e->getMessage());
            $errors['db'] = "Database error: Could not save catch.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Catch - IsdaLog</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="form-container">
    <h2 style="text-align:center; margin-bottom: 25px;">Record New Catch</h2>

    <?php if (isset($errors['db'])): ?>
        <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
            <?php echo $errors['db']; ?>
        </div>
    <?php endif; ?>

    <form action="create.php" method="POST">
        
        <div class="form-group">
            <label>Fish Species *</label>
            <input type="text" name="species_name" value="<?php echo htmlspecialchars($species); ?>" 
                   class="<?php echo isset($errors['species']) ? 'is-invalid' : ''; ?>">
            <?php if (isset($errors['species'])): ?>
                <div class="error-msg"><?php echo $errors['species']; ?></div>
            <?php endif; ?>
        </div>

        <div style="display: flex; gap: 15px;">
            <div class="form-group" style="flex: 1;">
                <label>Weight (kg) *</label>
                <input type="number" step="0.01" name="weight_kg" value="<?php echo htmlspecialchars($weight); ?>"
                       class="<?php echo isset($errors['weight']) ? 'is-invalid' : ''; ?>">
                <?php if (isset($errors['weight'])): ?>
                    <div class="error-msg"><?php echo $errors['weight']; ?></div>
                <?php endif; ?>
            </div>

            <div class="form-group" style="flex: 1;">
                <label>Price per kg (₱) *</label>
                <input type="number" step="0.01" name="price_per_kg" value="<?php echo htmlspecialchars($price); ?>"
                       class="<?php echo isset($errors['price']) ? 'is-invalid' : ''; ?>">
                <?php if (isset($errors['price'])): ?>
                    <div class="error-msg"><?php echo $errors['price']; ?></div>
                <?php endif; ?>
            </div>
        </div>

        <div style="display: flex; gap: 15px;">
            <div class="form-group" style="flex: 1;">
                <label>Date Caught *</label>
                <input type="date" name="catch_date" value="<?php echo htmlspecialchars($date); ?>"
                       class="<?php echo isset($errors['date']) ? 'is-invalid' : ''; ?>">
                <?php if (isset($errors['date'])): ?>
                    <div class="error-msg"><?php echo $errors['date']; ?></div>
                <?php endif; ?>
            </div>

            <div class="form-group" style="flex: 1;">
                <label>Method *</label>
                <select name="catch_method" class="<?php echo isset($errors['method']) ? 'is-invalid' : ''; ?>">
                    <option value="">-- Select --</option>
                    <?php 
                    $opts = ['Net', 'Line', 'Trap', 'Spear', 'Trawl'];
                    foreach ($opts as $opt) {
                        // Keep selected option sticky
                        $selected = ($method == $opt) ? 'selected' : '';
                        echo "<option value='$opt' $selected>$opt</option>";
                    }
                    ?>
                </select>
                <?php if (isset($errors['method'])): ?>
                    <div class="error-msg"><?php echo $errors['method']; ?></div>
                <?php endif; ?>
            </div>
        </div>

        <div class="form-group">
            <label>Location / Fishing Zone *</label>
            <input type="text" name="location" value="<?php echo htmlspecialchars($location); ?>"
                   class="<?php echo isset($errors['location']) ? 'is-invalid' : ''; ?>">
            <?php if (isset($errors['location'])): ?>
                <div class="error-msg"><?php echo $errors['location']; ?></div>
            <?php endif; ?>
        </div>

        <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea name="fisherman_notes" rows="3"><?php echo htmlspecialchars($notes); ?></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-block">Save Catch Record</button>
        <a href="index.php" class="back-link">Cancel and Return to Dashboard</a>
    </form>
</div>

</body>
</html>