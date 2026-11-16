<?php // File: isdalog/app/Services/WithdrawalPayoutService.php

namespace App\Services;

use App\Models\User;
use App\Models\WithdrawalPayout;
use App\Models\WithdrawalRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WithdrawalPayoutService
{
    public function start(WithdrawalRequest $withdrawal, User $admin): WithdrawalPayout
    {
        abort_unless(PayoutDisbursementService::sandboxEnabled(), 503, 'Live payouts are not configured.');
        // Only the local simulator runs inside this transaction. A future network adapter needs an outbox.
        return DB::transaction(function () use ($withdrawal, $admin) {
            $record = WithdrawalRequest::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();
            if ($record->status !== 'approved' || $record->refund_transaction_id || $record->payment_method !== 'gcash') {
                throw ValidationException::withMessages(['payout' => 'Only approved, unrefunded GCash requests can start a payout.']);
            }
            if (WithdrawalPayout::where('withdrawal_request_id', $record->id)->exists()) {
                throw ValidationException::withMessages(['payout' => 'A payout already exists for this request. Do not send it again.']);
            }
            $reference = 'DSB-'.strtoupper((string) Str::uuid());
            $result = PayoutDisbursementService::disburse($record->payment_method, $record->account_number, $record->account_name, (float) $record->amount, $reference);
            if (! $result['success']) {
                throw ValidationException::withMessages(['payout' => $result['message']]);
            }
            return WithdrawalPayout::create([
                'withdrawal_request_id' => $record->id, 'reference' => $reference,
                'provider_reference' => $result['provider_reference'],
                'mode' => 'sandbox', 'status' => 'processing', 'initiated_by' => $admin->id,
            ]);
        });
    }

    /** Apply an authenticated terminal simulator event; repeated events cannot move funds twice. */
    public function reconcile(array $payload): string
    {
        abort_unless(PayoutDisbursementService::sandboxEnabled(), 503);
        return DB::transaction(function () use ($payload) {
            $found = WithdrawalPayout::where('reference', $payload['reference'])->firstOrFail();
            // All payout operations lock the request before its payout/account.
            $record = WithdrawalRequest::whereKey($found->withdrawal_request_id)->lockForUpdate()->firstOrFail();
            $payout = WithdrawalPayout::whereKey($found->id)->lockForUpdate()->firstOrFail();
            abort_unless($payout->mode === 'sandbox', 409);
            abort_unless($payload['currency'] === 'PHP' && $payload['amount'] === $record->amount, 422, 'Amount or currency does not match.');
            $hash = hash('sha256', json_encode([
                $payload['reference'], $payload['status'], $payload['amount'], $payload['currency'], $payload['failure_reason'] ?? null,
            ]));
            $event = DB::table('payout_events')->where('event_id', $payload['event_id'])->first();
            if ($event) {
                abort_unless((int) $event->withdrawal_payout_id === (int) $payout->id && hash_equals($event->payload_hash, $hash), 409, 'Event identifier was reused with different data.');
                return 'duplicate';
            }
            abort_unless($payout->status === 'processing' && ! $record->refund_transaction_id, 409, 'Payout is already final.');
            if ($payload['status'] === 'failed') {
                $refund = \App\Services\AccountLedger::move($record->user_id, \App\Services\AccountLedger::cents($record->amount), 'withdrawal_refund');
                $record->refund_transaction_id = $refund->id;
                $record->save();
                $payout->failed_at = now();
                $payout->refunded_at = now();
                $payout->failure_reason = $payload['failure_reason'];
            } else {
                $payout->paid_at = now();
            }
            $payout->status = $payload['status'];
            $payout->save();
            DB::table('payout_events')->insert([
                'withdrawal_payout_id' => $payout->id, 'event_id' => $payload['event_id'],
                'payload_hash' => $hash, 'status' => $payload['status'], 'created_at' => now(), 'updated_at' => now(),
            ]);
            app(WithdrawalNotificationService::class)->record(
                $record, 'payout_'.$payout->status,
                $payout->status === 'failed' ? 'Simulation failed — funds returned' : 'Simulation completed — no real GCash payment',
                'Request #'.$record->id.' · ₱'.number_format((float) $record->amount, 2).'. '
                    .($payout->status === 'failed' ? 'Reserved funds were returned to your available balance. Reason: '.$payout->failure_reason : 'This is a simulated completion. No real money was sent.')
            );
            return 'recorded';
        });
    }
}
