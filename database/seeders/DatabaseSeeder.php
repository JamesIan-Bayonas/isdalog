<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Listing;
use Illuminate\Database\Seeder;

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
            'email' => 'admin@isdalog.com', // Standardized to .com
            'password' => 'password123',     // Hashed once by User model cast
            'role' => 'admin',
            'status' => 'verified',
            'email_verified_at' => now(),
        ]);

        // 2. SEED AUTHENTIC FISHERMAN PROFILE
        $fisherman = User::create([
            'name' => 'Ian the Fisherman',
            'email' => 'fisherman@isdalog.com',
            'password' => 'password123',
            'role' => 'fisherman',
            'status' => 'verified',
            'telegram_chat_id' => '8531483496',
            'email_verified_at' => now(),
        ]);

        // 3. SEED A RIDER PROFILE
        User::create([
            'name' => 'Juan the Rider',
            'email' => 'rider@isdalog.com',
            'password' => 'password123',
            'role' => 'rider',
            'status' => 'verified',
            'email_verified_at' => now(),
        ]);

        // 4. SEED STANDARD BUYER / MERCHANT PROFILE
        $buyer = User::create([
            'name' => 'Maria the Merchant',
            'email' => 'buyer@isdalog.com',
            'password' => 'password123',
            'role' => 'buyer',
            'status' => 'verified',
            'wallet_balance' => 5000.00,
            'email_verified_at' => now(),
        ]);

        // 5. SEED AN ACTIVE AUCTION LISTING
        Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Premium Tilapia Batch A',
            'weight_kg' => 50.00,
            'starting_price' => 1500.00,
            'current_bid' => 1500.00,
            'location' => 'Galas Port (Dock 2)',
            'status' => 'active',
            'ends_at' => now()->addDays(3),
            'created_at' => now(),
        ]);
    }
}