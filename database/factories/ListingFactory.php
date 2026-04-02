<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class ListingFactory extends Factory
{
    public function definition(): array
    {
        // Array of local fish types
        $fishTypes = ['Yellowfin Tuna', 'Lapu-Lapu', 'Tulingan', 'Bangus', 'Tambakol', 'Malasugi'];
        
        // Array of your specific landing sites
        $landingSites = ['Galas Port', 'Sicayab Beach', 'Dipolog Boulevard'];

        return [
            // Generate a random weight and fish (e.g., "25kg Tulingan")
            'catch_details' => fake()->numberBetween(5, 50) . 'kg ' . fake()->randomElement($fishTypes),
            
            // Random starting price between ₱500 and ₱5000
            'starting_bid' => fake()->randomFloat(2, 500, 5000),
            
            // Pick a random landing site
            'landing_site' => fake()->randomElement($landingSites),
            
            'status' => 'active',
            
            // Auction ends randomly between 1 and 12 hours from right now
            'ends_at' => now()->addHours(fake()->numberBetween(1, 12)),
        ];
    }
}