<?php

// app/Http/Controllers/Api/CatchController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use App\Services\WeatherTelemetryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CatchController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'telegram_chat_id' => ['required', 'string'],
            'species' => ['required', 'string', 'max:255'],
            'weight' => ['required', 'numeric', 'min:0.1'],
            'price_per_kg' => ['nullable', 'numeric', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric'],
            'lon' => ['nullable', 'numeric'],
            'image_base64' => ['nullable', 'string'],
            'wind_speed' => ['nullable', 'numeric'],
            'temperature' => ['nullable', 'numeric'],
            'weather_condition' => ['nullable', 'string'],
        ]);

        $user = User::where('telegram_chat_id', $validated['telegram_chat_id'])->first();

        // 1. Process Base64 Image if present
        $imageUrl = null;
        if (!empty($validated['image_base64'])) {
            $imageBinary = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $validated['image_base64']));
            $fileName = 'catches/' . Str::uuid() . '.jpg';
            Storage::disk('public')->put($fileName, $imageBinary);
            $imageUrl = Storage::url($fileName);
        }

        // 2. Resolve Telemetry
        $lat = $validated['lat'] ?? 8.5800;
        $lon = $validated['lon'] ?? 123.3300;
        $windSpeed = $validated['wind_speed'] ?? null;
        $temperature = $validated['temperature'] ?? null;
        $weatherCondition = $validated['weather_condition'] ?? null;

        if ($windSpeed === null || $temperature === null) {
            $weather = WeatherTelemetryService::capture($lat, $lon);
            $windSpeed = $weather['wind_speed'] ?? $windSpeed;
            $temperature = $weather['temperature'] ?? $temperature;
            $weatherCondition = $weather['weather_condition'] ?? $weatherCondition;
        }

        // 3. Persist Catch Record
        $catch = FishCatch::create([
            'user_id' => $user?->id,
            'species' => $validated['species'],
            'image_url' => $imageUrl,
            'weight' => $validated['weight'],
            'location' => $validated['location'] ?? 'Galas Port',
            'latitude' => $lat,
            'longitude' => $lon,
            'wind_speed' => $windSpeed,
            'temperature' => $temperature,
            'weather_condition' => $weatherCondition,
            'logged_at' => now(),
        ]);

        // 4. Create Active Marketplace Listing with the Image
        $pricePerKg = $validated['price_per_kg'] ?? 150.00;
        $startingPrice = round($validated['weight'] * $pricePerKg, 2);

        $listing = Listing::create([
            'user_id' => $user?->id,
            'fish_name' => $validated['species'],
            'image_url' => $imageUrl,
            'weight_kg' => $validated['weight'],
            'starting_price' => $startingPrice,
            'current_bid' => $startingPrice,
            'location' => $validated['location'] ?? 'Galas Port',
            'status' => 'active',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Catch logged and published to marketplace successfully.',
            'catch_id' => $catch->id,
            'listing_id' => $listing->id,
            'image_url' => $imageUrl,
            'environmental_telemetry' => [
                'wind_speed' => $windSpeed,
                'temperature' => $temperature,
                'weather_condition' => $weatherCondition,
            ],
        ], 201);
    }
}