<?php

// File: isdalog/app/Http/Controllers/Api/CatchController.php

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
            'telegram_chat_id' => ['nullable', 'string', 'max:64'],
            'submission_id' => ['required', 'uuid'],
            'species' => ['required', 'string', 'max:255', 'regex:/\S/u'],
            'weight' => ['required', 'numeric', 'min:0.01', 'max:999999.99', 'decimal:0,2'],
            'price_per_kg' => ['nullable', 'numeric', 'min:0.01', 'max:99999999.99', 'decimal:0,2'],
            'location' => ['nullable', 'string', 'max:255', 'regex:/\S/u'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lon' => ['nullable', 'numeric', 'between:-180,180'],
            'wind_speed' => ['nullable', 'numeric'],
            'temperature' => ['nullable', 'numeric'],
            'weather_condition' => ['nullable', 'string', 'max:100'],
            'image_base64' => ['nullable', 'string', 'max:7000000'],
        ]);

        $weightUnits = \App\Services\AccountLedger::cents($validated['weight']);
        $unitCents = \App\Services\AccountLedger::cents($validated['price_per_kg'] ?? '100.00');
        $batchCents = intdiv($weightUnits * $unitCents + 50, 100);
        if ($batchCents < 1 || $batchCents > 9999999999) {
            throw \Illuminate\Validation\ValidationException::withMessages(['price_per_kg' => 'Batch total must be between ₱0.01 and ₱99,999,999.99.']);
        }

        $isBot = $request->attributes->get('authenticated_bot') === true;
        $fisherman = $isBot
            ? User::where('telegram_chat_id', $validated['telegram_chat_id'] ?? '')->first()
            : $request->user();
        abort_unless($fisherman && $fisherman->role === 'fisherman', 403, 'A linked fisherman account is required.');
        if (! $isBot && isset($validated['telegram_chat_id']) && $validated['telegram_chat_id'] !== $fisherman->telegram_chat_id) {
            abort(403, 'Catch ownership cannot be overridden.');
        }
        $userId = $fisherman->id;
        ksort($validated);
        $payloadHash = hash('sha256', json_encode($validated));

        // Serialize retries and binding changes on the owner row. Database uniqueness is a second guard.
        return DB::transaction(function () use ($validated, $fisherman, $userId, $payloadHash, $isBot, $batchCents) {
            $owner = User::whereKey($userId)->lockForUpdate()->firstOrFail();
            abort_unless($owner->role === 'fisherman' && (! $isBot || $owner->telegram_chat_id === ($validated['telegram_chat_id'] ?? null)), 403);
            $prior = DB::table('catch_submissions')->where('user_id', $userId)->where('submission_id', $validated['submission_id'])->first();
            if ($prior) {
                abort_unless(hash_equals($prior->payload_hash, $payloadHash), 409, 'Submission ID was reused with different details.');

                return response()->json(json_decode($prior->response, true), 200);
            }
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

            $imageUrl = null;
            $fileName = null;
            $diskName = config('filesystems.default') === 's3' ? 's3' : 'public';
            if (! empty($validated['image_base64'])) {
                $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $validated['image_base64']), true);
                $info = $imageData === false ? false : @getimagesizefromstring($imageData);
                if (! $info || ! in_array($info['mime'], ['image/jpeg', 'image/png', 'image/webp'], true) || strlen($imageData) > 5 * 1024 * 1024) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['image_base64' => 'Provide a valid JPEG, PNG or WebP image up to 5 MB.']);
                }
                $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$info['mime']];
                $fileName = 'catches/'.Str::uuid().'.'.$extension;
            }
            try {
                if ($fileName) {
                    if (! Storage::disk($diskName)->put($fileName, $imageData, 'public')) {
                        throw new \RuntimeException('Catch image storage failed.');
                    }
                    $imageUrl = $diskName === 's3' ? Storage::disk($diskName)->url($fileName) : '/storage/'.$fileName;
                }
                // Persist Biological Record
                $catch = FishCatch::create([
                    'user_id' => $userId,
                    'species' => $validated['species'],
                    'weight' => $validated['weight'],
                    'location' => $location,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'wind_speed' => $windSpeed,
                    'temperature' => $temperature,
                    'weather_condition' => $weatherCondition,
                    'image_url' => $imageUrl,
                    'logged_at' => now(),
                ]);

                // Persist Commercial Listing Record
                $startingPrice = \App\Services\AccountLedger::decimal($batchCents);

                $listing = Listing::create([
                    'catch_id' => $catch->id,
                    'user_id' => $userId,
                    'fish_name' => $validated['species'],
                    'weight_kg' => $validated['weight'],
                    'starting_price' => $startingPrice,
                    'current_bid' => $startingPrice,
                    'location' => $location,
                    'status' => 'active',
                    'image_url' => $imageUrl,
                    'ends_at' => now()->addDays(2),
                ]);

                $response = [
                    'status' => 'success',
                    'message' => 'Catch logged and published to live auction floor.',
                    'data' => [
                        'catch_id' => $catch->id,
                        'listing_id' => $listing->id,
                        'species' => $catch->species,
                        'weight' => (float) $catch->weight,
                        'floor_price' => (float) $listing->starting_price,
                        'fisherman' => $fisherman->name,
                    ],
                    'environmental_telemetry' => [
                        'wind_speed' => $windSpeed !== null ? (float) $windSpeed : null,
                        'temperature' => $temperature !== null ? (float) $temperature : null,
                        'weather_condition' => $weatherCondition,
                    ],
                ];
                DB::table('catch_submissions')->insert([
                    'user_id' => $userId, 'submission_id' => $validated['submission_id'],
                    'payload_hash' => $payloadHash, 'response' => json_encode($response),
                    'created_at' => now(), 'updated_at' => now(),
                ]);

                return response()->json($response, 201);
            } catch (\Throwable $exception) {
                \Illuminate\Support\Facades\Log::warning('Catch publication failed.', ['user_id' => $userId]);
                if ($fileName) {
                    try {
                        Storage::disk($diskName)->delete($fileName);
                    } catch (\Throwable $cleanup) {
                        \Illuminate\Support\Facades\Log::warning('Catch image cleanup failed.');
                    }
                }
                throw $exception;
            }
        });
    }
}
