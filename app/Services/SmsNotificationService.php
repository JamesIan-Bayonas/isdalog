<?php // File: isdalog/app/Services/SmsNotificationService.php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class SmsNotificationService
{
    public static function send(string $phoneNumber, string $message): bool
    {
        if (IntegrationState::smsSimulationEnabled()) {
            // Never log recipient numbers, message bodies or handover codes.
            Log::info('SMS simulation recorded. No text message was sent.');

            return true;
        }
        Log::warning('SMS unavailable: no live provider is configured.');

        return false;
    }
}
