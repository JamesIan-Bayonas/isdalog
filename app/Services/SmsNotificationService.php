<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class SmsNotificationService
{
    /**
     * Dispatch a localized cellular notification to a target subscriber node.
     */
    public static function send(string $phoneNumber, string $message): bool
    {
        // Clean and sanitize local Philippine mobile number tracking formats
        $formattedNumber = preg_replace('/[^0-9]/', '', $phoneNumber);
        
        if (str_starts_with($formattedNumber, '09')) {
            $formattedNumber = '639' . substr($formattedNumber, 2);
        }

        // Sandbox Environment Driver Hook: Pipes texts straight to files for presentation loops
        if (config('app.env') === 'local') {
            Log::info("--- [ISDALOG SMS GATEWAY SANDBOX DISPATCH] ---");
            Log::info("To: +{$formattedNumber}");
            Log::info("Message: {$message}");
            Log::info("---------------------------------------------");
            return true;
        }

        // Production Gateway Driver Hook: Ready for external API connection (e.g., Infobip/Twilio)
        try {
            // $response = Http::post('https://api.sms-gateway.example/send', [...]);
            return true;
        } catch (\Exception $e) {
            Log::error("SMS Transmission Exception Layer Failure: " . $e->getMessage());
            return false;
        }
    }
}