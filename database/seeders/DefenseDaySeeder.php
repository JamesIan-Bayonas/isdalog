<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DefenseDaySeeder extends Seeder
{
    public function run()
    {
        $fishTypes = ['Yellowfin Tuna', 'Lapu-Lapu', 'Bangus', 'Tambakol', 'Blue Marlin'];
        $locations = ['Galas Port', 'Dapitan Port', 'Sindangan Port'];

        // 1. Generate HISTORICAL COMPLETED data for the BFAR Dashboard Charts (45 records)
        for ($i = 0; $i < 45; $i++) {
            $weight = rand(10, 150);
            $startPrice = rand(800, 2500);
            $currentBid = $startPrice + rand(100, 1000); 
            
            DB::table('listings')->insert([
                'user_id' => 1,
                'fish_name' => $fishTypes[array_rand($fishTypes)],
                'weight_kg' => $weight,
                'location' => $locations[array_rand($locations)],
                'starting_price' => $startPrice,
                'current_bid' => $currentBid,
                'status' => 'completed', // Feeds the dashboard
                'created_at' => Carbon::now()->subDays(rand(1, 20)),
                'updated_at' => Carbon::now()->subDays(rand(1, 20)),
            ]);
        }

        // 2. Generate LIVE ACTIVE data for the Trading Floor View (5 records)
        for ($j = 0; $j < 5; $j++) {
            $weight = rand(15, 80);
            $startPrice = rand(600, 1800);
            
            DB::table('listings')->insert([
                'user_id' => 1,
                'fish_name' => $fishTypes[array_rand($fishTypes)],
                'weight_kg' => $weight,
                'location' => $locations[array_rand($locations)],
                'starting_price' => $startPrice,
                'current_bid' => $startPrice, // Bidding starts at baseline
                'status' => 'active', // <-- CRITICAL: This activates them on the Trading Floor
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        $this->command->info('✅ Balanced Seeder Complete: 45 historical & 5 active auctions created!');
    }
}