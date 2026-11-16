<?php // File: isdalog/app/Services/IntegrationState.php

namespace App\Services;

class IntegrationState
{
    public static function demoFundingEnabled(): bool
    {
        return in_array(config('app.env'), ['local', 'testing'], true) && config('integrations.funding_driver') === 'demo';
    }

    public static function smsSimulationEnabled(): bool
    {
        return in_array(config('app.env'), ['local', 'testing'], true) && config('integrations.sms_driver') === 'log';
    }

    public static function publicState(): array
    {
        return ['demoFundingEnabled' => self::demoFundingEnabled(), 'liveFundingAvailable' => false,
            'fundingLabel' => self::demoFundingEnabled() ? 'Demo credit — no real payment' : 'Wallet funding unavailable',
            'smsMode' => self::smsSimulationEnabled() ? 'simulation' : 'unavailable', 'liveSmsAvailable' => false];
    }
}
