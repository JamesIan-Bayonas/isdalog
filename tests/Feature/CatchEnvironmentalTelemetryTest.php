<?php

namespace Tests\Feature;

use App\Models\FishCatch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
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
}