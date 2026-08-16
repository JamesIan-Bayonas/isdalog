<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherTelemetryService
{
    /**
     * Fetches real-time environmental metrics from Open-Meteo based on geospatial coordinates.
     *
     * @param float $latitude
     * @param float $longitude
     * @return array{wind_speed: float|null, temperature: float|null, weather_condition: string|null}
     */
    public static function capture(float $latitude, float $longitude): array
    {
        try {
            $response = Http::timeout(5)->get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'current_weather' => true,
            ]);

            if ($response->successful()) {
                $current = $response->json('current_weather');

                return [
                    'wind_speed' => isset($current['windspeed']) ? (float) $current['windspeed'] : null,
                    'temperature' => isset($current['temperature']) ? (float) $current['temperature'] : null,
                    'weather_condition' => isset($current['weathercode']) ? 'WMO-' . $current['weathercode'] : 'Normal',
                ];
            }
        } catch (\Exception $e) {
            Log::warning("Weather Telemetry Service capture failed: " . $e->getMessage());
        }

        return [
            'wind_speed' => null,
            'temperature' => null,
            'weather_condition' => null,
        ];
    }
}