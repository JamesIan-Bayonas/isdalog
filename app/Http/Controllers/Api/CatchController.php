<?php

namespace App\Http\Controllers\Api;

use Illuminate\Routing\Controller;
use App\Models\FishCatch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\MarketPrice;
use App\Models\RestrictedSpecies;
class CatchController extends \App\Http\Controllers\Controller
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
        // 1. FIXED: Changed 'telegram_id' to 'telegram_chat_id' to match the Bot's payload
        $user = User::where('telegram_chat_id', $request->telegram_chat_id)->firstOrFail();

        // 2. Query the Market Engine for Price
        $priceRecord = MarketPrice::where('species', 'LIKE', '%' . $request->species . '%')->first();
        $estimatedValue = $priceRecord ? ($priceRecord->price_per_kg * $request->weight) : 0;

        // 3. Query the Regulatory Engine for Warnings
        $restriction = RestrictedSpecies::where('species', 'LIKE', '%' . $request->species . '%')->first();
        $warningFlag = $restriction ? $restriction->restriction_type : null;

        // 4. Save Catch to Database
        $catch = new FishCatch();
        $catch->user_id = $user->id;
        $catch->species = $request->species;
        $catch->weight = $request->weight;
        
        // 5. FIXED: Changed 'latitude' and 'longitude' to 'lat' and 'lon' to match the Bot's payload
        $catch->latitude = $request->lat;
        $catch->longitude = $request->lon;
        $catch->save();

        // 6. Send the enriched logistics data back to the Telegram Bot
        return response()->json([
            'message' => 'Catch logged successfully',
            'estimated_value' => $estimatedValue,
            'warning_flag' => $warningFlag
        ], 201);
    }
}