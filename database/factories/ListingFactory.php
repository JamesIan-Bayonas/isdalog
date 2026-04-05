<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListingFactory extends Factory
{
    public function definition(): array
    {
        // Generate a random starting price so we can set the current_bid to match it initially
        $startingPrice = fake()->randomFloat(2, 100, 5000);

        return [
            // If you have a specific way you handle users in the seeder, you can adjust this. 
            // This randomly assigns the listing to an existing user, or creates a new one.
            'user_id' => User::factory(), 
            
            'fish_name' => fake()->randomElement(['Lapu-Lapu', 'Yellowfin Tuna', 'Tambakol', 'Maya-Maya', 'Tulingan']),
            'weight_kg' => fake()->randomFloat(2, 1, 50), // Random weight between 1kg and 50kg
            'starting_price' => $startingPrice,
            'current_bid' => $startingPrice, 
            'location' => fake()->randomElement(['Dipolog Port', 'Galas Port', 'Dapitan Port']),
            'status' => fake()->randomElement(['active', 'pending_logistics', 'completed']),
            'ends_at' => fake()->dateTimeBetween('now', '+2 days'),
        ];
    }
}