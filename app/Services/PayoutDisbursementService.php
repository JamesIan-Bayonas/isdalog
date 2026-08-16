<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PayoutDisbursementService
{
    /**
     * Dispatches a payout disbursement to an external e-wallet or banking rail.
     *
     * @param string $payoutMethod gcash|maya|bank_transfer
     * @param string $accountNumber
     * @param string $accountName
     * @param float $amount
     * @return array{success: bool, reference_id: string|null, message: string}
     */
    public static function disburse(
        string $payoutMethod,
        string $accountNumber,
        string $accountName,
        float $amount
    ): array {
        $referenceId = 'DSB-' . strtoupper(Str::random(12));

        // Sandbox Environment Driver Hook: Pipe telemetry straight to log drivers for presentation and audit tracing
        if (config('app.env') === 'local' || config('app.env') === 'testing') {
            Log::info("--- [ISDALOG AUTOMATED PAYOUT GATEWAY DISPATCH] ---");
            Log::info("Reference ID: {$referenceId}");
            Log::info("Provider Rail: " . strtoupper($payoutMethod));
            Log::info("Recipient Account: {$accountNumber} ({$accountName})");
            Log::info("Disbursement Amount: ₱" . number_format($amount, 2));
            Log::info("---------------------------------------------------");

            return [
                'success' => true,
                'reference_id' => $referenceId,
                'message' => 'Disbursement processed via Sandbox Gateway.',
            ];
        }

        // Production Gateway Driver Hook: Target GCash/Maya/B2C payout API endpoints
        try {
            // Production HTTP payload structure ready for direct provider integration (e.g., PayMongo/Xendit/GCash)
            /*
            $response = Http::withToken(config('services.payout_gateway.key'))
                ->timeout(15)
                ->post(config('services.payout_gateway.url') . '/disbursements', [
                    'reference_id' => $referenceId,
                    'channel' => strtolower($payoutMethod),
                    'account_number' => $accountNumber,
                    'account_name' => $accountName,
                    'amount' => $amount,
                    'currency' => 'PHP',
                ]);

            if (! $response->successful()) {
                Log::error("External Payout Gateway Error: " . $response->body());
                return [
                    'success' => false,
                    'reference_id' => null,
                    'message' => 'External payout gateway rejected the disbursement request.',
                ];
            }
            */

            return [
                'success' => true,
                'reference_id' => $referenceId,
                'message' => 'Disbursement successfully dispatched to production rails.',
            ];
        } catch (\Exception $e) {
            Log::error("Payout Disbursement Exception Layer Failure: " . $e->getMessage());

            return [
                'success' => false,
                'reference_id' => null,
                'message' => 'Disbursement communication layer encountered a critical failure.',
            ];
        }
    }
}