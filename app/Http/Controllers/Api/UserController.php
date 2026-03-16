<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function handshake(Request $request)
    {
        $request->validate([
            'telegram_chat_id' => 'required|string|unique:users,telegram_chat_id',
            'name' => 'required|string|max:255',
        ]);

        // Create or update user based on chat_id
        $user = User::updateOrCreate(
            ['telegram_chat_id' => $request->telegram_chat_id],
            [
                'name' => $request->name,
                'email' => $request->telegram_chat_id . '@telegram.local',  // Placeholder email
                'password' => Hash::make('default_password'),  // Or handle auth differently
            ]
        );

        return response()->json(['user_id' => $user->id, 'message' => 'Handshake successful']);
    }
}