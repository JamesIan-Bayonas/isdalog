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

        for ($i = 0; $i < 50; $i++) {
            $weight = rand(10, 150);
            $basePrice = rand(800, 3500);
            
            DB::table('listings')->insert([
                'user_id' => 1, // Assumes user 1 is the fisherman
                'fish_name' => $fishTypes[array_rand($fishTypes)],
                'weight_kg' => $weight,
                'location' => $locations[array_rand($locations)],
                'current_bid' => $basePrice,
                'status' => 'sold', // Marks them as completed sales for the BFAR charts
                'created_at' => Carbon::now()->subDays(rand(1, 20)), // Scatters the data over the last 3 weeks
                'updated_at' => Carbon::now()->subDays(rand(1, 20)),
            ]);
        }

        $this->command->info('✅ Defense Day Seeder complete: 50 transactions injected!');
    }
}