<?php

namespace App\Services;

use Illuminate\Support\Str;

class PayoutDisbursementService
{
    public static function sandboxEnabled(): bool
    {
        return app()->environment(['local', 'testing']) && config('payouts.driver') === 'sandbox';
    }

    /** A simulator acknowledgement is not a payment confirmation. No account details are logged. */
    public static function disburse(string $payoutMethod, string $accountNumber, string $accountName, float $amount, ?string $referenceId = null): array
    {
        if (! self::sandboxEnabled() || $payoutMethod !== 'gcash') {
            return ['success' => false, 'reference_id' => null, 'message' => 'GCash live payouts are not configured.'];
        }
        $referenceId ??= 'DSB-'.strtoupper(Str::random(12));
        return [
            'success' => true, 'reference_id' => $referenceId,
            'provider_reference' => 'SIM-'.$referenceId, 'status' => 'processing',
            'message' => 'Simulation accepted. No money has been sent.',
        ];
    }
}
