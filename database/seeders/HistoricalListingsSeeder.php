<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HistoricalListingsSeeder extends Seeder
{
    public function run(): void
    {
        $fishTypes = ['Lapu-Lapu', 'Yellowfin Tuna', 'Bangus', 'Tambakol', 'Maya-Maya'];
        $locations = ['Galas Port', 'Sicayab', 'Olingan'];

        $data = [];
        for ($i = 0; $i < 500; $i++) {
            $fish = $fishTypes[array_rand($fishTypes)];
            
            // Set realistic base prices per catch
            $basePrice = match($fish) {
                'Lapu-Lapu' => 1500,
                'Yellowfin Tuna' => 2500,
                'Bangus' => 800,
                'Tambakol' => 1200,
                'Maya-Maya' => 1800,
                default => 1000,
            };

            // Randomize the sold price by +/- 20% to simulate market fluctuations
            $fluctuation = $basePrice * 0.20;
            $soldPrice = $basePrice + rand(-$fluctuation, $fluctuation);
            
            // Generate a random date within the last 30 days
            $randomDate = Carbon::now()->subDays(rand(1, 30))->subHours(rand(1, 24));

            $data[] = [
                'user_id' => 1, // Attaching to a default fisherman ID
                'fish_name' => $fish,
                'weight_kg' => rand(5, 25),
                'location' => $locations[array_rand($locations)],
                'starting_price' => $basePrice, // <-- THE FIX: Added the missing required column
                'current_bid' => $soldPrice,
                'status' => 'sold',
                'ends_at' => $randomDate,
                'created_at' => $randomDate,
                'updated_at' => $randomDate,
            ];
        }

        // Insert in chunks to avoid memory overload
        foreach (array_chunk($data, 100) as $chunk) {
            DB::table('listings')->insert($chunk);
        }
    }
}