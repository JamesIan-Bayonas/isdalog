<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MarketPrice;
use App\Models\RestrictedSpecies;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Local Port Market Prices (PHP)
        MarketPrice::insert([
            ['species' => 'Red Snapper', 'price_per_kg' => 450.00],
            ['species' => 'Tuna', 'price_per_kg' => 300.00],
            ['species' => 'Mackerel', 'price_per_kg' => 250.00],
            ['species' => 'Grouper', 'price_per_kg' => 200.00],
            ['species' => 'Milkfish', 'price_per_kg' => 180.00],
        ]);

        // 2. Regulatory & Protected Species
        RestrictedSpecies::insert([
            ['species' => 'Whale Shark', 'restriction_type' => 'Endangered Species - Do Not Catch'],
            ['species' => 'Manta Ray', 'restriction_type' => 'Protected - Immediate Release Required'],
            ['species' => 'Sea Turtle', 'restriction_type' => 'Protected - Illegal to Harvest'],
        ]);
    }
}