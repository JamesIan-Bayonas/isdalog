<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // We use updateOrCreate so that if you run the seeder multiple times, 
        // it doesn't crash trying to create a duplicate email.
        User::updateOrCreate(
            ['email' => 'admin@isdalog.com'], // The unique identifier
            [
                'name' => 'IsdaLog System Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'contact_number' => '09000000000',
                'email_verified_at' => now(),
            ]
        );
    }
}