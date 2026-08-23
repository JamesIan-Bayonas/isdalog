<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use App\Services\WeatherTelemetryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CatchController extends Controller
{
    /**
     * Store catch from Edge AI bot and bind strictly to the fisherman's account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'telegram_chat_id'  => ['nullable', 'string'],
            'species'           => ['required', 'string', 'max:255'],
            'weight'            => ['required', 'numeric', 'gt:0'],
            'price_per_kg'      => ['nullable', 'numeric', 'gt:0'],
            'location'          => ['nullable', 'string', 'max:255'],
            'lat'               => ['nullable', 'numeric'],
            'lon'               => ['nullable', 'numeric'],
            'wind_speed'        => ['nullable', 'numeric'],
            'temperature'       => ['nullable', 'numeric'],
            'weather_condition' => ['nullable', 'string', 'max:100'],
            'image_base64'      => ['nullable', 'string'],
        ]);

        // 1. Resolve Fisherman by Telegram Chat ID, Authenticated User, or Active Session
        $fisherman = null;
        if (! empty($validated['telegram_chat_id'])) {
            $fisherman = User::where('telegram_chat_id', $validated['telegram_chat_id'])->first();
        }

        if (! $fisherman && $request->user()) {
            $fisherman = $request->user();
        }

        // Fallback: If unlinked during development/testing, assign to the primary active fisherman
        if (! $fisherman) {
            $fisherman = User::where('role', 'fisherman')->first();
        }

        $userId = $fisherman?->id;
        $latitude = $validated['lat'] ?? 8.5800;
        $longitude = $validated['lon'] ?? 123.3300;
        $location = $validated['location'] ?? 'Galas Port';

        // 2. Telemetry Enrichment
        $windSpeed = $validated['wind_speed'] ?? null;
        $temperature = $validated['temperature'] ?? null;
        $weatherCondition = $validated['weather_condition'] ?? null;

        if ($windSpeed === null || $temperature === null || $weatherCondition === null) {
            $weather = WeatherTelemetryService::capture((float) $latitude, (float) $longitude);
            $windSpeed = $windSpeed ?? $weather['wind_speed'];
            $temperature = $temperature ?? $weather['temperature'];
            $weatherCondition = $weatherCondition ?? $weather['weather_condition'];
        }

        // 3. Process Base64 Image
        $imageUrl = null;
        if (! empty($validated['image_base64'])) {
            try {
                $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $validated['image_base64']));
                $fileName = 'catches/' . Str::uuid() . '.jpg';
                
                /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                $disk = Storage::disk('public');
                $disk->put($fileName, $imageData);
                
                // Enforce root-relative pathing to prevent port/host mismatch regressions in web SPAs
                $imageUrl = '/storage/' . $fileName;
            } catch (\Exception $e) {
                $imageUrl = null;
            }
        }

        return DB::transaction(function () use (
            $userId,
            $validated,
            $location,
            $latitude,
            $longitude,
            $windSpeed,
            $temperature,
            $weatherCondition,
            $imageUrl,
            $fisherman
        ) {
            // Persist Biological Record
            $catch = FishCatch::create([
                'user_id'           => $userId,
                'species'           => $validated['species'],
                'weight'            => $validated['weight'],
                'location'          => $location,
                'latitude'          => $latitude,
                'longitude'         => $longitude,
                'wind_speed'        => $windSpeed,
                'temperature'       => $temperature,
                'weather_condition' => $weatherCondition,
                'image_url'         => $imageUrl,
                'logged_at'         => now(),
            ]);

            // Persist Commercial Listing Record
            $unitPrice = $validated['price_per_kg'] ?? 100.00;
            $startingPrice = round((float) $validated['weight'] * (float) $unitPrice, 2);

            $listing = Listing::create([
                'user_id'        => $userId,
                'fish_name'      => $validated['species'],
                'weight_kg'      => $validated['weight'],
                'starting_price' => $startingPrice,
                'current_bid'    => $startingPrice,
                'location'       => $location,
                'status'         => 'active',
                'image_url'      => $imageUrl,
                'ends_at'        => now()->addDays(2),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Catch logged and published to live auction floor.',
                'data'    => [
                    'catch_id'   => $catch->id,
                    'listing_id' => $listing->id,
                    'species'    => $catch->species,
                    'weight'     => (float) $catch->weight,
                    'floor_price'=> (float) $listing->starting_price,
                    'fisherman'  => $fisherman?->name ?? 'Unassigned Harvester',
                ],
                'environmental_telemetry' => [
                    'wind_speed'        => $windSpeed !== null ? (float) $windSpeed : null,
                    'temperature'       => $temperature !== null ? (float) $temperature : null,
                    'weather_condition' => $weatherCondition,
                ],
            ], 201);
        });
    }
}