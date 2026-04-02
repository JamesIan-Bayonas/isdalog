<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Listing;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create 3 Fishermen
        $fishermen = User::factory(3)->create([
            'role' => 'fisherman',
            'contact_number' => '09' . fake()->randomNumber(9, true), // Fake PH number
        ]);

        // 2. Give each fisherman 4 active listings
        foreach ($fishermen as $fisherman) {
            Listing::factory(4)->create([
                'fisherman_id' => $fisherman->id,
            ]);
        }

        // 3. Create 5 Buyers to act as bidders
        User::factory(5)->create([
            'role' => 'buyer',
            'contact_number' => '09' . fake()->randomNumber(9, true),
        ]);
        
        // 4. Create 1 Rider for future logistics testing
        User::factory(1)->create([
            'role' => 'rider',
            'contact_number' => '09' . fake()->randomNumber(9, true),
        ]);
    }
}