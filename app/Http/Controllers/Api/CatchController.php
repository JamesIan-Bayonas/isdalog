<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catch;
use App\Models\User;
use Illuminate\Http\Request;

class CatchController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'telegram_chat_id' => 'required|string|exists:users,telegram_chat_id',
            'species' => 'required|string|max:255',
            'weight' => 'required|numeric|min:0|max:1000',  // Adjust bounds as needed
            'location' => 'nullable|string|max:255',
        ]);

        // Find user by chat_id
        $user = User::where('telegram_chat_id', $request->telegram_chat_id)->first();

        // Create catch record
        $catch = FishCatch::create([
            'user_id' => $user->id,
            'species' => $request->species,
            'weight' => $request->weight,
            'location' => $request->location ?? 'Dipolog City Port',
        ]);

        return response()->json(['catch_id' => $catch->id, 'message' => 'Catch logged successfully']);
    }
}