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
use Illuminate\Support\Facades\DB;
use App\Models\Listing;
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
        // 1. Fetch the corresponding fisherman database user object
        $user = User::where('telegram_chat_id', $request->telegram_chat_id)->firstOrFail();

        // 2. Query Market Engine for Base Metrics Pricing
        $priceRecord = MarketPrice::where('species', 'LIKE', '%' . $request->species . '%')->first();
        $pricePerKg = $priceRecord ? $priceRecord->price_per_kg : 150.00; // Fallback to 150 if price missing
        $estimatedValue = $pricePerKg * $request->weight;

        // 3. Check Regulatory Compliance Warning Metrics
        $restriction = RestrictedSpecies::where('species', 'LIKE', '%' . $request->species . '%')->first();
        $warningFlag = $restriction ? $restriction->restriction_type : null;

        // Execute queries inside an isolated Database Transaction for safety
        $result = DB::transaction(function () use ($user, $request, $estimatedValue) {
            
            // 4. Record the log in the Fish Catch ledger
            $catch = new FishCatch();
            $catch->user_id = $user->id;
            $catch->species = $request->species;
            $catch->weight = $request->weight;
            $catch->latitude = $request->lat;
            $catch->longitude = $request->lon;
            $catch->save();

            // 5. FIXED/ADDED: Create the corresponding Crate row inside the public marketplace floor
            $listing = new Listing();
            $listing->user_id = $user->id;
            $listing->fish_name = $request->species;
            $listing->weight_kg = $request->weight;
            $listing->starting_price = $estimatedValue;
            $listing->current_bid = $estimatedValue;
            $listing->location = 'Galas Port'; // Default location metadata context
            $listing->status = 'active';
            $listing->ends_at = now()->addHours(24); // 24-hour auction bidding duration
            $listing->save();

            return $catch;
        });

        // 6. Send response back out to your external Node.js bot tunnel service
        return response()->json([
            'status' => 'success',
            'message' => 'Catch parsed and published to marketplace successfully',
            'estimated_value' => $estimatedValue,
            'warning_flag' => $warningFlag
        ], 201);
    }
}