<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FishCatch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class CatchController extends Controller
{
    public function handshake(Request $request)
    {
        $validated = $request->validate([
            'telegram_chat_id' => 'required|string',
            'name' => 'nullable|string',
        ]);

        $user = User::firstOrCreate(
            ['telegram_chat_id' => $validated['telegram_chat_id']],
            [
                'name' => $validated['name'] ?? 'Unknown Fisherman',
                'email' => $validated['telegram_chat_id'] . '@isdalog.local',
                'password' => Hash::make(Str::random(16))
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Identity handshake completed',
            'user' => $user
        ], 200);
    }

    public function store(Request $request)
    {
        // Added latitude and longitude validation
        $validated = $request->validate([
            'telegram_chat_id' => 'required|string',
            'species' => 'required|string|max:255',
            'weight' => 'required|numeric|min:0.1',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = User::where('telegram_chat_id', $validated['telegram_chat_id'])->first();

        // Determine a text location based on coordinates (Mock logic for later expansion)
        $locationText = (isset($validated['latitude']) && isset($validated['longitude'])) 
            ? 'GPS Pinned Location' 
            : 'Dipolog City Port';

        $catch = FishCatch::create([
            'user_id' => $user ? $user->id : null,
            'species' => $validated['species'],
            'weight' => $validated['weight'],
            'location' => $locationText,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Geospatial catch securely logged',
            'data' => $catch
        ], 201);
    }
}