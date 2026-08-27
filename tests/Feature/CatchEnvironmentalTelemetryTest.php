<?php

namespace Tests\Feature;

use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatchEnvironmentalTelemetryTest extends TestCase
{
    use RefreshDatabase;

    public function test_catch_logging_persists_provided_environmental_telemetry(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'telegram_chat_id' => '987654321',
        ]);

        $response = $this->postJson('/api/catches', [
            'telegram_chat_id' => '987654321',
            'species' => 'Yellowfin Tuna',
            'weight' => 45.5,
            'lat' => 8.5800,
            'lon' => 123.3300,
            'wind_speed' => 14.2,
            'temperature' => 28.5,
            'weather_condition' => 'WMO-0',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'environmental_telemetry' => [
                'wind_speed' => 14.2,
                'temperature' => 28.5,
                'weather_condition' => 'WMO-0',
            ],
        ]);

        $this->assertDatabaseHas('catches', [
            'user_id' => $fisherman->id,
            'species' => 'Yellowfin Tuna',
            'wind_speed' => 14.20,
            'temperature' => 28.50,
            'weather_condition' => 'WMO-0',
        ]);
    }

    public function test_catch_logging_auto_enriches_weather_when_not_provided(): void
    {
        Http::fake([
            'https://api.open-meteo.com/v1/forecast*' => Http::response([
                'current_weather' => [
                    'temperature' => 29.1,
                    'windspeed' => 18.4,
                    'weathercode' => 1,
                ],
            ], 200),
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'telegram_chat_id' => '123456789',
        ]);

        $response = $this->postJson('/api/catches', [
            'telegram_chat_id' => '123456789',
            'species' => 'Lapu-Lapu',
            'weight' => 12.0,
            'lat' => 8.5800,
            'lon' => 123.3300,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'environmental_telemetry' => [
                'wind_speed' => 18.4,
                'temperature' => 29.1,
                'weather_condition' => 'WMO-1',
            ],
        ]);

        $this->assertDatabaseHas('catches', [
            'user_id' => $fisherman->id,
            'species' => 'Lapu-Lapu',
            'wind_speed' => 18.40,
            'temperature' => 29.10,
            'weather_condition' => 'WMO-1',
        ]);
    }

    // File: tests/Feature/CatchEnvironmentalTelemetryTest.php
// Target Method: test_catch_logging_persists_root_relative_image_path

    public function test_catch_logging_persists_root_relative_image_path(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'telegram_chat_id' => '987654321',
        ]);

        $dummyBase64 = 'data:image/jpeg;base64,' . base64_encode('fake-image-binary-stream');

        $response = $this->postJson('/api/catches', [
            'telegram_chat_id' => '987654321',
            'species' => 'Sardines',
            'weight' => 12.0,
            'image_base64' => $dummyBase64,
        ]);

        $response->assertStatus(201);

        $catch = FishCatch::where('user_id', $fisherman->id)->latest('id')->first();
        $listing = Listing::where('user_id', $fisherman->id)->latest('id')->first();

        $this->assertNotNull($catch->image_url);
        $this->assertStringStartsWith('/storage/catches/', $catch->image_url);
        $this->assertStringStartsWith('/storage/catches/', $listing->image_url);
        $this->assertStringNotContainsString('http://localhost', $listing->image_url);
    }

    public function test_catch_logging_persists_s3_url_when_s3_driver_is_active(): void
    {
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'telegram_chat_id' => '1122334455',
        ]);

        $dummyBase64 = 'data:image/jpeg;base64,' . base64_encode('fake-binary-stream');

        $response = $this->postJson('/api/catches', [
            'telegram_chat_id' => '1122334455',
            'species'          => 'Silver Pomfret',
            'weight'           => 15.0,
            'image_base64'     => $dummyBase64,
        ]);

        $response->assertStatus(201);

        $listing = Listing::where('user_id', $fisherman->id)->latest('id')->first();
        $this->assertNotNull($listing);
        $this->assertNotNull($listing->image_url);
        $this->assertStringContainsString('catches/', $listing->image_url);

        // Verify storage persistence without triggering Intelephense adapter stub issues
        $files = Storage::disk('s3')->allFiles('catches');
        $this->assertNotEmpty($files);
    }
}