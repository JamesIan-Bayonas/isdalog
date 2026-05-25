<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Listing; // Ensure you import your Listing model
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. SEED PLATFORM ADMINISTRATOR
        $admin = User::create([
            'name' => 'James Admin',
            'email' => 'admin@isdalog.ph',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'verified',
        ]);

        // 2. SEED AUTHENTIC FISHERMAN PROFILE
        $fisherman = User::create([
            'name' => 'Ian the Fisherman',
            'email' => 'fisherman@isdalog.ph',
            'password' => Hash::make('password123'),
            'role' => 'fisherman',
            'status' => 'verified',
            'telegram_chat_id' => '8531483496',
        ]);

        // 3. SEED A RIDER PROFILE
        User::create([
            'name' => 'Juan the Rider',
            'email' => 'rider@isdalog.ph',
            'password' => Hash::make('password123'),
            'role' => 'rider',
            'status' => 'unverified',
        ]);

        // 4. SEED STANDARD BUYER / MERCHANT PROFILE
        $buyer = User::create([
            'name' => 'Maria the Merchant',
            'email' => 'buyer@isdalog.ph',
            'password' => Hash::make('password123'),
            'role' => 'buyer',
            'status' => 'verified',
        ]);

        // =========================================================================
        // 🎣 5. SEED AN ACTIVE AUCTION LISTING (Brings back the Bidding UI!)
        // =========================================================================
        \App\Models\Listing::create([
            'user_id' => $fisherman->id, // Owned by your fisherman profile
            'fish_name' => 'Premium Tilapia Batch A', // Matches migration field string
            'weight_kg' => 50.00,                     // Matches migration field string
            'starting_price' => 1500.00,
            'current_bid' => 1500.00,                 // Matches migration field string
            'location' => 'Galas Port (Dock 2)',      // Matches migration field string
            'status' => 'active',                     // Triggers the React bidding input display!
            'ends_at' => now()->addDays(3),
            'created_at' => now(),
        ]);
    }
}