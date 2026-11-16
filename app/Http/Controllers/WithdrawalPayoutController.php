<?php

namespace App\Http\Controllers;

use App\Models\WithdrawalRequest;
use App\Services\PayoutDisbursementService;
use App\Services\WithdrawalPayoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WithdrawalPayoutController extends Controller
{
    public function start(Request $request, WithdrawalRequest $withdrawal, WithdrawalPayoutService $service)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $service->start($withdrawal, $request->user());
        return back()->with('success', 'GCash simulation started. No money has been sent.');
    }

    public function simulate(Request $request, WithdrawalRequest $withdrawal, WithdrawalPayoutService $service)
    {
        abort_unless($request->user()->role === 'admin', 403);
        abort_unless(PayoutDisbursementService::sandboxEnabled(), 503);
        $validated = $request->validate(['outcome' => ['required', 'in:paid,failed']]);
        $payout = $withdrawal->payout()->firstOrFail();
        try {
            $service->reconcile([
                'event_id' => 'sim-'.Str::uuid(), 'reference' => $payout->reference,
                'status' => $validated['outcome'], 'amount' => $withdrawal->amount, 'currency' => 'PHP',
                'failure_reason' => $validated['outcome'] === 'failed' ? 'Simulated GCash transfer failure.' : null,
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
            if ($exception->getStatusCode() !== 409) {
                throw $exception;
            }
            throw \Illuminate\Validation\ValidationException::withMessages(['payout' => 'This simulation is already final. Refresh to see its result.']);
        }
        return back()->with('success', $validated['outcome'] === 'failed'
            ? 'Simulated failure recorded. Reserved funds returned once.'
            : 'Simulated payment completion recorded. No real GCash transfer occurred.');
    }

    /** IsdaLog simulator protocol, not a vendor-specific GCash webhook. */
    public function callback(Request $request, WithdrawalPayoutService $service)
    {
        abort_unless(PayoutDisbursementService::sandboxEnabled() && config('payouts.callback_secret'), 503);
        $timestamp = $request->header('X-Payout-Timestamp', '');
        $signature = $request->header('X-Payout-Signature', '');
        abort_unless(preg_match('/^\d{10}$/', $timestamp) && abs(now()->timestamp - (int) $timestamp) <= config('payouts.callback_tolerance_seconds'), 401);
        abort_if(strlen($request->getContent()) > 16384, 413);
        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), config('payouts.callback_secret'));
        abort_unless(hash_equals($expected, $signature), 401);
        $payload = $request->validate([
            'event_id' => ['required', 'string', 'max:100'],
            'reference' => ['required', 'string', 'max:64'],
            'status' => ['required', 'in:paid,failed'],
            'amount' => ['required', 'string', 'regex:/^\d{1,10}\.\d{2}$/'],
            'currency' => ['required', 'in:PHP'],
            'failure_reason' => ['nullable', 'required_if:status,failed', 'string', 'max:255'],
        ]);
        return response()->json(['result' => $service->reconcile($payload)]);
    }
}
