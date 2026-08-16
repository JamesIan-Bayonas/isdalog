<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\MarketPrice;
use App\Models\RestrictedSpecies;
use App\Models\User;
use App\Services\WeatherTelemetryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CatchController extends Controller
{
    public function handshake(Request $request): JsonResponse
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
                'password' => Hash::make(Str::random(16)),
                'role' => 'fisherman',
                'status' => 'verified',
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Identity handshake completed',
            'user' => $user,
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'telegram_chat_id' => 'required|string',
            'species' => 'required|string|max:255',
            'weight' => 'required|numeric|min:0.01',
            'lat' => 'nullable|numeric',
            'lon' => 'nullable|numeric',
            'wind_speed' => 'nullable|numeric',
            'temperature' => 'nullable|numeric',
            'weather_condition' => 'nullable|string|max:100',
        ]);

        // 1. Dynamic User Resolution & Automatic Linkage Pipeline
        $user = User::where('telegram_chat_id', $validated['telegram_chat_id'])->first();

        if (!$user) {
            $unlinkedFisherman = User::where('role', 'fisherman')
                ->whereNull('telegram_chat_id')
                ->latest()
                ->first();

            if ($unlinkedFisherman) {
                $unlinkedFisherman->update([
                    'telegram_chat_id' => $validated['telegram_chat_id'],
                ]);
                $user = $unlinkedFisherman;
            } else {
                $user = User::where('role', 'fisherman')->latest()->first() ?? User::first();
            }
        }

        // 2. Geospatial & Environmental Telemetry Enrichment
        $latitude = isset($validated['lat']) ? (float) $validated['lat'] : 8.5800;
        $longitude = isset($validated['lon']) ? (float) $validated['lon'] : 123.3300;

        $windSpeed = $validated['wind_speed'] ?? null;
        $temperature = $validated['temperature'] ?? null;
        $weatherCondition = $validated['weather_condition'] ?? null;

        if ($windSpeed === null && $temperature === null) {
            $capturedWeather = WeatherTelemetryService::capture($latitude, $longitude);
            $windSpeed = $capturedWeather['wind_speed'];
            $temperature = $capturedWeather['temperature'];
            $weatherCondition = $capturedWeather['weather_condition'];
        }

        // 3. Market Pricing Engine Query
        $priceRecord = MarketPrice::where('species', 'LIKE', '%' . $validated['species'] . '%')->first();
        $pricePerKg = $priceRecord ? (float) $priceRecord->price_per_kg : 150.00;
        $estimatedValue = round($pricePerKg * (float) $validated['weight'], 2);

        // 4. Regulatory Compliance Check
        $restriction = RestrictedSpecies::where('species', 'LIKE', '%' . $validated['species'] . '%')->first();
        $warningFlag = $restriction ? $restriction->restriction_type : null;

        // 5. Atomic Database Transaction
        $catch = DB::transaction(function () use ($user, $validated, $latitude, $longitude, $windSpeed, $temperature, $weatherCondition, $estimatedValue) {
            $newCatch = FishCatch::create([
                'user_id' => $user->id,
                'species' => $validated['species'],
                'weight' => $validated['weight'],
                'location' => 'Galas Port',
                'latitude' => $latitude,
                'longitude' => $longitude,
                'wind_speed' => $windSpeed,
                'temperature' => $temperature,
                'weather_condition' => $weatherCondition,
                'logged_at' => now(),
            ]);

            Listing::create([
                'user_id' => $user->id,
                'fish_name' => $validated['species'],
                'weight_kg' => $validated['weight'],
                'starting_price' => $estimatedValue,
                'current_bid' => $estimatedValue,
                'location' => 'Galas Port',
                'status' => 'active',
                'ends_at' => now()->addHours(24),
            ]);

            return $newCatch;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Catch parsed and published to marketplace successfully',
            'user_id' => $user->id,
            'catch_id' => $catch->id,
            'estimated_value' => $estimatedValue,
            'warning_flag' => $warningFlag,
            'environmental_telemetry' => [
                'wind_speed' => $catch->wind_speed,
                'temperature' => $catch->temperature,
                'weather_condition' => $catch->weather_condition,
            ],
        ], 201);
    }
}