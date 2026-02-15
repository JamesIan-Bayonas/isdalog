<?php
/*
 * File: update.php
 * Feature: Update (Edit) an existing catch
 * Pattern: "Sticky" Form with State Overwrite
 */

require_once 'includes/db_connect.php';

// SECURE ID HANDLING
// We check if an ID exists in the URL (e.g., update.php?id=5)
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header("Location: index.php"); // Kick back to dashboard if no ID
    exit();
}

$id = $_GET['id'];
$errors = [];

// Initialize variables to empty strings first
$species = $weight = $price = $date = $method = $location = $notes = '';

// FETCH EXISTING DATA
// We do this BEFORE checking for POST, so we have the "Original" data available.
try {
    $sql = "SELECT * FROM catches WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $catch = $stmt->fetch();

    if (!$catch) {
        die("Record not found."); // Stop if ID doesn't exist in DB
    }

    // Populate variables with Database values by default
    $species = $catch['species_name'];
    $weight = $catch['weight_kg'];
    $price = $catch['price_per_kg'];
    $date = $catch['catch_date'];
    $method = $catch['catch_method'];
    $location = $catch['location'];
    $notes = $catch['fisherman_notes'];

} catch (PDOException $e) {
    die("Error fetching record: " . $e->getMessage());
}

// HANDLE FORM SUBMISSION (The Overwrite)
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Overwrite the variables with what the User just typed
    // This ensures that if there's an error, the form shows the USER'S input, not the DB's.
    $species = trim($_POST['species_name']);
    $weight = trim($_POST['weight_kg']);
    $price = trim($_POST['price_per_kg']);
    $date = trim($_POST['catch_date']);
    $method = $_POST['catch_method'] ?? '';
    $location = trim($_POST['location']);
    $notes = trim($_POST['fisherman_notes']);

    // Strict Rule #6: Server-side validation
    
    if (empty($species)) $errors['species'] = "Species name is required.";
    
    if (empty($weight)) $errors['weight'] = "Weight is required.";
    elseif (!is_numeric($weight) || $weight <= 0) $errors['weight'] = "Weight must be positive.";

    if (empty($price)) $errors['price'] = "Price is required.";
    elseif (!is_numeric($price) || $price < 0) $errors['price'] = "Price valid number.";

    if (empty($date)) $errors['date'] = "Catch date is required.";

    $allowed_methods = ['Net', 'Line', 'Trap', 'Spear', 'Trawl'];
    if (empty($method) || !in_array($method, $allowed_methods)) $errors['method'] = "Invalid method.";

    if (empty($location)) $errors['location'] = "Location is required.";

    // PERFORM UPDATE
    if (empty($errors)) {
        try {
            // SQL: UPDATE instead of INSERT
            $sql = "UPDATE catches SET 
                    species_name = :species,
                    weight_kg = :weight,
                    price_per_kg = :price,
                    catch_date = :date,
                    catch_method = :method,
                    location = :location,
                    fisherman_notes = :notes
                    WHERE id = :id";
            
            $stmt = $pdo->prepare($sql);
            
            $stmt->execute([
                ':species' => $species,
                ':weight' => $weight,
                ':price' => $price,
                ':date' => $date,
                ':method' => $method,
                ':location' => $location,
                ':notes' => $notes,
                ':id' => $id // Don't forget the ID!
            ]);

            // Redirect with success message
            header("Location: index.php?status=updated");
            exit();

        } catch (PDOException $e) {
            error_log($e->getMessage());
            $errors['db'] = "Database error: Could not update catch.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Edit Catch - IsdaLog</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="form-container">
    <h2 style="text-align:center; margin-bottom: 25px;">Edit Catch Record</h2>

    <?php if (isset($errors['db'])): ?>
        <div style="background: #f8d7da; color: #721c24; padding: 10px; margin-bottom: 20px;"><?php echo $errors['db']; ?></div>
    <?php endif; ?>

    <form action="update.php?id=<?php echo $id; ?>" method="POST">
        
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
                        $selected = ($method == $opt) ? 'selected' : '';
                        echo "<option value='$opt' $selected>$opt</option>";
                    }
                    ?>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label>Location *</label>
            <input type="text" name="location" value="<?php echo htmlspecialchars($location); ?>"
                   class="<?php echo isset($errors['location']) ? 'is-invalid' : ''; ?>">
            <?php if (isset($errors['location'])): ?>
                <div class="error-msg"><?php echo $errors['location']; ?></div>
            <?php endif; ?>
        </div>

        <div class="form-group">
            <label>Notes</label>
            <textarea name="fisherman_notes" rows="3"><?php echo htmlspecialchars($notes); ?></textarea>
        </div>

        <button type="submit" class="btn-block btn-warning">Update Catch</button>
        <a href="index.php" class="back-link">Cancel</a>
    </form>
</div>

</body>
</html>