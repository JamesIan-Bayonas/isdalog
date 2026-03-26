<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends \App\Http\Controllers\Controller
{
    public function handshake(Request $request)
    {
        $validated = $request->validate([
            'telegram_chat_id' => 'required|string',
            'name' => 'required|string|max:255',
        ]);

        // Create or get user based on chat_id
        // Using firstOrCreate to avoid unique constraint violation if the user already exists
        $user = User::firstOrCreate(
            ['telegram_chat_id' => $validated['telegram_chat_id']],
            [
                'name' => $validated['name'],
                'email' => $validated['telegram_chat_id'] . '@telegram.local',
                'password' => Hash::make(Str::random(16)),
            ]
        );

        return response()->json([
            'status' => 'success',
            'user_id' => $user->id, 
            'message' => 'Handshake successful'
        ]);
    }
}