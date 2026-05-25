<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed your authentic Fisherman profile (tied to your real Chat ID)
        User::create([
            'name' => 'Ian the Fisherman',
            'email' => 'fisherman@isdalog.ph',
            'password' => Hash::make('password123'),
            'role' => 'fisherman',
            'status' => 'active',
            'telegram_chat_id' => '8531483496', // Your exact verified Chat ID
        ]);

        // 2. Seed a dummy Verified Rider profile
        User::create([
            'name' => 'Juan the Rider',
            'email' => 'rider@isdalog.ph',
            'password' => Hash::make('password123'),
            'role' => 'rider',
            'status' => 'active', // Pre-approved for the stage demo!
        ]);

        // 3. Seed a dummy Merchant/Buyer profile
        User::create([
            'name' => 'Maria the Merchant',
            'email' => 'merchant@isdalog.ph',
            'password' => Hash::make('password123'),
            'role' => 'merchant',
            'status' => 'active',
        ]);
    }
}