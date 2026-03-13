<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catch as FishCatch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class CatchController extends Controller
{
    /**
     * Phase 1: The Initial Identity Handshake
     */
    public function handshake(Request $request)
    {
        $validated = $request->validate([
            'telegram_chat_id' => 'required|string',
            'name' => 'nullable|string',
        ]);

        // Securely map the Telegram user to the Laravel database
        $user = User::firstOrCreate(
            ['telegram_chat_id' => $validated['telegram_chat_id']],
            [
                'name' => $validated['name'] ?? 'Unknown Fisherman',
                'email' => $validated['telegram_chat_id'] . '@isdalog.local',
                'password' => Hash::make(Str::random(16)) // Auto-generated secure password
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Identity handshake completed',
            'user' => $user
        ], 200);
    }

    /**
     * Store catch data received from the Fishery-AI bot.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'telegram_chat_id' => 'required|string',
            'species' => 'required|string|max:255',
            'weight' => 'required|numeric|min:0.1',
            'location' => 'nullable|string',
        ]);

        // Identify the fisherman making the request
        $user = User::where('telegram_chat_id', $validated['telegram_chat_id'])->first();

        $catch = FishCatch::create([
            'user_id' => $user ? $user->id : null,
            'species' => $validated['species'],
            'weight' => $validated['weight'],
            'location' => $validated['location'] ?? 'Dipolog City Port',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Catch securely logged',
            'data' => $catch
        ], 201);
    }
}