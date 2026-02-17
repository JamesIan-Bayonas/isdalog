-- Database Creation
-- We drop it first to ensure a clean slate during development (Industrial Pattern: Idempotency)
DROP DATABASE IF EXISTS isdalog_db;
CREATE DATABASE isdalog_db;
USE isdalog_db;

-- Table Creation
-- Table: catches
-- Focus: Stores distinct daily catch records
CREATE TABLE catches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Core Data (VARCHAR)
    species_name VARCHAR(100) NOT NULL,
    
    -- Quantitative Data (DECIMAL for precision)
    -- 10 digits total, 2 after decimal (e.g., 12345678.99)
    weight_kg DECIMAL(10, 2) NOT NULL, 
    price_per_kg DECIMAL(10, 2) NOT NULL,
    
    -- Temporal Data (DATE)
    catch_date DATE NOT NULL,
    
    -- Categorical Data (ENUM)
    -- Restricts input to specific domain values, preventing typos like "Nett" or "LineFishing"
    catch_method ENUM('Net', 'Line', 'Trap', 'Spear', 'Trawl') NOT NULL,
        
    -- Metadata (VARCHAR & TEXT)
    location VARCHAR(150) NOT NULL COMMENT 'Specific fishing zone or coordinates',
    fisherman_notes TEXT COMMENT 'Weather conditions, tide, or buyer details',
    
    -- Audit Timestamp (Best Practice)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seeding Data (Sample Records)
-- We insert realistic data to test edge cases (decimals, varied dates, different enums)

INSERT INTO catches (species_name, weight_kg, price_per_kg, catch_date, catch_method, location, fisherman_notes) VALUES 
('Yellowfin Tuna', 45.50, 280.00, '2023-10-01', 'Line', 'Municipal Waters Zone A', 'Caught early morning, high tide. Strong current.'),
('Blue Marlin', 120.75, 350.00, '2023-10-02', 'Line', 'Deep Sea Zone 4', 'Prize catch. Sold immediately to local resort.'),
('Lapu-Lapu (Grouper)', 15.20, 450.00, '2023-10-03', 'Spear', 'Coral Reef B', 'Excellent quality, live catch.'),
('Tanigue (Mackerel)', 8.50, 220.00, '2023-10-04', 'Net', 'Coastal Shelf', 'Schooling fish, caught with gillnet.'),
('Squid (Pusit)', 25.00, 180.00, '2023-10-05', 'Trap', 'Night Operation Zone', 'Full moon, low catch rate.');